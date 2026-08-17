import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Search, Loader2, MoreVertical, ShieldAlert, ShieldCheck, Eye, PowerOff, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { admin } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

function Row({ label, children }) {
  if (children === null || children === undefined || children === "") return null;
  return (
    <div className="grid grid-cols-3 gap-4 border-b border-border/50 py-2.5 text-sm last:border-0">
      <span className="font-semibold text-muted-foreground">{label}</span>
      <span className="col-span-2">{children}</span>
    </div>
  );
}

function DetailsModal({ campaign, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 py-10">
      <div className="w-full max-w-2xl rounded-xl bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="font-display text-lg font-bold">
            Details of "{campaign.title} (ID: {campaign._id.slice(-6).toUpperCase()})"
          </h3>
          <button onClick={onClose} className="rounded-full bg-foreground p-1.5 text-background">
            <X className="size-4" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
          <Row label="Title">{campaign.title}</Row>
          <Row label="Description">{campaign.description}</Row>
          <Row label="Status">{campaign.status}</Row>
          <Row label="Budget">₹{campaign.budget}</Row>
          <Row label="Platform">{campaign.platform}</Row>
          <Row label="Promotion Type">{campaign.promotionType}</Row>
          <Row label="Brand Name">{campaign.brandId?.fullName}</Row>
          <Row label="Brand Email">{campaign.brandId?.email}</Row>
          <Row label="Brand Overview">{campaign.brandOverview}</Row>
          <Row label="Brand Website">
            {campaign.brandWebsite && (
              <a href={campaign.brandWebsite} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                {campaign.brandWebsite}
              </a>
            )}
          </Row>
          <Row label="Promotion Locations">{campaign.promotionCities?.join(", ")}</Row>
          <Row label="Want to achieve">{campaign.goals?.join(", ")}</Row>
          <Row label="How content should be made">{campaign.contentFormats?.join(", ")}</Row>
          <Row label="No of Influencers Wanted">{campaign.influencerCount}</Row>
          <Row label="Payment Budget">{campaign.payPerInfluencer}</Row>
          <Row label="Expected Start">{campaign.expectedStart}</Row>
          <Row label="Task Details">{campaign.taskDetails}</Row>
          <Row label="Campaign Brief">
            {campaign.briefFileUrl ? (
              <a href={campaign.briefFileUrl} download={campaign.briefFileName || "campaign-brief"} className="text-primary hover:underline">
                Download File
              </a>
            ) : (
              campaign.briefFileName
            )}
          </Row>
          <Row label="Instagram URL">
            {campaign.instagramUrl && (
              <a href={campaign.instagramUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">{campaign.instagramUrl}</a>
            )}
          </Row>
          <Row label="YouTube URL">
            {campaign.youtubeUrl && (
              <a href={campaign.youtubeUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">{campaign.youtubeUrl}</a>
            )}
          </Row>
          <Row label="Facebook URL">
            {campaign.facebookUrl && (
              <a href={campaign.facebookUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">{campaign.facebookUrl}</a>
            )}
          </Row>
        </div>
      </div>
    </div>
  );
}

export default function AdminCampaigns() {
  const { accountType } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);
  const [actionMenuId, setActionMenuId] = useState(null);
  const [detailsCampaign, setDetailsCampaign] = useState(null);

  function load() {
    setLoading(true);
    admin.getCampaigns({ search, status: statusFilter })
      .then((data) => setCampaigns(data.campaigns || []))
      .catch((err) => {
        toast.error("Failed to load campaigns.");
        console.error(err);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (accountType === "admin") {
      const timer = setTimeout(load, 300);
      return () => clearTimeout(timer);
    }
  }, [accountType, search, statusFilter]);

  // Click outside to close action menu
  useEffect(() => {
    function handleClickOutside() {
      setActionMenuId(null);
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  if (accountType !== "admin") return null;

  async function toggleStatus(id, currentStatus) {
    const newStatus = currentStatus === "suspended" ? "active" : "suspended";
    const confirmMessage = newStatus === "suspended" 
      ? "Are you sure you want to suspend this campaign? It will be hidden from influencers." 
      : "Are you sure you want to reactivate this campaign?";
    
    if (!window.confirm(confirmMessage)) return;

    setUpdatingId(id);
    try {
      await admin.updateCampaignStatus(id, newStatus);
      toast.success(`Campaign ${newStatus}.`);
      load();
    } catch (err) {
      toast.error(err.message || "Failed to update campaign.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-8 pb-32">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">Campaign Moderation</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor and moderate all active campaigns on the platform.
          </p>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-card border border-border rounded-lg pl-10 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="pending_admin_approval">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="suspended">Suspended</option>
            </select>
            <Filter className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="surface-panel overflow-hidden border border-border/50 shadow-sm relative">
        <div className="absolute inset-0 bg-gradient-to-b from-card/50 to-transparent pointer-events-none" />
        <div className="overflow-x-auto min-h-[400px] relative z-10">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground sticky top-0 backdrop-blur-md">
              <tr>
                <th className="px-6 py-4">Campaign Details</th>
                <th className="px-6 py-4">Brand</th>
                <th className="px-6 py-4">Budget</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 bg-card/50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-24 text-center text-muted-foreground">
                    <Loader2 className="mx-auto size-6 animate-spin mb-4 opacity-50" />
                    <p>Loading campaigns...</p>
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-24 text-center text-muted-foreground">
                    <div className="flex flex-col items-center">
                      <ShieldCheck className="size-12 opacity-20 mb-4" />
                      <p>No campaigns found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                campaigns.map((camp) => (
                  <tr key={camp._id} className="transition-colors hover:bg-muted/50 group">
                    <td className="px-6 py-4">
                      <div>
                        <p className={`font-bold text-base ${camp.status === 'suspended' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                          {camp.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1 max-w-xs">
                          {camp.description}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {(camp.brandId?.companyName || camp.brandName || "B").charAt(0).toUpperCase()}
                        </div>
                        <p className="font-semibold text-sm">{camp.brandId?.companyName || camp.brandName || "Unknown"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-green-500">{camp.budget ? `₹${camp.budget}` : (camp.payPerInfluencer || "—")}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Platform: {camp.platformId?.name || "Any"}</p>
                    </td>
                    <td className="px-6 py-4">
                      {camp.status === 'suspended' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/20 bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                          <ShieldAlert className="size-3.5" /> Suspended
                        </span>
                      ) : camp.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                          <ShieldCheck className="size-3.5" /> Active
                        </span>
                      ) : camp.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-xs font-semibold text-green-500">
                          <ShieldCheck className="size-3.5" /> Completed
                        </span>
                      ) : camp.status === 'pending_admin_approval' || camp.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2.5 py-1 text-xs font-semibold text-yellow-500">
                          Pending
                        </span>
                      ) : camp.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-500">
                          Approved
                        </span>
                      ) : camp.status === 'cancelled' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/20 bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
                          Cancelled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-muted-foreground/20 bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground capitalize">
                          {camp.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {updatingId === camp._id ? (
                        <div className="flex justify-end pr-4">
                          <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <div className="relative inline-block text-left">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionMenuId(actionMenuId === camp._id ? null : camp._id);
                            }}
                            className="p-2 rounded-full hover:bg-border/80 text-muted-foreground transition-colors"
                          >
                            <MoreVertical className="size-4" />
                          </button>
                          {actionMenuId === camp._id && (
                            <div className="absolute right-0 mt-1 w-48 rounded-xl border border-border bg-card shadow-xl shadow-black/20 z-50 overflow-hidden text-left animate-in fade-in zoom-in-95 duration-100">
                              <div className="py-1">
                                <button onClick={() => setDetailsCampaign(camp)} className="w-full px-4 py-2 text-sm text-left hover:bg-muted flex items-center gap-2">
                                  <Eye className="size-4 text-muted-foreground" /> View Campaign
                                </button>
                                <div className="h-px bg-border my-1" />
                                <button 
                                  onClick={() => toggleStatus(camp._id, camp.status)} 
                                  className={`w-full px-4 py-2 text-sm text-left flex items-center gap-2 ${camp.status === 'suspended' ? 'hover:bg-primary/10 text-primary' : 'hover:bg-destructive/10 text-destructive'}`}
                                >
                                  <PowerOff className="size-4" /> 
                                  {camp.status === 'suspended' ? "Reactivate" : "Suspend"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detailsCampaign && <DetailsModal campaign={detailsCampaign} onClose={() => setDetailsCampaign(null)} />}
    </div>
  );
}
