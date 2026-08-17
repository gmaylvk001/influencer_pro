import { Brand } from "../models/Brand.js";
import { Influencer } from "../models/Influencer.js";
import { Shortlist } from "../models/Shortlist.js";
import { ConnectUsage } from "../models/ConnectUsage.js";
import { Transaction } from "../models/Transaction.js";
import { Campaign } from "../models/Campaign.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// POST /api/shortlists — brand shortlists/offers an influencer, OR an
// influencer applies to a brand's campaign (kind: "application").
export const createShortlist = asyncHandler(async (req, res) => {
  const { influencerId, campaignId, kind, note } = req.body;

  if (req.user.accountType === "influencer") {
    // Influencer applying to a campaign: infer influencerId + brandId, ignore any passed influencerId.
    const influencer = await Influencer.findOne({ userId: req.user._id }).select("_id");
    if (!influencer) {
      return res.status(404).json({ error: "Your influencer profile is still being set up. Try again in a moment." });
    }
    if (!campaignId) return res.status(400).json({ error: "campaignId is required" });

    const { Campaign } = await import("../models/Campaign.js");
    const campaign = await Campaign.findById(campaignId).select("_id brandId");
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });

    const shortlist = await Shortlist.create({
      brandId: campaign.brandId,
      influencerId: influencer._id,
      campaignId: campaign._id,
      kind: "application",
      note: note || null,
    });
    return res.status(201).json(shortlist);
  }

  const brand = await Brand.findOne({ userId: req.user._id }).select("_id");
  if (!brand) {
    return res.status(404).json({ error: "Your brand profile is still being set up. Try again in a moment." });
  }

  if (!influencerId) return res.status(400).json({ error: "influencerId is required" });

  const influencer = await Influencer.findById(influencerId).select("_id name");
  if (!influencer) return res.status(404).json({ error: "Influencer not found" });

  const existing = await Shortlist.findOne({
    brandId: brand._id,
    influencerId,
    campaignId: campaignId || null,
  });

  if (existing) {
    if (existing.kind === "offer" || kind === "shortlist") {
      return res.status(409).json({ error: "Already exists" });
    }
    // Upgrade shortlist to offer
    existing.kind = "offer";
    if (note) existing.note = note;
    await existing.save();
    return res.status(200).json(existing);
  }

  const shortlist = await Shortlist.create({
    brandId: brand._id,
    influencerId,
    campaignId: campaignId || null,
    kind: kind === "offer" ? "offer" : "shortlist",
    note: note || null,
  });

  res.status(201).json(shortlist);
});

// GET /api/shortlists — for a brand: everything they've shortlisted/offered.
// For an influencer: shortlists/offers they've received.
export const listMyShortlists = asyncHandler(async (req, res) => {
  if (req.user.accountType === "brand") {
    const brand = await Brand.findOne({ userId: req.user._id }).select("_id");
    if (!brand) return res.json([]);
    const shortlists = await Shortlist.find({ brandId: brand._id })
      .populate({
        path: "influencerId",
        select: "name city platformId handle avatarUrl",
        populate: { path: "userId", select: "email phone" }
      })
      .sort({ createdAt: -1 });
      
    const safeShortlists = shortlists.map(s => {
      const doc = s.toObject();
      if (doc.influencerId && doc.influencerId.userId) {
        doc.influencerId.email = doc.influencerId.userId.email;
        doc.influencerId.phone = doc.influencerId.userId.phone;
        delete doc.influencerId.userId;
      }
      if (!doc.isUnlocked && doc.influencerId) {
        delete doc.influencerId.email;
        delete doc.influencerId.phone;
      }
      return doc;
    });
    return res.json(safeShortlists);
  }

  const influencer = await Influencer.findOne({ userId: req.user._id }).select("_id");
  if (!influencer) return res.json([]);
  const shortlists = await Shortlist.find({ influencerId: influencer._id })
    .populate("brandId", "companyName city logoUrl userId")
    .sort({ createdAt: -1 });
  res.json(shortlists);
});

