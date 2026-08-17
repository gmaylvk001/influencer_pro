import { CampaignParticipant } from "../models/CampaignParticipant.js";
import { ContentSubmission } from "../models/ContentSubmission.js";
import { ContentRevision } from "../models/ContentRevision.js";
import { Deliverable } from "../models/Deliverable.js";
import { Campaign } from "../models/Campaign.js";
import { Brand } from "../models/Brand.js";
import { Influencer } from "../models/Influencer.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Brand invites influencer
export const inviteParticipant = asyncHandler(async (req, res) => {
  const { campaignId, influencerId, agreedAmount, invitationMessage } = req.body;

  if (req.user.accountType !== "brand") {
    return res.status(403).json({ error: "Only brands can invite influencers." });
  }

  const brand = await Brand.findOne({ userId: req.user._id });
  if (!brand) return res.status(404).json({ error: "Brand not found" });

  const participant = await CampaignParticipant.create({
    campaignId,
    brandId: brand._id,
    influencerId,
    status: "invited",
    agreedAmount: agreedAmount || 0,
    invitationMessage: invitationMessage || ""
  });

  res.status(201).json({ message: "Influencer invited successfully", participant });
});

// Influencer accepts invitation
export const acceptInvite = asyncHandler(async (req, res) => {
  const { participantId } = req.params;

  if (req.user.accountType !== "influencer") {
    return res.status(403).json({ error: "Only influencers can accept invitations." });
  }

  const influencer = await Influencer.findOne({ userId: req.user._id });
  if (!influencer) return res.status(404).json({ error: "Influencer not found" });

  const participant = await CampaignParticipant.findOneAndUpdate(
    { _id: participantId, influencerId: influencer._id },
    { status: "accepted" },
    { new: true }
  );

  if (!participant) return res.status(404).json({ error: "Participant record not found" });

  res.json({ message: "Invitation accepted", participant });
});

// Influencer submits content draft
export const submitDraft = asyncHandler(async (req, res) => {
  const { participantId } = req.params;
  const { deliverableId, fileUrl, caption, hashtags } = req.body;

  if (req.user.accountType !== "influencer") {
    return res.status(403).json({ error: "Only influencers can submit drafts." });
  }

  const participant = await CampaignParticipant.findById(participantId);
  if (!participant) return res.status(404).json({ error: "Participant not found" });

  const submission = await ContentSubmission.create({
    deliverableId,
    participantId,
    fileUrl,
    caption,
    hashtags
  });

  participant.status = "draft_submitted";
  await participant.save();

  res.status(201).json({ message: "Draft submitted", submission, participant });
});

// Brand reviews content draft
export const reviewDraft = asyncHandler(async (req, res) => {
  const { participantId } = req.params;
  const { submissionId, action, feedback } = req.body; // action: 'approve', 'request_revision', 'reject'

  if (req.user.accountType !== "brand") {
    return res.status(403).json({ error: "Only brands can review drafts." });
  }

  const brand = await Brand.findOne({ userId: req.user._id });
  const participant = await CampaignParticipant.findById(participantId);
  if (!participant || participant.brandId.toString() !== brand._id.toString()) {
    return res.status(404).json({ error: "Participant not found or unauthorized" });
  }

  let submission;
  if (submissionId && submissionId !== "latest_mock_id") {
    submission = await ContentSubmission.findById(submissionId);
  } else {
    submission = await ContentSubmission.findOne({ participantId }).sort({ createdAt: -1 });
  }
  if (!submission) return res.status(404).json({ error: "Submission not found" });

  if (action === "request_revision") {
    if (!feedback) return res.status(400).json({ error: "Feedback is required for revisions." });
    
    await ContentRevision.create({
      submissionId,
      brandId: brand._id,
      feedback
    });
    
    submission.status = "revision_requested";
    participant.status = "revision_requested";
  } else if (action === "approve") {
    submission.status = "approved";
    participant.status = "draft_approved";
  } else if (action === "reject") {
    submission.status = "rejected";
    participant.status = "brand_review"; // Or whatever logic you want here
  }

  await submission.save();
  await participant.save();

  res.json({ message: "Draft reviewed", submission, participant });
});

