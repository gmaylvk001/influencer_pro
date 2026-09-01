import { Brand } from "../models/Brand.js";
import { Campaign } from "../models/Campaign.js";
import { Niche } from "../models/Niche.js";
import { Platform } from "../models/Platform.js";
import { Shortlist } from "../models/Shortlist.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { assertIdsExist } from "../utils/validateRefs.js";
import { InstagramMedia } from "../models/InstagramMedia.js";
import { MetricSnapshot } from "../models/MetricSnapshot.js";

async function myBrandId(userId) {
  const brand = await Brand.findOne({ userId }).select("_id");
  return brand?._id ?? null;
}

const POPULATE = [
  { path: "nicheId", select: "name slug" },
  { path: "platformId", select: "name slug icon" },
];

function toClientShape(doc) {
  return {
    id: doc._id.toString(),
    _id: doc._id.toString(),
    title: doc.title,
    brief: doc.brief,
    nicheId: doc.nicheId,
    state: doc.state,
    district: doc.district,
    city: doc.city,
    platformId: doc.platformId,
    budget: doc.budget,
    startsOn: doc.startsOn,
    endsOn: doc.endsOn,
    status: doc.status,
    createdAt: doc.createdAt,
    promotionType: doc.promotionType,
    promotionCities: doc.promotionCities,
    brandName: doc.brandName,
    brandOverview: doc.brandOverview,
    brandWebsite: doc.brandWebsite,
    goals: doc.goals,
    contentFormats: doc.contentFormats,
    taskDetails: doc.taskDetails,
    briefFileName: doc.briefFileName,
    briefFileUrl: doc.briefFileUrl,
    influencerCount: doc.influencerCount,
    payPerInfluencer: doc.payPerInfluencer,
    expectedStart: doc.expectedStart,
    instagramUrl: doc.instagramUrl,
    youtubeUrl: doc.youtubeUrl,
    facebookUrl: doc.facebookUrl,
    packageSelected: doc.packageSelected,
    type: doc.type,
  };
}

const WIZARD_FIELDS = [
  "promotionType",
  "promotionCities",
  "brandName",
  "brandOverview",
  "brandWebsite",
  "goals",
  "contentFormats",
  "taskDetails",
  "briefFileName",
  "briefFileUrl",
  "influencerCount",
  "payPerInfluencer",
  "expectedStart",
  "instagramUrl",
  "youtubeUrl",
  "facebookUrl",
  "packageSelected",
  "type",
];

// GET /api/campaigns/browse — public feed of open campaigns for influencers to apply to
export const browseCampaigns = asyncHandler(async (req, res) => {
  const query = { status: { $in: ["active", "pending"] }, type: { $ne: "invite_only" } };

  if (req.user.accountType === "influencer") {
    const { Influencer } = await import("../models/Influencer.js");
    const influencer = await Influencer.findOne({ userId: req.user._id });
    if (influencer) {
      if (influencer.niches && influencer.niches.length > 0) {
        query.nicheId = { $in: influencer.niches };
      }
      const locMatches = ["All Over India"];
      if (influencer.city) locMatches.push(influencer.city);
      if (influencer.district) locMatches.push(influencer.district);
      query.promotionCities = { $in: locMatches };
    }
  }

  const campaigns = await Campaign.find(query)
    .sort({ createdAt: -1 })
    .limit(100)
    .populate([...POPULATE, { path: "brandId", select: "companyName city logoUrl" }]);
  res.json(
    campaigns.map((c) => ({
      ...toClientShape(c),
      brandId: c.brandId,
    }))
  );
});

// GET /api/campaigns — campaigns owned by the signed-in brand
export const listMyCampaigns = asyncHandler(async (req, res) => {
  const brandId = await myBrandId(req.user._id);
  if (!brandId) return res.json([]);
  const campaigns = await Campaign.find({ brandId }).sort({ createdAt: -1 }).populate(POPULATE);
  
  const campaignIds = campaigns.map(c => c._id);
  const applicantCounts = await Shortlist.aggregate([
    { $match: { campaignId: { $in: campaignIds }, brandId } },
    { $group: { _id: "$campaignId", count: { $sum: 1 } } }
  ]);

  const countMap = {};
  applicantCounts.forEach(ac => {
    countMap[ac._id.toString()] = ac.count;
  });

  res.json(campaigns.map(c => ({
    ...toClientShape(c),
    applicantCount: countMap[c._id.toString()] || 0
  })));
});