// PATCH /api/shortlists/:id — influencer accepts/declines an offer
export const respondToShortlist = asyncHandler(async (req, res) => {
  const influencer = await Influencer.findOne({ userId: req.user._id }).select("_id");
  if (!influencer) return res.status(404).json({ error: "No influencer profile for this account" });

  const { response } = req.body;
  if (!["accepted", "declined", "pending"].includes(response)) {
    return res.status(400).json({ error: "response must be 'accepted', 'declined' or 'pending'" });
  }

  const shortlist = await Shortlist.findOneAndUpdate(
    { _id: req.params.id, influencerId: influencer._id },
    { response },
    { new: true }
  ).populate("campaignId").populate("brandId", "companyName city logoUrl userId");
  if (!shortlist) return res.status(404).json({ error: "Shortlist entry not found" });

  // Real Transaction Engine: If offer is accepted, create a pending transaction!
  if (response === "accepted") {
    let amount = 15000; // Default fallback amount
    let title = "Campaign Payment";

    if (shortlist.campaignId) {
      // Use campaign budget if available, or parse payPerInfluencer
      amount = shortlist.campaignId.budget || 25000; 
      title = `Campaign Payment: ${shortlist.campaignId.title}`;
    }

    // Prevent duplicate transactions if already accepted previously
    const existingTx = await Transaction.findOne({ shortlistId: shortlist._id });
    if (!existingTx) {
      await Transaction.create({
        influencerId: influencer._id,
        brandId: shortlist.brandId,
        campaignId: shortlist.campaignId ? shortlist.campaignId._id : null,
        shortlistId: shortlist._id,
        amount,
        status: "pending",
        title,
      });
    }
  }

  res.json(shortlist);
});

// PATCH /api/shortlists/:id/unlock — brand unlocks an influencer's contact details
export const unlockContact = asyncHandler(async (req, res) => {
  const brand = await Brand.findOne({ userId: req.user._id });
  if (!brand) return res.status(404).json({ error: "Brand profile not found" });

  const shortlist = await Shortlist.findOne({ _id: req.params.id, brandId: brand._id })
    .populate({
      path: "influencerId",
      select: "name city platformId handle avatarUrl",
      populate: { path: "userId", select: "email phone" }
    });
  
  if (!shortlist) return res.status(404).json({ error: "Shortlist entry not found" });
  
  if (shortlist.isUnlocked) {
    return res.json(shortlist);
  }

  if ((brand.connectBalance || 0) < 1) {
    return res.status(400).json({ error: "Insufficient Connect Balance" });
  }

  brand.connectBalance -= 1;
  await brand.save();

  shortlist.isUnlocked = true;
  await shortlist.save();

  await ConnectUsage.create({
    brandId: brand._id,
    shortlistId: shortlist._id,
    connects: 1
  });

  const doc = shortlist.toObject();
  if (doc.influencerId && doc.influencerId.userId) {
    doc.influencerId.email = doc.influencerId.userId.email;
    doc.influencerId.phone = doc.influencerId.userId.phone;
    delete doc.influencerId.userId;
  }

  res.json(doc);
});

// POST /api/shortlists/:id/submit — influencer submits their work link
export const submitTask = asyncHandler(async (req, res) => {
  const influencer = await Influencer.findOne({ userId: req.user._id });
  if (!influencer) return res.status(404).json({ error: "Influencer not found" });

  const { taskLink } = req.body;
  if (!taskLink) return res.status(400).json({ error: "taskLink is required" });

  const shortlist = await Shortlist.findOneAndUpdate(
    { _id: req.params.id, influencerId: influencer._id },
    { taskStatus: "submitted", taskLink },
    { new: true }
  ).populate("campaignId").populate("brandId", "companyName city logoUrl userId");

  if (!shortlist) return res.status(404).json({ error: "Shortlist entry not found" });
  res.json(shortlist);
});

// POST /api/shortlists/:id/approve — brand approves work and releases funds
export const approveTask = asyncHandler(async (req, res) => {
  const brand = await Brand.findOne({ userId: req.user._id });
  if (!brand) return res.status(404).json({ error: "Brand not found" });

  const shortlist = await Shortlist.findOneAndUpdate(
    { _id: req.params.id, brandId: brand._id },
    { taskStatus: "approved" },
    { new: true }
  ).populate({
    path: "influencerId",
    select: "name city platformId handle avatarUrl",
    populate: { path: "userId", select: "email phone" }
  });

  if (!shortlist) return res.status(404).json({ error: "Shortlist entry not found" });

  // Escrow Release: Update the pending transaction to cleared
  await Transaction.findOneAndUpdate(
    { shortlistId: shortlist._id, status: "pending" },
    { status: "cleared" }
  );

  res.json(shortlist);
});

// POST /api/shortlists/:id/reject — brand rejects work
export const rejectTask = asyncHandler(async (req, res) => {
  const brand = await Brand.findOne({ userId: req.user._id });
  if (!brand) return res.status(404).json({ error: "Brand not found" });

  const shortlist = await Shortlist.findOneAndUpdate(
    { _id: req.params.id, brandId: brand._id },
    { taskStatus: "rejected" },
    { new: true }
  ).populate({
    path: "influencerId",
    select: "name city platformId handle avatarUrl",
    populate: { path: "userId", select: "email phone" }
  });

  if (!shortlist) return res.status(404).json({ error: "Shortlist entry not found" });

  res.json(shortlist);
});
