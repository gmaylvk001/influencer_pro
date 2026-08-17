import { useEffect, useState } from "react";
import { X, Loader2, Calendar, Target, Activity, CreditCard, Globe, MapPin, Phone, Mail, Instagram, Youtube, Facebook, Linkedin, Twitter, Hash, Star, DollarSign, Users, FileText, Briefcase, Award } from "lucide-react";
import { admin } from "@/lib/api";
import { toast } from "sonner";

function Section({ icon: Icon, title, children }) {
  return (
    <div className="space-y-3">
      <h5 className="font-bold uppercase tracking-wider text-xs text-muted-foreground flex items-center gap-2">
        <Icon className="size-3.5" /> {title}
      </h5>
      {children}
    </div>
  );
}

function InfoRow({ label, value, icon: Icon }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0">
      {Icon && <Icon className="size-4 text-muted-foreground mt-0.5 shrink-0" />}
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-all">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}</p>
      </div>
    </div>
  );
}

function MetricCard({ label, value, accent }) {
  return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-xl font-bold ${accent || ''}`}>{value}</p>
    </div>
  );
}

export default function AdminUserDetails({ userId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    admin.getUserDetails(userId)
      .then(setData)
      .catch(err => {
        toast.error("Failed to fetch details");
        onClose();
      })
      .finally(() => setLoading(false));
  }, [userId, onClose]);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;
  const formatNumber = (n) => {
    if (n === null || n === undefined) return null;
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-background/80 backdrop-blur-sm">
      <div className="surface-panel h-full w-full max-w-lg border-l border-border shadow-2xl relative animate-in slide-in-from-right duration-300 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-md border-b border-border px-6 py-4 flex items-center justify-between">
          <h3 className="font-display text-xl font-bold">User Overview</h3>
          <button 
            onClick={onClose} 
            className="rounded-full p-2 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>
        
        <div className="p-6">
          {loading || !data ? (
            <div className="py-24 flex justify-center">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Header */}
              <div className="flex items-center gap-4 border-b border-border pb-6">
                <img 
                  src={data.profile?.avatarUrl || data.profile?.logoUrl || data.account.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + data.account.email} 
                  className="size-16 rounded-full border-2 border-border object-cover" 
                  alt="Avatar" 
                />
                <div>
                  <h4 className="text-xl font-bold font-display">{data.account.fullName}</h4>
                  <p className="text-sm text-muted-foreground">{data.account.email}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="capitalize text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {data.account.accountType}
                    </span>
                    {data.account.isSuspended && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                        Suspended
                      </span>
                    )}
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      Joined {formatDate(data.account.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Basic Account Info */}
              <Section icon={Activity} title="Account Info">
                <div className="rounded-xl bg-card border border-border p-4 space-y-1">
                  <InfoRow label="Phone" value={data.account.phone} icon={Phone} />
                  <InfoRow label="City" value={data.account.city} icon={MapPin} />
                  <InfoRow label="User ID" value={data.account.id} icon={Hash} />
                </div>
              </Section>

              {/* Influencer Profile */}
              {data.profile && data.account.accountType === "influencer" && (
                <>
                  <Section icon={Star} title="Influencer Metrics">
                    <div className="grid grid-cols-2 gap-3">
                      <MetricCard label="Followers" value={formatNumber(data.profile.followers) || '0'} accent="text-blue-500" />
                      <MetricCard label="Engagement" value={data.profile.engagement ? data.profile.engagement.toFixed(1) + '%' : '0%'} accent="text-green-500" />
                      <MetricCard label="Posts" value={formatNumber(data.profile.posts) || '0'} />
                      <MetricCard label="Likes" value={formatNumber(data.profile.likes) || '0'} accent="text-pink-500" />
                      <MetricCard label="Account Balance" value={`₹${data.profile.account_balance || 0}`} accent="text-emerald-500" />
                      <MetricCard label="InfluBrand Score" value={data.profile.influBrandScore || 0} accent="text-amber-500" />
                    </div>
                  </Section>

                  <Section icon={Users} title="Profile Details">
                    <div className="rounded-xl bg-card border border-border p-4 space-y-1">
                      <InfoRow label="Display Name" value={data.profile.name} />
                      <InfoRow label="Handle" value={data.profile.handle ? `@${data.profile.handle}` : null} />
                      <InfoRow label="Gender" value={data.profile.gender} />
                      <InfoRow label="Bio" value={data.profile.bio} />
                      <InfoRow label="About Me" value={data.profile.aboutMe} />
                      <InfoRow label="Location" value={[data.profile.city, data.profile.district, data.profile.state].filter(Boolean).join(', ')} icon={MapPin} />
                      <InfoRow label="Starting Price" value={data.profile.startingPrice ? `₹${data.profile.startingPrice}` : null} icon={DollarSign} />
                      <InfoRow label="Primary Platform" value={data.profile.primaryPlatform} />
                      <InfoRow label="Verified" value={data.profile.isVerified ? '✅ Verified' : '❌ Not Verified'} />
                      <InfoRow label="Published" value={data.profile.isPublished ? 'Yes' : 'Hidden'} />
                      <InfoRow label="Languages" value={data.profile.languages?.length ? data.profile.languages.join(', ') : null} />
                      <InfoRow label="Niches" value={data.profile.niches?.map(n => n.name || n).join(', ') || null} />
                      <InfoRow label="Platforms" value={data.profile.platforms?.map(p => p.name || p).join(', ') || null} />
                    </div>
                  </Section>

                  {/* Social Links */}
                  {data.profile.socialLinks && Object.values(data.profile.socialLinks).some(Boolean) && (
                    <Section icon={Globe} title="Social Links">
                      <div className="rounded-xl bg-card border border-border p-4 space-y-1">
                        <InfoRow label="Instagram" value={data.profile.socialLinks.instagram} icon={Instagram} />
                        <InfoRow label="YouTube" value={data.profile.socialLinks.youtube} icon={Youtube} />
                        <InfoRow label="Facebook" value={data.profile.socialLinks.facebook} icon={Facebook} />
                        <InfoRow label="LinkedIn" value={data.profile.socialLinks.linkedin} icon={Linkedin} />
                        <InfoRow label="Twitter / X" value={data.profile.socialLinks.twitter} icon={Twitter} />
                      </div>
                    </Section>
                  )}

                  {/* Payment Details */}
                  {data.profile.paymentDetails && Object.values(data.profile.paymentDetails).some(Boolean) && (
                    <Section icon={CreditCard} title="Payment Details">
                      <div className="rounded-xl bg-card border border-border p-4 space-y-1">
                        <InfoRow label="Account Holder" value={data.profile.paymentDetails.accountHolderName} />
                        <InfoRow label="Bank Name" value={data.profile.paymentDetails.bankName} />
                        <InfoRow label="Account Number" value={data.profile.paymentDetails.accountNumber} />
                        <InfoRow label="IFSC Code" value={data.profile.paymentDetails.ifscCode} />
                        <InfoRow label="UPI ID" value={data.profile.paymentDetails.upiId} />
                      </div>
                    </Section>
                  )}

                  {/* Rates */}
                  {data.profile.rates?.length > 0 && (
                    <Section icon={DollarSign} title="Rate Card">
                      <div className="rounded-xl bg-card border border-border overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                            <tr>
                              <th className="px-4 py-2 text-left">Activity</th>
                              <th className="px-4 py-2 text-right">Price (₹)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                            {data.profile.rates.map((r, i) => (
                              <tr key={i}>
                                <td className="px-4 py-2 font-medium">{r.activityType}</td>
                                <td className="px-4 py-2 text-right font-bold text-green-500">₹{r.priceINR}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Section>
                  )}

                  {/* Work Samples */}
                  {data.profile.workSamples?.length > 0 && (
                    <Section icon={Briefcase} title="Work Samples">
                      <div className="space-y-2">
                        {data.profile.workSamples.map((w, i) => (
                          <div key={i} className="p-3 rounded-lg bg-card border border-border">
                            <p className="font-semibold text-sm">{w.title}</p>
                            {w.description && <p className="text-xs text-muted-foreground mt-0.5">{w.description}</p>}
                            {w.url && (
                              <a href={w.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline mt-1 block truncate">{w.url}</a>
                            )}
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* Previous Brands */}
                  {data.profile.previousBrands?.length > 0 && (
                    <Section icon={Award} title="Previous Brand Collaborations">
                      <div className="space-y-2">
                        {data.profile.previousBrands.map((b, i) => (
                          <div key={i} className="p-3 rounded-lg bg-card border border-border flex justify-between">
                            <p className="font-semibold text-sm">{b.companyName}</p>
                            <p className="text-xs text-muted-foreground">{b.city}</p>
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}
                </>
              )}

              {/* Brand Profile */}
              {data.profile && data.account.accountType === "brand" && (
                <>
                  <Section icon={Activity} title="Brand Profile">
                    <div className="grid grid-cols-2 gap-3">
                      <MetricCard label="Connect Balance" value={data.profile.connectBalance || 0} accent="text-blue-500" />
                      <MetricCard label="Campaigns" value={data.campaigns?.length || 0} />
                    </div>
                    <div className="rounded-xl bg-card border border-border p-4 space-y-1 mt-3">
                      <InfoRow label="Company Name" value={data.profile.companyName} icon={Briefcase} />
                      <InfoRow label="Contact Person" value={data.profile.contactName} icon={Users} />
                      <InfoRow label="Website" value={data.profile.website} icon={Globe} />
                      <InfoRow label="Industry" value={data.profile.nicheId?.name} />
                      <InfoRow label="Location" value={[data.profile.city, data.profile.district, data.profile.state].filter(Boolean).join(', ')} icon={MapPin} />
                      <InfoRow label="About" value={data.profile.about} icon={FileText} />
                    </div>
                  </Section>
                </>
              )}

              {/* Campaigns */}
              {data.campaigns && data.campaigns.length > 0 && (
                <Section icon={Target} title={`Campaigns (${data.campaigns.length})`}>
                  <div className="space-y-2">
                    {data.campaigns.map(c => (
                      <div key={c._id} className="p-3 rounded-lg bg-card border border-border flex justify-between items-center">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{c.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {c.budget ? `₹${c.budget}` : ''} {c.platform ? `• ${c.platform}` : ''}
                          </p>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ml-2 capitalize
                          ${c.status === 'active' ? 'bg-primary/10 text-primary' : 
                            c.status === 'completed' ? 'bg-green-500/10 text-green-500' : 
                            c.status === 'suspended' ? 'bg-destructive/10 text-destructive' : 
                            'bg-muted text-muted-foreground'}`}
                        >
                          {c.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Transactions */}
              {data.transactions && data.transactions.length > 0 && (
                <Section icon={CreditCard} title={`Transactions (${data.transactions.length})`}>
                  <div className="space-y-2">
                    {data.transactions.map(tx => (
                      <div key={tx._id} className="p-3 rounded-lg bg-card border border-border flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-sm">{tx.title || tx.itemType || 'Transaction'}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)} • {tx.status}</p>
                        </div>
                        <p className="font-bold text-green-500">₹{tx.amount}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              <div className="h-8" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
