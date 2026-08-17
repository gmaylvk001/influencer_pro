import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { influencers as influencersApi, messages as messagesApi } from "@/lib/api";
import { formatCount } from "@/lib/catalog";
import { InfluencerCard } from "@/components/site/InfluencerCard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, MessageCircle, Heart, Instagram, ExternalLink, Globe, Languages, Mail, X, Send, BadgeCheck, Activity, Users } from "lucide-react";

function StatBox({ value, label }) {
  return (
    <div className="flex flex-col">
      <span className="font-display text-2xl font-bold">{value}</span>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
}

function Chart({ title, data, valueKey }) {
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
  return (
    <div className="surface-panel p-6">
      <h3 className="mb-6 font-display text-sm font-semibold">{title}</h3>
      <div className="flex h-32 items-end justify-between gap-1 border-b border-l border-border pb-1 pl-1">
        {data.map((val, i) => (
          <div
            key={i}
            className="w-full rounded-t-sm transition-all hover:bg-primary"
            style={{ 
              height: `${((val[valueKey] || 0) / max) * 100}%`,
              background: "var(--gradient-mint)",
              opacity: 0.8
            }}
            title={`${val.date || ''}: ${val[valueKey] || 0}`}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
        <span>Jan</span>
        <span>Jul</span>
        <span>Dec</span>
      </div>
    </div>
  );
}

export default function InfluencerProfile({ isDashboard = false, fetchOwnProfile = false }) {
  const { id } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [similar, setSimilar] = useState([]);

  // Messaging state
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    setLoading(true);
    const fetchProfile = fetchOwnProfile ? influencersApi.me() : influencersApi.get(id);

    fetchProfile
      .then(data => {
        setProfile(data);
        
        // Update SEO Metadata
        if (!isDashboard) {
          document.title = `${data.name} - Influbrand Creator`;
          let metaDesc = document.querySelector('meta[name="description"]');
          if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.name = 'description';
            document.head.appendChild(metaDesc);
          }
          metaDesc.content = `Check out ${data.name}'s creator profile on Influbrand. ${data.followers ? formatCount(data.followers) + ' followers.' : ''}`;
        }
        
        // Fetch similar influencers
        return Promise.all([data, influencersApi.list({ limit: 5 })]);
      })
      .then(([profileData, res]) => {
        const profileId = profileData.id || profileData._id;
        setSimilar(res.data.filter(i => (i.id || i._id) !== profileId).slice(0, 4));
      })
      .catch(err => {
        toast.error("Failed to load profile.");
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [id, isDashboard]);

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!messageBody.trim() || !user) return;
    
    setSendingMessage(true);
    try {
      await messagesApi.send({
        recipientId: profile.userId, // The influencer's user account ID
        influencerId: profile._id,
        subject: messageSubject || "Collaboration Inquiry",
        body: messageBody
      });
      toast.success("Message sent successfully!");
      setShowMessageModal(false);
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
      <div className={isDashboard ? "pb-12 animate-pulse" : "min-h-screen bg-background pb-24 animate-pulse"}>
        {!isDashboard && <div className="h-64 w-full bg-muted" />}
        <div className={isDashboard ? "" : "mx-auto -mt-40 w-full max-w-7xl px-4 sm:px-6"}>
          <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
            <div className="space-y-8">
              <div className="h-32 w-full bg-muted rounded-2xl" />
              <div className="h-4" />
              <div className="h-48 w-full bg-muted rounded-2xl" />
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="h-32 bg-muted rounded-2xl" />
                <div className="h-32 bg-muted rounded-2xl" />
              </div>
            </div>
            <div className="space-y-6">
              <div className="aspect-square w-full bg-muted rounded-2xl" />
              <div className="h-64 w-full bg-muted rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const myUserId = user ? String(user._id || user.id) : null;
  const profileUserId = profile && profile.userId ? String(profile.userId._id || profile.userId.id || profile.userId) : null;
  const isMyProfile = myUserId && profileUserId && myUserId === profileUserId;

  return (
    <div className={isDashboard ? "pb-12" : "min-h-screen bg-background pb-24"}>
      {/* Top Background Gradient */}
      {!isDashboard && (
        <div className="h-72 w-full relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-background to-background" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30 mix-blend-overlay" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
        </div>
      )}

      <div className={isDashboard ? "" : "mx-auto -mt-40 w-full max-w-4xl px-4 sm:px-6 relative z-10"}>
        
        {/* Profile Header (Linktree Style) */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="relative mb-6">
            <div className="h-32 w-32 md:h-40 md:w-40 rounded-full overflow-hidden border-4 border-background shadow-2xl relative z-10 bg-muted">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary/10">
                  <span className="font-display text-5xl font-bold text-primary">
                    {profile.name?.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            {profile.isVerified && (
              <div className="absolute bottom-2 right-2 z-20 rounded-full bg-background p-1 shadow-md">
                <BadgeCheck className="size-6 text-blue-500 fill-blue-500/10" />
              </div>
            )}
          </div>
          
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
            {profile.name}
          </h1>
          
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground mb-6">
            {profile.city && (
              <span className="flex items-center gap-1">
                <MapPin className="size-4" /> {profile.city}{profile.state ? `, ${profile.state}` : ''}
              </span>
            )}
            {profile.languages?.length > 0 && (
              <>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-1">
                  <Languages className="size-4" /> {profile.languages.join(", ")}
                </span>
              </>
            )}
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {profile.niches?.map((n) => (
              <span key={n._id || n} className="rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary border border-primary/20 backdrop-blur-md">
                {n.name || n}
              </span>
            ))}
          </div>

          {!isMyProfile && (
            <Button 
              size="lg"
              variant="hero" 
              className="w-full max-w-xs shadow-xl shadow-primary/20 rounded-full"
              onClick={() => {
                if (!user) toast.error("Please log in to send a message.");
                else setShowMessageModal(true);
              }}
            >
              <MessageCircle className="mr-2 size-5" />
              Collaborate
            </Button>
          )}
        </div>

        {/* Social Links (Linktree Style Buttons) */}
        {profile.socialAssets && Object.keys(profile.socialAssets).length > 0 && (
          <div className="space-y-4 max-w-xl mx-auto mb-16">
            {Object.entries(profile.socialAssets).map(([platform, data]) => {
              if (!data?.url) return null;
              return (
                <a
                  key={platform}
                  href={data.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-4 transition-all hover:scale-[1.02] hover:bg-card hover:shadow-[0_0_20px_rgba(var(--primary),0.15)] hover:border-primary/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      {platform.toLowerCase() === 'instagram' ? <Instagram className="size-6" /> : <Globe className="size-6" />}
                    </div>
                    <span className="font-display text-lg font-bold text-foreground">
                      {platform}
                    </span>
                  </div>
                  <ExternalLink className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-primary" />
                </a>
              );
            })}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Top Stats Panel */}
            <div className="surface-panel p-6 rounded-3xl border border-border/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              <div className="flex items-center justify-between mb-8 relative z-10">
                <h3 className="font-display text-lg font-bold flex items-center gap-2">
                  <Activity className="size-5 text-primary" />
                  Key Metrics
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-y-8 gap-x-6 sm:grid-cols-3 relative z-10">
                <StatBox value={formatCount(profile.followers)} label="Followers" />
                <StatBox value={formatCount(Math.floor(profile.followers * 0.05))} label="Following" />
                <StatBox value={`${profile.engagement}%`} label="Engagement" />
                <StatBox value={formatCount(profile.posts)} label="Total Posts" />
                <StatBox value={formatCount(profile.likes)} label="Avg Likes" />
                <StatBox value={formatCount(Math.floor(profile.likes * 0.1))} label="Avg Comments" />
              </div>
            </div>

            {/* Daily Stats Table */}
            <div className="surface-panel p-6 rounded-3xl overflow-hidden border border-border/50">
              <h3 className="mb-6 font-display text-lg font-bold flex items-center gap-2">
                <Users className="size-5 text-primary" />
                Recent Daily Activity
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 uppercase tracking-wider text-muted-foreground border-b border-border">
                    <tr>
                      <th className="px-4 py-3 font-semibold rounded-tl-xl">Date</th>
                      <th className="px-4 py-3 font-semibold">Likes</th>
                      <th className="px-4 py-3 font-semibold">Comments</th>
                      <th className="px-4 py-3 font-semibold">Posts</th>
                      <th className="px-4 py-3 font-semibold rounded-tr-xl">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {profile.dailyStats?.length > 0 ? profile.dailyStats.map((stat, i) => (
                      <tr key={i} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-4">{stat.date}</td>
                        <td className="px-4 py-4 text-green-500 font-medium">+{formatCount(stat.likes || 0)}</td>
                        <td className="px-4 py-4 text-green-500 font-medium">+{formatCount(stat.comments || 0)}</td>
                        <td className="px-4 py-4">{stat.posts || 0}</td>
                        <td className="px-4 py-4 font-bold">{formatCount((stat.likes || 0) + (stat.comments || 0))}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="5" className="px-4 py-12 text-center text-muted-foreground">No daily statistics available.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-8">
            {/* Charts */}
            <div className="space-y-8">
              <div className="surface-panel p-6 rounded-3xl border border-border/50">
                <Chart title="Follower Growth" data={profile.growthHistory || []} valueKey="followers" />
              </div>
            </div>

            {/* Tags */}
            <div className="surface-panel p-6 rounded-3xl border border-border/50">
              <h3 className="mb-4 font-display text-sm font-semibold">Top Hashtags</h3>
              <div className="flex flex-wrap gap-2">
                {profile.hashtags?.length > 0 ? profile.hashtags.map(tag => (
                  <span key={tag} className="rounded-full bg-primary/10 px-3 py-1.5 text-xs text-primary transition-colors hover:bg-primary hover:text-white cursor-default">
                    {tag}
                  </span>
                )) : <span className="text-sm text-muted-foreground">No hashtags available.</span>}
              </div>
            </div>
            
            <div className="surface-panel p-6 rounded-3xl border border-border/50">
              <h3 className="mb-4 font-display text-sm font-semibold">Brand Mentions</h3>
              <div className="flex flex-wrap gap-2">
                {profile.mentions?.length > 0 ? profile.mentions.map(tag => (
                  <span key={tag} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground transition-colors cursor-default shadow-sm hover:border-primary/50">
                    {tag}
                  </span>
                )) : <span className="text-sm text-muted-foreground">No mentions available.</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Similar Influencers Section */}
        {similar.length > 0 && (
          <div className="mt-24">
            <h2 className="mb-8 text-center font-display text-3xl font-bold">
              Similar <span className="text-gradient">Influencers</span>
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {similar.map(inf => (
                <InfluencerCard key={inf.id || inf._id} influencer={inf} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Compose Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowMessageModal(false)} />
          <div className="surface-panel relative w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h3 className="font-display text-lg font-bold flex items-center gap-2">
                <Mail className="size-5 text-primary" /> Send Message
              </h3>
              <button onClick={() => setShowMessageModal(false)} className="rounded-full p-2 hover:bg-muted text-muted-foreground transition-colors">
                <X className="size-4" />
              </button>
            </div>
            <form onSubmit={handleSendMessage} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">To:</label>
                <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">
                  {profile.name}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Input 
                  value={messageSubject} 
                  onChange={(e) => setMessageSubject(e.target.value)} 
                  placeholder="Collaboration Inquiry" 
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <Textarea 
                  value={messageBody} 
                  onChange={(e) => setMessageBody(e.target.value)} 
                  placeholder={`Hi ${profile.name.split(' ')[0]},\n\nI love your content and would love to discuss a potential collaboration...`} 
                  className="min-h-[150px] resize-y" 
                  required
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowMessageModal(false)}>
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