// POST /api/campaigns
export const createCampaign = asyncHandler(async (req, res) => {
  const brandId = await myBrandId(req.user._id);
  if (!brandId) return res.status(404).json({ error: "No brand profile for this account" });

  const { title, brief, nicheId, state, district, city, platformId, budget, startsOn, endsOn, status } =
    req.body;
  if (!title) return res.status(400).json({ error: "title is required" });

  await assertIdsExist(Niche, nicheId, "niche");
  await assertIdsExist(Platform, platformId, "platform");

  const wizardData = {};
  for (const key of WIZARD_FIELDS) {
    if (key in req.body) wizardData[key] = req.body[key];
  }

  const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;
  if (fileUrl) wizardData.briefFileUrl = fileUrl;

  let campaignType = req.body.type || "self_managed";
  let invitedInfluencers = [];
  
  if (req.body.invitedInfluencerIds) {
    campaignType = "invite_only";
    if (Array.isArray(req.body.invitedInfluencerIds)) {
      invitedInfluencers = req.body.invitedInfluencerIds;
    } else {
      invitedInfluencers = req.body.invitedInfluencerIds.split(",").map(i => i.trim()).filter(Boolean);
    }
  }

  const campaign = await Campaign.create({
    brandId,
    title,
    brief,
    nicheId: nicheId || null,
    state: state || null,
    district: district || null,
    city,
    platformId: platformId || null,
    budget,
    startsOn,
    endsOn,
    status: status || "pending",
    type: campaignType,
    ...wizardData,
  });

  if (campaignType === "invite_only" && invitedInfluencers.length > 0) {
    const invites = invitedInfluencers.map(id => ({
      brandId,
      influencerId: id,
      campaignId: campaign._id,
      kind: "offer",
      note: "You've been invited to apply to this private campaign.",
    }));
    await Shortlist.insertMany(invites);
  }

  await campaign.populate(POPULATE);
  res.status(201).json(toClientShape(campaign));
});

// PATCH /api/campaigns/:id
export const updateCampaign = asyncHandler(async (req, res) => {
  const brandId = await myBrandId(req.user._id);
  if (!brandId) return res.status(404).json({ error: "No brand profile for this account" });

  const allowed = [
    "title",
    "brief",
    "nicheId",
    "state",
    "district",
    "city",
    "platformId",
    "budget",
    "startsOn",
    "endsOn",
    "status",
    ...WIZARD_FIELDS,
  ];
  const updates = {};
  for (const key of allowed) {
    if (key in req.body) updates[key] = req.body[key];
  }

  await assertIdsExist(Niche, updates.nicheId, "niche");
  await assertIdsExist(Platform, updates.platformId, "platform");

  const campaign = await Campaign.findOneAndUpdate({ _id: req.params.id, brandId }, updates, {
    new: true,
    runValidators: true,
  }).populate(POPULATE);
  if (!campaign) return res.status(404).json({ error: "Campaign not found" });
  res.json(toClientShape(campaign));
});

// GET /api/campaigns/:id
export const getCampaign = asyncHandler(async (req, res) => {
  const brandId = await myBrandId(req.user._id);
  if (!brandId) return res.status(404).json({ error: "No brand profile for this account" });

  const campaign = await Campaign.findOne({ _id: req.params.id, brandId });
  if (!campaign) return res.status(404).json({ error: "Campaign not found" });

  res.json(toClientShape(campaign));
});

