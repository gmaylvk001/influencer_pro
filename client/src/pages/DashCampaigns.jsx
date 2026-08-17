import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Plus, X, ChevronDown, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { campaigns as campaignsApi, shortlists as shortlistsApi, brands as brandsApi } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

function EmptyRow({ colSpan, message }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-12 text-center text-sm text-muted-foreground">
        {message}
      </td>
    </tr>
  );
}

const statusColors = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-amber-500/15 text-amber-500",
  active: "bg-primary/15 text-primary",
  paused: "bg-yellow-500/15 text-yellow-400",
  completed: "bg-green-500/15 text-green-400",
};

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
          <Row label="Posted On">{campaign.createdAt && new Date(campaign.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</Row>
          <Row label="Promotion Type">{campaign.promotionType}</Row>
          <Row label="Brand Name">{campaign.brandName}</Row>
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

function ApplicantsModal({ campaign, onClose }) {
  const [applicants, setApplicants] = useState([]);
  const [filteredApplicants, setFilteredApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterState, setFilterState] = useState("all");

  useEffect(() => {
    campaignsApi
      .applicants(campaign._id)
      .then((data) => {
        setApplicants(data);
        setFilteredApplicants(data);
      })
      .catch(() => {
        setApplicants([]);
        setFilteredApplicants([]);
      })
      .finally(() => setLoading(false));
  }, [campaign._id]);

  useEffect(() => {
    if (filterState === "all") {
      setFilteredApplicants(applicants);
    } else if (filterState === "unlocked") {
      setFilteredApplicants(applicants.filter(a => a.isUnlocked || a.kind === "offer"));
    } else if (filterState === "locked") {
      setFilteredApplicants(applicants.filter(a => !a.isUnlocked && a.kind !== "offer"));
    } else if (filterState === "offered") {
      setFilteredApplicants(applicants.filter(a => a.kind === "offer"));
    }
  }, [filterState, applicants]);

  async function handleUnlock(shortlistId) {
    try {
      await shortlistsApi.unlock(shortlistId);
      const refreshed = await campaignsApi.applicants(campaign._id);
      setApplicants(refreshed);
      toast.success("Contact unlocked!");
    } catch (err) {
      toast.error(err.message || "Unlock failed.");
    }
  }

  async function handleOffer(influencerId) {
    try {
      await shortlistsApi.create({ influencerId, campaignId: campaign._id, kind: "offer" });
      const refreshed = await campaignsApi.applicants(campaign._id);
      setApplicants(refreshed);
      toast.success("Offer sent to the influencer!");
    } catch (err) {
      toast.error(err.message || "Failed to send offer.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 py-10">
      <div className="w-full max-w-3xl rounded-xl bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="font-display text-lg font-bold">
            Influencers Applied for "{campaign.title} (ID: {campaign._id.slice(-6).toUpperCase()})"
          </h3>
          <button onClick={onClose} className="rounded-full bg-foreground p-1.5 text-background">
            <X className="size-4" />
          </button>
        </div>
        
        <div className="border-b border-border px-6 py-3 bg-muted/10 flex items-center gap-4">
          <span className="text-sm font-semibold text-muted-foreground">Filter:</span>
          <select 
            value={filterState} 
            onChange={(e) => setFilterState(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
          >
            <option value="all">All Applicants ({applicants.length})</option>
            <option value="unlocked">Unlocked ({applicants.filter(a => a.isUnlocked || a.kind === "offer").length})</option>
            <option value="locked">Locked ({applicants.filter(a => !a.isUnlocked && a.kind !== "offer").length})</option>
            <option value="offered">Offered ({applicants.filter(a => a.kind === "offer").length})</option>
          </select>
        </div>

        <div className="overflow-x-auto px-6 py-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">#</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Influencer Image</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Influencer Info</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Contact Details</th>
                <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <EmptyRow colSpan={5} message="Loading…" />
              ) : filteredApplicants.length === 0 ? (
                <EmptyRow colSpan={5} message="No Record(s)" />
              ) : (
                filteredApplicants.map((a, i) => (
                  <tr key={a._id}>
                    <td className="px-3 py-2">{i + 1}</td>
                    <td className="px-3 py-2">
                      {a.influencerId?.avatarUrl ? (
                        <img src={a.influencerId.avatarUrl} alt="" className="size-10 rounded-full object-cover" />
                      ) : (
                        <span className="flex size-10 items-center justify-center rounded-full bg-muted text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {a.influencerId?.name ? (
                        <Link to={`/p/${a.influencerId._id}`} target="_blank" className="font-semibold text-primary hover:underline">
                          {a.influencerId.name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {(a.influencerId?.email || a.influencerId?.phone) ? (
                        <div>
                          {a.influencerId?.email && <div>{a.influencerId.email}</div>}
                          {a.influencerId?.phone && <div>{a.influencerId.phone}</div>}
                        </div>
                      ) : (
                        <Button size="sm" variant="soft" onClick={() => handleUnlock(a._id)}>
                          Unlock (1 Connect)
                        </Button>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {a.kind === "offer" ? (
                        <span className="text-xs font-semibold text-primary">Offer Sent</span>
                      ) : (
                        <Button size="sm" variant="hero" onClick={() => handleOffer(a.influencerId?._id)}>
                          Send Offer
                        </Button>
                      )}
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

function ActionMenu({ campaign, onView, onViewApplicants, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block text-left">
      <Button variant="soft" size="sm" onClick={() => setOpen((v) => !v)}>
        Choose Action <ChevronDown className="size-3.5" />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-md border border-border bg-card shadow-lg">
            <button
              className="block w-full px-4 py-2 text-left text-sm hover:bg-muted"
              onClick={() => { setOpen(false); onView(campaign); }}
            >
              View Details
            </button>
            <Link
              to={`/dashboard/campaigns/${campaign._id}/edit`}
              className="block w-full px-4 py-2 text-left text-sm hover:bg-muted"
            >
              Edit Campaign
            </Link>
            <button
              className="block w-full px-4 py-2 text-left text-sm hover:bg-muted"
              onClick={() => { setOpen(false); onViewApplicants(campaign); }}
            >
              View Applicants
            </button>
            <button
              className="block w-full px-4 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
              onClick={() => { setOpen(false); onDelete(campaign._id); }}
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function InfluencerCampaignRow({ campaign, isAppliedInitially, applyText = "Applied", onApplied }) {
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(isAppliedInitially);

  useEffect(() => {
    setApplied(isAppliedInitially);
  }, [isAppliedInitially]);

  async function apply() {
    setApplying(true);
    try {
      await shortlistsApi.create({ campaignId: campaign._id, kind: "application" });
      setApplied(true);
      onApplied?.();
      toast.success("Application sent to the brand.");
    } catch (err) {
      toast.error(err.message || "Couldn't apply to this campaign.");
    } finally {
      setApplying(false);
    }
  }

  return (
    <tr className="align-top transition-colors hover:bg-muted/20">
      <td className="px-4 py-3">
        <p className="font-medium">{campaign.title}</p>
        <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
          <p>{campaign.brandId?.companyName}</p>
          {campaign.promotionCities?.length > 0 && (
            <p className="inline-flex items-center gap-1"><MapPin className="size-3" />{campaign.promotionCities.join(", ")}</p>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-xs">
        <p>{campaign.payPerInfluencer || "—"}</p>
        <p className="text-muted-foreground">{campaign.influencerCount ? `${campaign.influencerCount} creators` : ""}</p>
      </td>
      <td className="px-4 py-3 text-right">
        <Button size="sm" variant={applied ? "soft" : "hero"} disabled={applying || applied} onClick={apply}>
          {applied ? applyText : applying ? "Applying…" : "Apply"}
        </Button>
      </td>
    </tr>
  );
}

function InfluencerCampaignsView() {
  const [campaigns, setCampaigns] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      campaignsApi.browse(),
      shortlistsApi.list()
    ])
      .then(([camps, lists]) => {
        setCampaigns(camps);
        setMyApplications(lists.filter(l => l.campaignId));
      })
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="surface-panel overflow-hidden">
      <div className="border-b border-border px-6 py-4">
        <h2 className="font-display text-lg font-bold">Open Campaigns</h2>
        <p className="text-sm text-muted-foreground">Apply to campaigns brands are currently running.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Campaign</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Pay</th>
              <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {loading ? (
              <EmptyRow colSpan={3} message="Loading campaigns…" />
            ) : campaigns.length === 0 ? (
              <EmptyRow colSpan={3} message="No open campaigns right now. Check back soon." />
            ) : (
              campaigns.map((c) => {
                const listStatus = myApplications.find(app => String(app.campaignId?._id || app.campaignId) === String(c._id));
                const isApplied = !!listStatus;
                let text = "Applied";
                if (listStatus?.kind === "offer") text = "Offer Received";
                else if (listStatus?.kind === "shortlist") text = "Shortlisted";

                return (
                  <InfluencerCampaignRow 
                    key={c._id} 
                    campaign={c} 
                    isAppliedInitially={isApplied} 
                    applyText={text}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function DashCampaigns() {
  const { accountType, user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsCampaign, setDetailsCampaign] = useState(null);
  const [applicantsCampaign, setApplicantsCampaign] = useState(null);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [connectBalance, setConnectBalance] = useState(null);

  useEffect(() => {
    if (accountType !== "brand") {
      setLoading(false);
      return;
    }
    campaignsApi
      .list()
      .then(setCampaigns)
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false));

    brandsApi
      .me()
      .then((b) => setConnectBalance(b?.connectBalance ?? 0))
      .catch(() => setConnectBalance(null));
  }, [accountType]);

  async function handleDelete(id) {
    if (!confirm("Delete this campaign? This cannot be undone.")) return;
    try {
      await campaignsApi.remove(id);
      setCampaigns((prev) => prev.filter((c) => c._id !== id));
      toast.success("Campaign deleted.");
    } catch (err) {
      toast.error(err.message || "Failed to delete campaign.");
    }
  }

  if (accountType !== "brand") {
    return <InfluencerCampaignsView />;
  }

  const firstName = (user?.fullName || user?.email?.split("@")[0] || "there").split(" ")[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm">
            Hi <span className="font-semibold text-primary">{firstName}!</span>
          </p>
          {connectBalance !== null && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-semibold">
              <span className="size-1.5 rounded-full bg-primary" />
              Connect Balance: {connectBalance}
            </span>
          )}
        </div>
        <Button variant="hero" size="sm" asChild>
          <Link to="/dashboard/campaigns/new">
            <Plus className="size-4" />
            Create new campaign
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="surface-panel p-6 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold font-display text-primary mb-1">{campaigns.length}</span>
          <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Total Campaigns</span>
        </div>
        <div className="surface-panel p-6 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold font-display text-green-500 mb-1">{campaigns.filter(c => c.status === 'active').length}</span>
          <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Active Campaigns</span>
        </div>
        <div className="surface-panel p-6 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold font-display text-amber-500 mb-1">{campaigns.reduce((sum, c) => sum + (c.applicantCount || 0), 0)}</span>
          <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Total Applicants</span>
        </div>
      </div>

      <div className="surface-panel overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-display text-lg font-bold">My Campaigns</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">#</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Campaign Info</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Applicants</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Brand Info</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <EmptyRow colSpan={5} message="Loading campaigns…" />
              ) : campaigns.length === 0 ? (
                <EmptyRow colSpan={5} message="No campaigns yet. Create your first campaign to get started." />
              ) : (
                campaigns.map((c, i) => (
                  <tr key={c._id} className="align-top transition-colors hover:bg-muted/20">
                    <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{c.title}</p>
                      <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                        <p>ID: {c._id.slice(-6).toUpperCase()}</p>
                        <p>Created On: {c.createdAt && new Date(c.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
                        <p>
                          Type: <span className="rounded-full bg-muted px-2 py-0.5 font-medium capitalize">{(c.type || "self_managed").replace("_", " ")}</span>
                        </p>
                        <p>
                          Current Status: <span className={`rounded-full px-2 py-0.5 font-medium capitalize ${statusColors[c.status] || statusColors.pending}`}>{c.status}</span>
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => setApplicantsCampaign(c)}
                        className="inline-flex items-center justify-center rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
                      >
                        {c.applicantCount || 0} Applied
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <p><span className="font-semibold">Promotion Type:</span> <span className="capitalize">{c.promotionType || "—"}</span></p>
                      <p><span className="font-semibold">Brand Name:</span> {c.brandName || "—"}</p>
                      {c.promotionCities?.length > 0 && (
                        <p className="mt-1 inline-flex items-center gap-1 text-muted-foreground">
                          <MapPin className="size-3" />{c.promotionCities.slice(0, 2).join(", ")}{c.promotionCities.length > 2 ? "…" : ""}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ActionMenu
                        campaign={c}
                        onView={setDetailsCampaign}
                        onViewApplicants={setApplicantsCampaign}
                        onDelete={handleDelete}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detailsCampaign && <DetailsModal campaign={detailsCampaign} onClose={() => setDetailsCampaign(null)} />}
      {applicantsCampaign && <ApplicantsModal campaign={applicantsCampaign} onClose={() => setApplicantsCampaign(null)} />}
    </div>
  );
}
