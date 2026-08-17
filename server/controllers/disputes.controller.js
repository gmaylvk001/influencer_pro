import { Dispute } from "../models/Dispute.js";
import { CampaignParticipant } from "../models/CampaignParticipant.js";
import { Brand } from "../models/Brand.js";
import { Influencer } from "../models/Influencer.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Create a new dispute
export const createDispute = asyncHandler(async (req, res) => {
  const { participantId, reason } = req.body;
  const isBrand = req.user.accountType === "brand";

  const participant = await CampaignParticipant.findById(participantId);
  if (!participant) {
    return res.status(404).json({ error: "Participant/Campaign relationship not found" });
  }

  // Ensure user is part of this campaign
  if (isBrand) {
    const brand = await Brand.findOne({ userId: req.user._id });
    if (participant.brandId.toString() !== brand._id.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }
  } else if (req.user.accountType === "influencer") {
    const influencer = await Influencer.findOne({ userId: req.user._id });
    if (participant.influencerId.toString() !== influencer._id.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }
  }

  // Check if dispute already exists
  const existingDispute = await Dispute.findOne({ participantId, status: { $in: ["open", "under_review"] } });
  if (existingDispute) {
    return res.status(400).json({ error: "An open dispute already exists for this collaboration." });
  }

  const dispute = await Dispute.create({
    campaignId: participant.campaignId,
    brandId: participant.brandId,
    influencerId: participant.influencerId,
    participantId,
    openedBy: isBrand ? "brand" : "influencer",
    reason
  });

  res.status(201).json({ message: "Dispute opened successfully. An admin will review it shortly.", dispute });
});

// List disputes for current user
export const listMyDisputes = asyncHandler(async (req, res) => {
  let query = {};
  if (req.user.accountType === "brand") {
    const brand = await Brand.findOne({ userId: req.user._id });
    query.brandId = brand._id;
  } else if (req.user.accountType === "influencer") {
    const influencer = await Influencer.findOne({ userId: req.user._id });
    query.influencerId = influencer._id;
  } else {
    // Admin can see all
  }

  const disputes = await Dispute.find(query)
    .populate("campaignId", "title")
    .populate("brandId", "companyName logoUrl")
    .populate("influencerId", "name avatarUrl")
    .sort({ createdAt: -1 });

  res.json(disputes);
});
