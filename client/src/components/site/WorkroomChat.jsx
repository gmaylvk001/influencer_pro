import { useState, useEffect, useRef } from "react";
import { Send, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { messages as messagesApi } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { useSocket } from "@/lib/SocketContext";

export function WorkroomChat({ recipientId }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    fetchMessages();
  }, [recipientId]);

  async function fetchMessages() {
    if (!recipientId) return;
    try {
      const data = await messagesApi.list();
      // Filter messages to only those between me and recipientId
      const myIdStr = String(user?._id || user?.id || "");
      const recipientIdStr = String(recipientId);
      
      const filtered = data.filter(msg => {
        const sender = String(msg.senderId?._id || msg.senderId || "");
        const rec = String(msg.recipientId?._id || msg.recipientId || "");
        return (sender === myIdStr && rec === recipientIdStr) || 
               (sender === recipientIdStr && rec === myIdStr);
      });
      
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      setMessages(filtered);
    } catch (err) {
      toast.error("Failed to load messages");
    }
  }

  // Socket listener
  useEffect(() => {
    if (!socket || !recipientId) return;
    
    const handleNewMessage = (newMsg) => {
      const myIdStr = String(user?._id || user?.id || "");
      const recipientIdStr = String(recipientId);
      const sender = String(newMsg.senderId?._id || newMsg.senderId || "");
      const rec = String(newMsg.recipientId?._id || newMsg.recipientId || "");
      
      if ((sender === myIdStr && rec === recipientIdStr) || (sender === recipientIdStr && rec === myIdStr)) {
        setMessages(prev => {
          if (prev.find(m => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
        if (sender === recipientIdStr) setTyping(false);
      }
    };

    const handleTyping = ({ senderId }) => {
      if (String(senderId) === String(recipientId)) setTyping(true);
    };

    const handleStopTyping = ({ senderId }) => {
      if (String(senderId) === String(recipientId)) setTyping(false);
    };
    
    socket.on("newMessage", handleNewMessage);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);
    
    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
    };
  }, [socket, recipientId, user]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  async function handleSend(e) {
    e.preventDefault();
    if (!replyBody.trim() || !recipientId) return;

    setSending(true);
    try {
      const newMsg = await messagesApi.send({
        recipientId,
        subject: "Workroom Chat",
        body: replyBody,
      });
      
      setMessages(prev => {
        if (prev.find(m => m._id === newMsg._id)) return prev;
        return [...prev, newMsg];
      });
      
      setReplyBody("");
      if (socket) {
        socket.emit("stopTyping", { recipientId });
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
    
    if (socket && recipientId) {
      socket.emit("typing", { recipientId });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stopTyping", { recipientId });
      }, 2000);
    }
  };

  const myIdStr = String(user?._id || user?.id || "");
  
  if (!recipientId) return null;

  return (
    <div className="flex flex-col h-[400px] bg-background border border-border rounded-lg overflow-hidden mt-6">
      <div className="p-3 bg-muted border-b border-border">
        <h4 className="font-semibold text-sm">Direct Messages</h4>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f0f2f5] dark:bg-[#0b141a]">
        {messages.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground mt-10">No messages yet. Say hi!</div>
        ) : (
          messages.map(msg => {
            const isMe = String(msg.senderId?._id || msg.senderId) === myIdStr;
            return (
              <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`relative max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                  isMe ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-card text-card-foreground rounded-tl-sm border border-border/50'
                }`}>
                  <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                </div>
              </div>
            );
          })
        )}
        {typing && (
          <div className="text-xs text-muted-foreground italic">Typing...</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-2 bg-card border-t border-border">
        <form onSubmit={handleSend} className="flex items-end gap-2">
          <Textarea
            value={replyBody}
            onChange={handleTypingChange}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            className="min-h-[40px] max-h-[100px] resize-none text-sm py-2"
            rows={1}
          />
          <Button type="submit" size="sm" disabled={sending || !replyBody.trim()} className="h-10">
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
