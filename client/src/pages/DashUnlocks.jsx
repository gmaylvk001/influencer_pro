import { useState, useEffect } from "react";
import { LockOpen, Building2, MapPin, Calendar, MessageCircle, ExternalLink, Mail, X, Send } from "lucide-react";
import { shortlists as shortlistsApi, messages as messagesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useNavigate } from "react-router";

export default function DashUnlocks() {
  const [unlocks, setUnlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Messaging state
  const [composeTo, setComposeTo] = useState(null); // stores the brand item
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    fetchUnlocks();
  }, []);

  async function fetchUnlocks() {
    try {
      setLoading(true);
      const data = await shortlistsApi.list();
      // Filter for items where isUnlocked is true
      const unlockedList = data.filter((item) => item.isUnlocked === true);
      setUnlocks(unlockedList);
    } catch (err) {
      toast.error("Failed to load unlock history");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!messageBody.trim() || !composeTo) return;
    
    setSendingMessage(true);
    try {
      await messagesApi.send({
        recipientId: composeTo.brandId.userId, // Send to the brand's user account
        influencerId: composeTo.influencerId?._id || composeTo.influencerId,
        subject: messageSubject || "Following up on my profile unlock",
        body: messageBody
      });
      toast.success("Message sent successfully!");
      setComposeTo(null);
      setMessageSubject("");
      setMessageBody("");
    } catch (err) {
      toast.error(err.message || "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto animate-pulse">
        <div>
          <div className="h-8 w-1/4 bg-muted rounded-md mb-2"></div>
          <div className="h-4 w-3/4 bg-muted/50 rounded-md"></div>
        </div>
        <div className="surface-panel overflow-hidden p-6 space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col sm:flex-row gap-4 border-b border-border/50 pb-6 last:border-0 last:pb-0">
              <div className="h-16 w-16 bg-muted rounded-xl shrink-0"></div>
              <div className="flex-1 space-y-3">
                <div className="h-5 w-1/3 bg-muted rounded-md"></div>
                <div className="h-4 w-1/2 bg-muted/50 rounded-md"></div>
              </div>
              <div className="h-10 w-24 bg-muted rounded-md shrink-0"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <LockOpen className="size-6 text-primary" />
          URL Unlocks
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Brands spend "Connects" to unlock your private contact information and social URLs. Keep track of who is interested in you below.
        </p>
      </div>

      <div className="surface-panel overflow-hidden">
        {unlocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 mb-4 text-muted-foreground">
              <LockOpen className="size-8 opacity-20" />
            </div>
            <h3 className="font-display text-lg font-bold">No unlocks yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              When a brand spends a Connect to view your private details, it will appear here. Keep your profile updated to attract more brands!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {unlocks.map((item) => {
              const brand = item.brandId;
              if (!brand) return null;
              
              return (
                <div key={item._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-muted/30 transition-colors gap-6">
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-card">
                      {brand.logoUrl ? (
                        <img src={brand.logoUrl} alt={brand.companyName} className="h-full w-full object-cover" />
                      ) : (
                        <Building2 className="size-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold">{brand.companyName}</h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                        {brand.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3.5" />
                            {brand.city}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3.5" />
                          Unlocked on {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                    <Button 
                      variant="outline" 
                      className="w-full sm:w-auto"
                      onClick={() => setComposeTo(item)}
                    >
                      <MessageCircle className="mr-2 size-4" />
                      Message
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Compose Message Modal */}
      {composeTo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setComposeTo(null)} />
          <div className="surface-panel relative w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h3 className="font-display text-lg font-bold flex items-center gap-2">
                <Mail className="size-5 text-primary" /> Message Brand
              </h3>
              <button onClick={() => setComposeTo(null)} className="rounded-full p-2 hover:bg-muted text-muted-foreground transition-colors">
                <X className="size-4" />
              </button>
            </div>
            <form onSubmit={handleSendMessage} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">To:</label>
                <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">
                  {composeTo.brandId.companyName}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Input 
                  value={messageSubject} 
                  onChange={(e) => setMessageSubject(e.target.value)} 
                  placeholder="Following up on my profile unlock" 
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <Textarea 
                  value={messageBody} 
                  onChange={(e) => setMessageBody(e.target.value)} 
                  placeholder="Hi there, I noticed you recently unlocked my profile. I would love to connect and discuss..." 
                  className="min-h-[150px] resize-y" 
                  required
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setComposeTo(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="hero" disabled={sendingMessage || !messageBody.trim()}>
                  <Send className="mr-2 size-4" />
                  {sendingMessage ? "Sending..." : "Send Message"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