// Get participant details along with submissions
export const getParticipantDetails = asyncHandler(async (req, res) => {
  const { participantId } = req.params;
  
  const participant = await CampaignParticipant.findById(participantId)
    .populate("campaignId")
    .populate("brandId", "companyName logoUrl userId")
    .populate("influencerId", "name avatarUrl handle userId");
    
  if (!participant) return res.status(404).json({ error: "Participant not found" });
  
  const submissions = await ContentSubmission.find({ participantId }).lean();
  
  // Attach revisions to submissions
  for (let i = 0; i < submissions.length; i++) {
    submissions[i].revisions = await ContentRevision.find({ submissionId: submissions[i]._id });
  }

  res.json({ participant, submissions });
});

// Get all participants for the current user
export const getMyParticipants = asyncHandler(async (req, res) => {
  let query = {};
  if (req.user.accountType === "brand") {
    const brand = await Brand.findOne({ userId: req.user._id });
    if (!brand) return res.status(404).json({ error: "Brand not found" });
    query.brandId = brand._id;
  } else if (req.user.accountType === "influencer") {
    const influencer = await Influencer.findOne({ userId: req.user._id });
    if (!influencer) return res.status(404).json({ error: "Influencer not found" });
    query.influencerId = influencer._id;
  } else {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const participants = await CampaignParticipant.find(query)
    .populate("campaignId", "title status budget")
    .populate("brandId", "companyName logoUrl")
    .populate("influencerId", "name avatarUrl handle")
    .sort({ updatedAt: -1 })
    .lean();

  for (let i = 0; i < participants.length; i++) {
    const latestSubmission = await ContentSubmission.findOne({ participantId: participants[i]._id }).sort({ createdAt: -1 }).lean();
    if (latestSubmission) {
      participants[i].latestSubmission = latestSubmission;
    }
  }

  res.json(participants);
});

// Influencer submits published URL
export const submitLiveUrl = asyncHandler(async (req, res) => {
  const { participantId } = req.params;
  const { url } = req.body;

  if (req.user.accountType !== "influencer") {
    return res.status(403).json({ error: "Only influencers can submit a live URL." });
  }

  const participant = await CampaignParticipant.findById(participantId);
  if (!participant) return res.status(404).json({ error: "Participant not found" });

  if (participant.status !== "draft_approved") {
    return res.status(400).json({ error: "Draft must be approved before submitting a live URL." });
  }

  if (!url) return res.status(400).json({ error: "Live URL is required." });

  // Update participant status
  participant.status = "published";
  
  // Could optionally save this URL somewhere, e.g. on the participant or the submission.
  // For now we'll just save it on the participant model if we add a `liveUrl` field.
  // Alternatively, just trust the status progression for now.
  
  await participant.save();

  res.json({ message: "Live URL submitted", participant });
});

// Brand approves completion and releases funds
export const approveCompletion = asyncHandler(async (req, res) => {
  const { participantId } = req.params;

  if (req.user.accountType !== "brand") {
    return res.status(403).json({ error: "Only brands can approve completion." });
  }

  const participant = await CampaignParticipant.findById(participantId);
  if (!participant) return res.status(404).json({ error: "Participant not found" });

  const brand = await Brand.findOne({ userId: req.user._id });
  if (participant.brandId.toString() !== brand._id.toString()) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  if (participant.status !== "published" && participant.status !== "post_verification") {
    return res.status(400).json({ error: "Participant must submit a live post before you can approve completion." });
  }

  // Release Escrow -> Mark as campaign_completed -> create cleared Transaction for Influencer Wallet
  participant.status = "campaign_completed";
  await participant.save();

  // Escrow / Wallet logic
  // Create a transaction that represents the released funds
  const { Transaction } = await import("../models/Transaction.js");
  
  await Transaction.create({
    influencerId: participant.influencerId,
    brandId: participant.brandId,
    campaignId: participant.campaignId,
    amount: participant.agreedAmount,
    status: "cleared",
    title: "Campaign Payment: " + participant._id.toString().slice(-6)
  });

  // We could optionally update the Influencer's account_balance directly, 
  // but currently the Wallet UI (transactions.controller) sums up 'cleared' transactions!

  // Check if ALL participants for this campaign are now completed — if so, mark the Campaign itself as completed
  const allParticipants = await CampaignParticipant.find({ campaignId: participant.campaignId });
  const allDone = allParticipants.every(p => 
    ["campaign_completed", "payment_released", "paid", "declined"].includes(p.status)
  );
  if (allDone) {
    await Campaign.findByIdAndUpdate(participant.campaignId, { status: "completed" });
  }

  res.json({ message: "Campaign completed and funds released to influencer.", participant });
});
