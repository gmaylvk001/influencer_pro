import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Users, Send, Heart, Clock, Sparkles, TrendingUp, ChevronRight, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shortlists as shortlistsApi, influencers as influencersApi, campaigns as campaignsApi, transactions as transactionsApi } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { formatRupees } from "@/lib/catalog";

function EmptyRow({ colSpan, message }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-10 text-center text-sm text-muted-foreground">
        {message}
      </td>
    </tr>
  );
}

function DataTable({ title, icon: Icon, columns, children, emptyMessage }) {
  return (
    <div className="surface-panel overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border/60 px-5 py-4">
        <Icon className="size-5 text-primary" />
        <h3 className="font-display text-lg font-semibold">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {columns.map((col) => (
                <th key={col} className="px-4 py-3 text-left font-semibold text-muted-foreground">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">{children}</tbody>
        </table>
      </div>
    </div>
  );
}

const responseStyles = {
  pending: "bg-yellow-500/15 text-yellow-400",
  accepted: "bg-green-500/15 text-green-400",
  declined: "bg-red-500/15 text-red-400",
};

export default function Dashboard() {
  const { user, accountType } = useAuth();
  const [shortlistItems, setShortlistItems] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sl = await shortlistsApi.list();
        setShortlistItems(sl);

        if (accountType === "brand") {
          const infs = await influencersApi.list({ limit: 4, sort: "popular" });
          setRecommendations(infs.data || []);
        } else if (accountType === "influencer") {
          const camps = await campaignsApi.browse();
          setRecommendations(camps.slice(0, 4) || []);
          const tx = await transactionsApi.me();
          setMetrics(tx.metrics);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [accountType]);

  const shortlisted = shortlistItems
    .filter((s) => s.kind === "shortlist")
    .slice(0, 5);
  const offers = shortlistItems
    .filter((s) => s.kind === "offer")
    .slice(0, 5);

  // Quick-stat cards
  const stats = [
    { label: "Total Shortlists", value: shortlistItems.filter((s) => s.kind === "shortlist").length, icon: Heart },
    { label: "Direct Offers", value: shortlistItems.filter((s) => s.kind === "offer").length, icon: Send },
    { label: "Pending Responses", value: shortlistItems.filter((s) => s.response === "pending").length, icon: Clock },
  ];

  function influencerName(item) {
    if (accountType === "brand") {
      return item.influencerId?.name || "Unknown creator";
    }
    return item.brandId?.companyName || "Unknown brand";
  }

  function influencerDetail(item) {
    if (accountType === "brand") {
      const inf = item.influencerId;
      return inf?.city || "";
    }
    const brand = item.brandId;
    return brand ? `${brand.city || ""}` : "";
  }

  const renderBrandOverview = () => (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="surface-panel flex items-center gap-4 p-5 hover:-translate-y-1 transition-transform">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl text-gold"
              style={{ background: "var(--gradient-ink)" }}
            >
              <s.icon className="size-5" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold">{s.value}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="surface-panel overflow-hidden border-border/50 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
        <div className="flex items-center justify-between border-b border-border/40 px-6 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            <h3 className="font-display text-lg font-bold">Recommended Creators</h3>
          </div>
          <Button variant="link" asChild className="text-primary pr-0">
            <Link to="/influencers">View all <ChevronRight className="size-4 ml-1" /></Link>
          </Button>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-48 bg-muted rounded-xl" />
              ))}
            </div>
          ) : recommendations.length === 0 ? (
            <p className="text-muted-foreground text-sm">No recommendations right now.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {recommendations.map(inf => (
                <Link key={inf.id} to={`/influencers/${inf.id}`} className="block group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <img src={inf.avatarUrl || "https://api.dicebear.com/7.x/notionists/svg?seed="+inf.id} alt="" className="size-10 rounded-full object-cover border border-border" />
                    <div>
                      <h4 className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors">{inf.name}</h4>
                      <p className="text-xs text-muted-foreground">{inf.city || "India"}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {inf.niches?.slice(0, 2).map((n, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-medium text-muted-foreground">{n.name}</span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <DataTable title="Recent Shortlists" icon={Heart} columns={["#", "Influencer Info", "Action"]}>
          {loading ? <EmptyRow colSpan={3} message="Loading…" /> : shortlisted.length === 0 ? <EmptyRow colSpan={3} message="No Record(s)" /> : shortlisted.map((item, i) => (
            <tr key={item._id} className="transition-colors hover:bg-muted/20">
              <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
              <td className="px-4 py-3">
                <p className="font-medium">{influencerName(item)}</p>
                <p className="text-xs text-muted-foreground">{influencerDetail(item)}</p>
              </td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${responseStyles[item.response] || responseStyles.pending}`}>{item.response}</span>
              </td>
            </tr>
          ))}
        </DataTable>
        
        <DataTable title="Recent Offers" icon={Send} columns={["#", "Influencer Info", "Response"]}>
          {loading ? <EmptyRow colSpan={3} message="Loading…" /> : offers.length === 0 ? <EmptyRow colSpan={3} message="No Record(s)" /> : offers.map((item, i) => (
            <tr key={item._id} className="transition-colors hover:bg-muted/20">
              <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
              <td className="px-4 py-3">
                <p className="font-medium">{influencerName(item)}</p>
                <p className="text-xs text-muted-foreground">{influencerDetail(item)}</p>
              </td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${responseStyles[item.response] || responseStyles.pending}`}>{item.response}</span>
              </td>
            </tr>
          ))}
        </DataTable>
      </div>
    </div>
  );

  const renderInfluencerOverview = () => (
    <div className="space-y-8">
      {/* Quick Stats & Earnings */}
      <div className="grid gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="surface-panel flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <s.icon className="size-5" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold">{s.value}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
        <div className="surface-panel flex items-center gap-4 p-5 col-span-1 sm:col-span-2 lg:col-span-1">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-500/10 text-green-500">
            <TrendingUp className="size-5" />
          </div>
          <div>
            <p className="font-display text-2xl font-bold">₹{metrics?.available?.toLocaleString('en-IN') || 0}</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Available Earnings</p>
          </div>
        </div>
      </div>

      <div className="surface-panel overflow-hidden border-border/50 bg-gradient-to-bl from-primary/5 via-transparent to-transparent">
        <div className="flex items-center justify-between border-b border-border/40 px-6 py-4">
          <div className="flex items-center gap-2">
            <Target className="size-5 text-primary" />
            <h3 className="font-display text-lg font-bold">Matching Campaigns</h3>
          </div>
          <Button variant="link" asChild className="text-primary pr-0">
            <Link to="/dashboard/campaigns">Browse all <ChevronRight className="size-4 ml-1" /></Link>
          </Button>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-40 bg-muted rounded-xl" />
              ))}
            </div>
          ) : recommendations.length === 0 ? (
            <p className="text-muted-foreground text-sm">No campaigns match your profile currently.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {recommendations.map(camp => (
                <Link key={camp.id} to={`/dashboard/campaigns`} className="block group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-lg flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-sm line-clamp-2 group-hover:text-primary transition-colors">{camp.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{camp.brandId?.companyName || "Brand"}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">₹{camp.budget?.toLocaleString('en-IN') || "N/A"}</span>
                    <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">View</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <DataTable title="Recent Offers" icon={Send} columns={["#", "Brand Info", "Response"]}>
          {loading ? <EmptyRow colSpan={3} message="Loading…" /> : offers.length === 0 ? <EmptyRow colSpan={3} message="No Record(s)" /> : offers.map((item, i) => (
            <tr key={item._id} className="transition-colors hover:bg-muted/20">
              <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
              <td className="px-4 py-3">
                <p className="font-medium">{influencerName(item)}</p>
                <p className="text-xs text-muted-foreground">{influencerDetail(item)}</p>
              </td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${responseStyles[item.response] || responseStyles.pending}`}>{item.response}</span>
              </td>
            </tr>
          ))}
        </DataTable>

        <div className="surface-panel p-6 flex flex-col justify-center">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
            <Users className="size-6" />
          </div>
          <h3 className="font-display text-xl font-bold mb-2">Stand out to brands</h3>
          <p className="text-sm text-muted-foreground mb-6">Complete your profile, link your socials, and maintain high engagement to get featured in our recommended creators list.</p>
          <Button variant="hero" asChild>
            <Link to="/dashboard/profile">Update Profile</Link>
          </Button>
        </div>
      </div>
    </div>
  );

  return accountType === "brand" ? renderBrandOverview() : renderInfluencerOverview();
}
