import { useState, useEffect, useRef } from "react";
import { Send, UserRound, MessageCircle, Clock, CheckCircle2, ChevronLeft, CheckCheck, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { messages as messagesApi } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { useSocket } from "@/lib/SocketContext";

export default function DashMessages() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeContactId, setActiveContactId] = useState(null);
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Fetch all messages initially
  useEffect(() => {
    fetchMessages();
  }, []);

  async function fetchMessages() {
    try {
      const data = await messagesApi.list();
      // sort by oldest to newest so chat bubbles flow top down
      data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      setMessages(data);
    } catch (err) {
      toast.error(err.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }

  // Socket listener for new messages and typing
  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (newMsg) => {
      setMessages((prev) => {
        if (prev.find(m => m._id === newMsg._id)) return prev;
        return [...prev, newMsg];
      });
      // Clear typing indicator when a message is received from them
      if (newMsg.senderId) {
        setTypingUsers(prev => {
          const next = new Set(prev);
          next.delete(toId(newMsg.senderId));
          return next;
        });
      }
    };

    const handleTyping = ({ senderId }) => {
      if (!senderId) return;
      setTypingUsers(prev => {
        const next = new Set(prev);
        next.add(toId(senderId));
        return next;
      });
    };

    const handleStopTyping = ({ senderId }) => {
      if (!senderId) return;
      setTypingUsers(prev => {
        const next = new Set(prev);
        next.delete(toId(senderId));
        return next;
      });
    };
    
    socket.on("newMessage", handleNewMessage);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);
    
    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
    };
  }, [socket]);

  // Helper: extract a consistent string ID from a populated ref or plain id
  const toId = (ref) => String(ref?._id || ref?.id || ref || "");

  // Group messages by the other party in the conversation
  const conversationsMap = {};
  const myId = toId(user);
  messages.forEach(msg => {
    const senderIdStr = toId(msg.senderId);
    const recipientIdStr = toId(msg.recipientId);

    // Determine the "other" party
    const isSentByMe = senderIdStr === myId;
    const other = isSentByMe ? msg.recipientId : msg.senderId;
    if (!other) return;

    const contactId = toId(other);
    // Skip if the other party somehow resolves to ourselves (self-message)
    if (!contactId || contactId === myId) return;
    
    if (!conversationsMap[contactId]) {
      conversationsMap[contactId] = {
        contact: typeof other === "object" ? other : { _id: contactId },
        messages: [],
        lastMessage: msg,
        unreadCount: 0,
      };
    }
    conversationsMap[contactId].messages.push(msg);
    if (new Date(msg.createdAt) > new Date(conversationsMap[contactId].lastMessage.createdAt)) {
      conversationsMap[contactId].lastMessage = msg;
    }
    if (recipientIdStr === myId && !msg.readAt) {
      conversationsMap[contactId].unreadCount++;
    }
  });

  const conversations = Object.values(conversationsMap).sort((a, b) => 
    new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
  );

  const activeConversation = activeContactId ? conversationsMap[activeContactId] : null;

  // Scroll to bottom when conversation changes or new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeConversation?.messages?.length, activeContactId]);

  // Mark all unread in active conversation as read
  useEffect(() => {
    if (activeConversation && activeConversation.unreadCount > 0) {
      const unreadIds = activeConversation.messages
        .filter(m => toId(m.recipientId) === myId && !m.readAt)
        .map(m => m._id);
        
      Promise.all(unreadIds.map(id => messagesApi.markRead(id)))
        .then(() => {
          setMessages(prev => prev.map(m => unreadIds.includes(m._id) ? { ...m, readAt: new Date().toISOString() } : m));
        })
        .catch(console.error);
    }
  }, [activeContactId, activeConversation?.messages?.length]); // trigger when new messages arrive

  async function handleSend(e) {
    e.preventDefault();
    if (!replyBody.trim() || !activeContactId) return;

    setSending(true);
    try {
      // Find influencerId if it was ever used in this thread
      const lastMsgWithInf = activeConversation.messages.find(m => m.influencerId);
      
      const newMsg = await messagesApi.send({
        recipientId: activeContactId,
        influencerId: lastMsgWithInf?.influencerId || null,
        subject: "Chat Message", // backend requires subject, though we don't display it prominently in WhatsApp UI
        body: replyBody,
      });
      
      // Append locally for instant feedback
      setMessages((prev) => {
        if (prev.find(m => m._id === newMsg._id)) return prev;
        return [...prev, newMsg];
      });
      
      setReplyBody("");
      if (socket && activeContactId) {
        socket.emit("stopTyping", { recipientId: activeContactId });
      }
    } catch (err) {
      toast.error(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const handleTypingChange = (e) => {
    setReplyBody(e.target.value);
    
    if (socket && activeContactId) {
      socket.emit("typing", { recipientId: activeContactId });
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stopTyping", { recipientId: activeContactId });
      }, 2000);
    }
  };

  function formatTime(dateString) {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-xl border border-border surface-panel animate-pulse">
        <div className="w-full lg:w-1/3 border-r border-border p-4 space-y-4">
          <div className="h-8 w-1/3 bg-muted rounded-md mb-8"></div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-3 items-center">
              <div className="h-12 w-12 rounded-full bg-muted"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/2 bg-muted rounded-md"></div>
                <div className="h-3 w-3/4 bg-muted/50 rounded-md"></div>
              </div>
            </div>
          ))}
        </div>
        <div className="hidden lg:flex flex-1 items-center justify-center">
          <MessageCircle className="size-12 text-muted/30" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-xl border border-border surface-panel shadow-sm bg-background">
      
      {/* Left Pane: Conversations List */}
      <div className={`w-full lg:w-[350px] border-r border-border flex flex-col h-full bg-muted/5 ${activeContactId ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-4 border-b border-border bg-card flex items-center justify-between">
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            Messages
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center h-full text-muted-foreground">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 mb-4">
                <MessageCircle className="size-8 opacity-40" />
              </div>
              <p className="text-sm">No conversations yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {conversations.map((conv) => {
                const isSelected = activeContactId === conv.contact._id;
                
                return (
                  <button
                    key={conv.contact._id}
                    onClick={() => setActiveContactId(conv.contact._id)}
                    className={`w-full text-left p-4 flex items-center gap-3 transition-colors hover:bg-muted/50 ${isSelected ? 'bg-primary/5' : ''}`}
                  >
                    <div className="relative">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <UserRound className="size-6" />
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground border-2 border-background">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="text-sm font-semibold truncate text-foreground">
                          {conv.contact.fullName || conv.contact.email}
                        </span>
                        <span className={`text-[10px] whitespace-nowrap ml-2 ${conv.unreadCount > 0 ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                          {formatTime(conv.lastMessage.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                        {toId(conv.lastMessage.senderId) === myId && (
                          conv.lastMessage.readAt ? <CheckCheck className="size-3 text-primary" /> : <Check className="size-3" />
                        )}
                        <span className="truncate">{conv.lastMessage.body}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Pane: Chat Window */}
      <div className={`flex-1 flex flex-col h-full bg-[#f0f2f5] dark:bg-[#0b141a] ${!activeContactId ? 'hidden lg:flex' : 'flex'}`}>
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-3 px-4 border-b border-border bg-card flex items-center gap-3 shadow-sm z-10">
              <button 
                className="lg:hidden p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground"
                onClick={() => setActiveContactId(null)}
              >
                <ChevronLeft className="size-5" />
              </button>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserRound className="size-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold leading-none">
                  {activeConversation.contact.fullName || activeConversation.contact.email}
                </h3>
              </div>
            </div>
            
            {/* Chat Messages Area */}
            <div 
              className="flex-1 overflow-y-auto p-4 space-y-3"
              style={{
                backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")',
                backgroundSize: '100px',
                opacity: 0.95
              }}
            >
              {activeConversation.messages.map((msg, index) => {
                const senderIdStr = toId(msg.senderId);
                const isMe = senderIdStr === myId;
                const nextSenderIdStr = toId(activeConversation.messages[index + 1]?.senderId);
                const showTail = index === activeConversation.messages.length - 1 || 
                                 nextSenderIdStr !== senderIdStr;
                
                return (
                  <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div 
                      className={`relative max-w-[75%] md:max-w-[60%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                        isMe 
                          ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                          : 'bg-card text-card-foreground rounded-tl-sm border border-border/50'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                      <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        <span>{formatTime(msg.createdAt)}</span>
                        {isMe && (
                          msg.readAt ? <CheckCheck className="size-3" /> : <Check className="size-3" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {typingUsers.has(activeContactId) && (
                <div className="flex justify-start animate-in fade-in zoom-in duration-200">
                  <div className="bg-card text-card-foreground rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-border/50">
                    <div className="flex gap-1.5 items-center h-4">
                      <span className="h-1.5 w-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="h-1.5 w-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="h-1.5 w-1.5 bg-muted-foreground/40 rounded-full animate-bounce"></span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* Message Input Area */}
            <div className="p-3 bg-card border-t border-border">
              <form onSubmit={handleSend} className="flex items-end gap-2 max-w-4xl mx-auto">
                <Textarea
                  value={replyBody}
                  onChange={handleTypingChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  className="min-h-[44px] max-h-[120px] resize-none bg-muted/50 border-transparent focus-visible:ring-1 rounded-2xl py-3"
                  rows={1}
                />
                <Button 
                  type="submit" 
                  size="icon"
                  className="h-11 w-11 rounded-full shrink-0" 
                  disabled={sending || !replyBody.trim()}
                >
                  <Send className="size-5" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-card">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted/30 mb-6">
              <MessageCircle className="size-12 opacity-20" />
            </div>
            <h2 className="text-xl font-display font-semibold text-foreground mb-2">Influbrand Messages</h2>
            <p className="text-sm max-w-md text-center">
              Select a conversation from the left to start real-time chatting with brands and creators.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