// GET /api/campaigns/:id/applicants — influencers who applied/were matched to this campaign
export const listCampaignApplicants = asyncHandler(async (req, res) => {
  const brandId = await myBrandId(req.user._id);
  if (!brandId) return res.status(404).json({ error: "No brand profile for this account" });

  const campaign = await Campaign.findOne({ _id: req.params.id, brandId }).select("_id");
  if (!campaign) return res.status(404).json({ error: "Campaign not found" });

  const applicants = await Shortlist.find({ campaignId: campaign._id, brandId })
    .populate({
      path: "influencerId",
      select: "name city platformId handle avatarUrl",
      populate: { path: "userId", select: "email phone" }
    })
    .sort({ createdAt: -1 });

  const safeApplicants = applicants.map(a => {
    const doc = a.toObject();
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

  res.json(safeApplicants);
});

// DELETE /api/campaigns/:id
export const deleteCampaign = asyncHandler(async (req, res) => {
  const brandId = await myBrandId(req.user._id);
  if (!brandId) return res.status(404).json({ error: "No brand profile for this account" });

  const campaign = await Campaign.findOneAndDelete({ _id: req.params.id, brandId });
  if (!campaign) return res.status(404).json({ error: "Campaign not found" });
  res.status(204).send();
});

// GET /api/campaigns/:id/analytics
export const getCampaignAnalytics = asyncHandler(async (req, res) => {
  const brandId = await myBrandId(req.user._id);
  if (!brandId) return res.status(404).json({ error: "No brand profile for this account" });

  const campaign = await Campaign.findOne({ _id: req.params.id, brandId });
  if (!campaign) return res.status(404).json({ error: "Campaign not found" });

  // Find all InstagramMedia associated with this campaign
  const mediaItems = await InstagramMedia.find({ campaignId: campaign._id }).select("_id");
  const mediaIds = mediaItems.map(m => m._id);

  // Aggregate metrics over time
  // We want to find the LATEST snapshot for each media on each day,
  // then sum them up across all media for that day.
  const snapshots = await MetricSnapshot.aggregate([
    { $match: { mediaId: { $in: mediaIds } } },
    {
      $addFields: {
        day: { $dateToString: { format: "%Y-%m-%d", date: "$capturedAt" } }
      }
    },
    { $sort: { capturedAt: -1 } }, // Ensure latest snapshots are first
    {
      $group: {
        _id: { mediaId: "$mediaId", day: "$day" },
        views: { $first: "$views" },
        reach: { $first: "$reach" }
      }
    },
    {
      $group: {
        _id: "$_id.day",
        views: { $sum: "$views" },
        reach: { $sum: "$reach" }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  let chartData = [];
  
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  
  // Start at least 6 days ago (so we get a full 7-day chart view minimum)
  const minStartDate = new Date(end);
  minStartDate.setDate(minStartDate.getDate() - 6);
  minStartDate.setHours(0, 0, 0, 0);

  let curr = new Date(minStartDate);

  if (snapshots.length > 0) {
    const firstDateStr = snapshots[0]._id;
    const [year, month, day] = firstDateStr.split('-').map(Number);
    const firstDate = new Date(year, month - 1, day);
    // If the first snapshot was taken before 7 days ago, start the chart from that day instead
    if (firstDate < curr) {
      curr = firstDate;
    }
  }

  let lastKnownViews = 0;
  let lastKnownReach = 0;
  const snapshotMap = {};
  
  if (snapshots.length > 0) {
    lastKnownViews = snapshots[0].views;
    lastKnownReach = snapshots[0].reach;
    
    snapshots.forEach(s => {
      snapshotMap[s._id] = s;
    });
  }

  while (curr <= end) {
    const y = curr.getFullYear();
    const m = String(curr.getMonth() + 1).padStart(2, '0');
    const d = String(curr.getDate()).padStart(2, '0');
    const dayStr = `${y}-${m}-${d}`;
    
    if (snapshotMap[dayStr]) {
      lastKnownViews = snapshotMap[dayStr].views;
      lastKnownReach = snapshotMap[dayStr].reach;
    }
    
    const formattedDay = curr.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    
    chartData.push({
      day: formattedDay,
      fullDate: dayStr,
      views: lastKnownViews,
      reach: lastKnownReach
    });

    curr.setDate(curr.getDate() + 1);
  }

  res.json({ chartData });
});
