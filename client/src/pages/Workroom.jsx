import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { toast } from "sonner";
import { Check, X, UploadCloud, ExternalLink, AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { participants, disputes } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { WorkroomChat } from "@/components/site/WorkroomChat";

export default function Workroom() {
  const { id } = useParams();
  const { accountType } = useAuth();
  const isInfluencer = accountType !== "brand";
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  
  // Inputs
  const [fileUrl, setFileUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [feedback, setFeedback] = useState("");
  const [disputeReason, setDisputeReason] = useState("");

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await participants.getDetails(id);
      setData(res);
    } catch (err) {
      toast.error("Failed to load workroom details.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action, payload = {}) {
    setBusy(true);
    try {
      if (action === "submitDraft") {
        if (!payload.fileUrl) {
          toast.error("Please provide a Draft Video URL.");
          setBusy(false);
          return;
        }
        await participants.submitDraft(id, payload);
        toast.success("Draft submitted successfully!");
        setFileUrl("");
        setCaption("");
      } else if (action === "reviewDraft") {
        if (payload.action === "request_revision" && !payload.feedback) {
          toast.error("Please provide feedback for the revision.");
          setBusy(false);
          return;
        }
        await participants.reviewDraft(id, payload);
        toast.success(payload.action === "approve" ? "Draft approved!" : "Revision requested.");
        setFeedback("");
      } else if (action === "submitLiveUrl") {
        if (!payload.url) {
          toast.error("Please provide a live post URL.");
          setBusy(false);
          return;
        }
        await participants.submitLiveUrl(id, payload);
        toast.success("Live URL submitted for verification!");
        setLiveUrl("");
      } else if (action === "approveCompletion") {
        await participants.approveCompletion(id);
        toast.success("Campaign completed and funds released!");
      } else if (action === "createDispute") {
        if (!payload.reason) {
          toast.error("Please provide a reason for the dispute.");
          setBusy(false);
          return;
        }
        await disputes.create({ campaignId: payload.campaignId, participantId: id, reason: payload.reason });
        toast.success("Dispute filed successfully!");
        setDisputeReason("");
      }
      
      await fetchData();
    } catch (err) {
      toast.error(err.message || "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading Workroom...</div>;
  if (!data) return <div className="p-10 text-center text-red-500">Workroom not found or unauthorized.</div>;

  const { participant, submissions } = data;
  const latestSubmission = submissions?.[0]; // Submissions are typically sorted by latest first

  const formatStatus = (status) => status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard/offers" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold">{participant.campaignId?.title}</h1>
            <p className="text-sm text-muted-foreground">
              Workroom with {isInfluencer ? participant.brandId?.companyName : participant.influencerId?.name}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs text-muted-foreground">Agreed Budget</span>
          <span className="text-lg font-bold text-primary">₹{participant.agreedAmount}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Details */}
        <div className="space-y-6 lg:col-span-1">
          <div className="surface-panel p-6">
            <h3 className="mb-4 font-semibold">Campaign Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Status:</span>
                <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  {formatStatus(participant.status)}
                </span>
              </div>
              {participant.campaignId?.brief && (
                <div>
                  <span className="text-muted-foreground block mb-1">Brief:</span>
                  <p className="text-foreground">{participant.campaignId.brief}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="surface-panel p-6 border-red-500/20">
            <h3 className="mb-2 font-semibold text-red-600 flex items-center">
              <AlertTriangle className="size-4 mr-2" /> Report Issue
            </h3>
            <p className="text-xs text-muted-foreground mb-4">If the collaboration has stalled or a party is unresponsive, you can file a dispute.</p>
            <Input 
              placeholder="Reason for dispute..." 
              className="mb-2 text-sm" 
              value={disputeReason}
              onChange={e => setDisputeReason(e.target.value)}
            />
            <Button 
              variant="destructive" 
              className="w-full text-xs" 
              disabled={busy}
              onClick={() => handleAction("createDispute", { reason: disputeReason, campaignId: participant.campaignId?._id })}
            >
              Open Dispute
            </Button>
          </div>
        </div>

        {/* Right Column: Workflow & Submissions */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* Action Panel based on Status */}
          <div className="surface-panel p-6">
            <h3 className="mb-4 font-semibold">Next Action</h3>
            
            {/* Influencer: Submit Draft */}
            {isInfluencer && (participant.status === "accepted" || participant.status === "revision_requested") && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Please upload your draft video/image link for the brand to review.</p>
                <Input 
                  placeholder="Draft URL (Google Drive, Dropbox, etc.)" 
                  value={fileUrl}
                  onChange={e => setFileUrl(e.target.value)}
                />
                <Input 
                  placeholder="Caption (Optional)" 
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                />
                <Button 
                  disabled={busy} 
                  onClick={() => handleAction("submitDraft", { fileUrl, caption, deliverableId: null })}
                >
                  <UploadCloud className="size-4 mr-2" /> Submit Draft
                </Button>
              </div>
            )}

            {/* Brand: Review Draft */}
            {!isInfluencer && participant.status === "draft_submitted" && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">The influencer has submitted a draft for review.</p>
                {latestSubmission && (
                  <div className="p-3 bg-muted/30 rounded border border-border mb-4">
                    <a href={latestSubmission.fileUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center mb-2">
                      <ExternalLink className="size-4 mr-2" /> View Submitted URL
                    </a>
                    {latestSubmission.caption && <p className="text-sm"><span className="font-medium">Caption:</span> {latestSubmission.caption}</p>}
                  </div>
                )}
                <Input 
                  placeholder="Feedback (Required if requesting revision)" 
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button 
                    className="bg-green-600 hover:bg-green-700" 
                    disabled={busy} 
                    onClick={() => handleAction("reviewDraft", { action: "approve", submissionId: latestSubmission?._id })}
                  >
                    <Check className="size-4 mr-2" /> Approve Draft
                  </Button>
                  <Button 
                    variant="destructive" 
                    disabled={busy} 
                    onClick={() => handleAction("reviewDraft", { action: "request_revision", feedback, submissionId: latestSubmission?._id })}
                  >
                    <X className="size-4 mr-2" /> Request Revision
                  </Button>
                </div>
              </div>
            )}

            {/* Influencer: Submit Live URL */}
            {isInfluencer && participant.status === "draft_approved" && (
              <div className="space-y-3">
                <p className="text-sm text-green-600 font-medium">Your draft has been approved! You can now publish it.</p>
                <Input 
                  placeholder="Live Post URL (Instagram, YouTube, etc.)" 
                  value={liveUrl}
                  onChange={e => setLiveUrl(e.target.value)}
                />
                <Button 
                  className="bg-green-600 hover:bg-green-700" 
                  disabled={busy} 
                  onClick={() => handleAction("submitLiveUrl", { url: liveUrl })}
                >
                  Submit Live Post URL
                </Button>
              </div>
            )}

            {/* Brand: Verify & Release */}
            {!isInfluencer && participant.status === "published" && (
              <div className="space-y-3">
                <p className="text-sm text-blue-600 font-medium">The influencer has published the post. Verify it and release funds.</p>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 w-full" 
                  disabled={busy} 
                  onClick={() => handleAction("approveCompletion")}
                >
                  Verify Post & Release ₹{participant.agreedAmount}
                </Button>
              </div>
            )}

            {/* Waiting States */}
            {isInfluencer && participant.status === "draft_submitted" && (
              <p className="text-sm text-amber-600 font-medium flex items-center">
                <Check className="size-4 mr-2" /> Draft submitted. Waiting for Brand review.
              </p>
            )}
            {!isInfluencer && (participant.status === "accepted" || participant.status === "revision_requested") && (
              <p className="text-sm text-muted-foreground flex items-center">
                Waiting for the influencer to submit a draft...
              </p>
            )}
            {!isInfluencer && participant.status === "draft_approved" && (
              <p className="text-sm text-green-600 font-medium flex items-center">
                Draft approved. Waiting for the influencer to publish and submit the live URL...
              </p>
            )}
            {participant.status === "campaign_completed" && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-700">
                <h4 className="font-bold mb-1 flex items-center"><Check className="size-5 mr-2" /> Collaboration Completed</h4>
                <p className="text-sm">The campaign is complete and the payout has been settled. Great work!</p>
              </div>
            )}
          </div>

          {/* Submissions History */}
          <div className="surface-panel p-6">
            <h3 className="mb-4 font-semibold">Submissions History</h3>
            {submissions?.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No submissions yet.</p>
            ) : (
              <div className="space-y-4">
                {submissions.map((sub, idx) => (
                  <div key={sub._id} className="border-l-2 border-primary/30 pl-4 py-1">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-semibold">Submission #{submissions.length - idx}</span>
                      <span className="text-xs text-muted-foreground">{new Date(sub.createdAt).toLocaleString()}</span>
                    </div>
                    <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="text-blue-500 text-sm hover:underline flex items-center mb-1">
                      <ExternalLink className="size-3 mr-1" /> {sub.fileUrl}
                    </a>
                    {sub.caption && <p className="text-xs text-muted-foreground mb-2">Caption: {sub.caption}</p>}
                    
                    {/* Display Revisions for this submission */}
                    {sub.revisions?.map(rev => (
                      <div key={rev._id} className="mt-2 bg-red-500/5 border border-red-500/10 p-2 rounded text-xs">
                        <span className="font-bold text-red-600">Revision Requested:</span> {rev.feedback}
                      </div>
                    ))}
                    {sub.status === "approved" && (
                      <div className="mt-2 bg-green-500/10 text-green-700 px-2 py-1 rounded text-xs font-semibold inline-block">
                        <Check className="size-3 inline mr-1" /> Approved
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <WorkroomChat recipientId={isInfluencer ? participant.brandId?.userId : participant.influencerId?.userId} />

        </div>
      </div>
    </div>
  );
}
