import { useState, useEffect } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Check, X, FileText, UploadCloud, MessageSquare, Play, Video, ExternalLink, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { participants, disputes } from "@/lib/api";
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

export default function DashOffers() {
  const { accountType } = useAuth();
  const isInfluencer = accountType !== "brand";
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  
  // Local state for draft inputs
  const [draftInputs, setDraftInputs] = useState({});
  const [feedbackInputs, setFeedbackInputs] = useState({});
  const [disputeInputs, setDisputeInputs] = useState({});

  useEffect(() => {
    fetchParticipants();
  }, []);

  async function fetchParticipants() {
    setLoading(true);
    try {
      const data = await participants.list();
      setRows(data);
    } catch (err) {
      toast.error("Failed to load workflow data.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id, action, payload = {}) {
    setBusyId(id);
    try {
      if (action === "accept") {
        await participants.accept(id);
        toast.success("Invitation accepted!");
      } else if (action === "decline") {
        // Implement decline if API is ready, or use shortlists API.
        toast.info("Decline not yet implemented in v2 API.");
      } else if (action === "submitDraft") {
        if (!payload.fileUrl) {
          toast.error("Please provide a Draft Video URL.");
          setBusyId(null);
          return;
        }
        await participants.submitDraft(id, payload);
        toast.success("Draft submitted successfully!");
      } else if (action === "reviewDraft") {
        if (payload.action === "request_revision" && !payload.feedback) {
          toast.error("Please provide feedback for the revision.");
          setBusyId(null);
          return;
        }
        await participants.reviewDraft(id, payload);
        toast.success(payload.action === "approve" ? "Draft approved!" : "Revision requested.");
      } else if (action === "submitLiveUrl") {
        if (!payload.url) {
          toast.error("Please provide a live post URL.");
          setBusyId(null);
          return;
        }
        await participants.submitLiveUrl(id, payload);
        toast.success("Live URL submitted for verification!");
      } else if (action === "approveCompletion") {
        await participants.approveCompletion(id);
        toast.success("Campaign completed and funds released!");
      } else if (action === "createDispute") {
        if (!payload.reason) {
          toast.error("Please provide a reason for the dispute.");
          setBusyId(null);
          return;
        }
        await disputes.create({ campaignId: payload.campaignId, participantId: id, reason: payload.reason });
        toast.success("Dispute filed successfully! Our support team will review it.");
      }
      
      // Refresh the row data
      await fetchParticipants();
    } catch (err) {
      toast.error(err.message || "Action failed.");
    } finally {
      setBusyId(null);
    }
  }

  const formatStatus = (status) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "invited": return "text-blue-500 bg-blue-500/10";
      case "accepted": return "text-purple-500 bg-purple-500/10";
      case "draft_submitted": return "text-amber-500 bg-amber-500/10";
      case "brand_review": return "text-yellow-500 bg-yellow-500/10";
      case "revision_requested": return "text-red-500 bg-red-500/10";
      case "draft_approved": return "text-green-500 bg-green-500/10";
      default: return "text-muted-foreground bg-muted";
    }
  };

  return (
    <div className="surface-panel overflow-hidden">
      <div className="border-b border-border px-6 py-5">
        <h2 className="font-display text-lg font-bold">Campaign Workflow</h2>
        <p className="text-sm text-muted-foreground">
          {isInfluencer
            ? "Manage your campaign invitations and content submissions."
            : "Review content drafts from your campaign influencers."}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground bg-muted/30">
              <th className="px-6 py-4 font-semibold">Campaign / Date</th>
              <th className="px-6 py-4 font-semibold">{isInfluencer ? "Brand" : "Influencer"}</th>
              <th className="px-6 py-4 font-semibold">Budget</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {loading ? (
              <EmptyRow colSpan={5} message="Loading workflow data…" />
            ) : rows.length === 0 ? (
              <EmptyRow colSpan={5} message="No active campaigns or invitations found." />
            ) : (
              rows.map((row) => (
                <tr key={row._id} className="transition-colors hover:bg-muted/20">
                  <td className="px-6 py-4 align-top">
                    <div className="font-medium text-foreground">{row.campaignId?.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(row.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                        {isInfluencer ? (
                          row.brandId?.logoUrl ? <img src={row.brandId.logoUrl} className="h-full w-full object-cover" alt="" /> : <FileText className="size-4 text-muted-foreground" />
                        ) : (
                          row.influencerId?.avatarUrl ? <img src={row.influencerId.avatarUrl} className="h-full w-full object-cover" alt="" /> : <FileText className="size-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="font-medium">
                        {isInfluencer ? row.brandId?.companyName : row.influencerId?.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="font-semibold text-primary">₹{row.agreedAmount}</div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(row.status)}`}>
                      {formatStatus(row.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 align-top min-w-[300px]">
                    <div className="flex flex-col gap-3">
                      {/* Influencer Actions */}
                      {isInfluencer && row.status === "invited" && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="hero" disabled={busyId === row._id} onClick={() => handleAction(row._id, "accept")}>
                            Accept Invite
                          </Button>
                          <Button size="sm" variant="outline" disabled={busyId === row._id} onClick={() => handleAction(row._id, "decline")}>
                            Decline
                          </Button>
                        </div>
                      )}
                      
                      {row.status !== "invited" && (
                        <Button asChild size="sm" variant="outline" className="w-full bg-[image:var(--gradient-mint)] text-primary-foreground border-0">
                          <Link to={`/dashboard/workroom/${row._id}`}>
                            Enter Workroom
                          </Link>
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
