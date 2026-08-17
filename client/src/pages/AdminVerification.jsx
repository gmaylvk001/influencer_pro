import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Search, ExternalLink, Loader2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { admin } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

export default function AdminVerification() {
  const { accountType } = useAuth();
  const [influencers, setInfluencers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState("all"); // all, pending, verified
  const [updatingId, setUpdatingId] = useState(null);

  function load() {
    setLoading(true);
    admin.listInfluencers()
      .then(setInfluencers)
      .catch((err) => {
        toast.error("Failed to load influencers.");
        console.error(err);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (accountType === "admin") {
      load();
    }
  }, [accountType]);

  if (accountType !== "admin") {
    return (
      <div className="surface-panel p-12 text-center">
        <p className="font-display text-lg">Admins only</p>
      </div>
    );
  }

  const filtered = influencers.filter((i) => {
    const matchesSearch = i.name?.toLowerCase().includes(search.toLowerCase()) || 
                          i.handle?.toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (filterTab === "pending") return !i.is_verified;
    if (filterTab === "verified") return i.is_verified;
    return true;
  });

  async function toggleVerification(id, currentStatus) {
    setUpdatingId(id);
    try {
      await admin.verifyInfluencer(id, !currentStatus);
      toast.success(currentStatus ? "Verification revoked." : "Influencer verified!");
      load();
    } catch (err) {
      toast.error(err.message || "Failed to update verification status.");
    } finally {
      setUpdatingId(null);
    }
  }

  const pendingCount = influencers.filter((i) => !i.is_verified).length;

  return (
    <div className="space-y-8">
      {/* Header section with text gradient */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">Verify Influencers</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Approve creators to give them the verified badge across the platform.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name or handle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
      </div>

      {/* Modern Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-px">
        <button
          onClick={() => setFilterTab("all")}
          className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 ${
            filterTab === "all" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          }`}
        >
          All Creators
        </button>
        <button
          onClick={() => setFilterTab("pending")}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-colors border-b-2 ${
            filterTab === "pending" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          }`}
        >
          Pending
          {pendingCount > 0 && (
            <span className="flex h-5 items-center justify-center rounded-full bg-primary/20 px-1.5 text-xs text-primary">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilterTab("verified")}
          className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 ${
            filterTab === "verified" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          }`}
        >
          Verified
        </button>
      </div>

      <div className="surface-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/30 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-4">Creator</th>
                <th className="px-6 py-4">Handle</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-muted-foreground">
                    <Loader2 className="mx-auto size-6 animate-spin mb-2 opacity-50" />
                    <p>Loading accounts...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-muted-foreground">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 mb-3">
                      <Filter className="size-5 opacity-50" />
                    </div>
                    <p>No creators found for this filter.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((inf) => (
                  <tr key={inf.id} className="transition-colors hover:bg-muted/30 group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={inf.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + inf.name}
                            alt={inf.name}
                            className="size-10 rounded-full object-cover border border-border group-hover:border-primary/50 transition-colors"
                          />
                          {inf.is_verified && (
                            <div className="absolute -bottom-1 -right-1 rounded-full bg-background p-0.5">
                              <CheckCircle2 className="size-3.5 text-green-500" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{inf.name}</p>
                          <p className="text-xs text-muted-foreground">{inf.city || "Unknown City"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {inf.handle ? (
                        <a 
                          href={inf.socialLinks?.[0] || `https://instagram.com/${inf.handle.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium"
                        >
                          {inf.handle}
                          <ExternalLink className="size-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {inf.is_verified ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-xs font-semibold text-green-600 dark:text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                          <CheckCircle2 className="size-3.5" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary shadow-[0_0_10px_var(--color-primary)]">
                          <Loader2 className="size-3 animate-spin opacity-70" /> Pending Review
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant={inf.is_verified ? "outline" : "hero"}
                        size="sm"
                        disabled={updatingId === inf.id}
                        onClick={() => toggleVerification(inf.id, inf.is_verified)}
                        className="w-24 transition-all"
                      >
                        {updatingId === inf.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : inf.is_verified ? (
                          "Revoke"
                        ) : (
                          "Approve"
                        )}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
