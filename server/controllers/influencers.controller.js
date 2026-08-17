import { Influencer } from "../models/Influencer.js";
import { Platform } from "../models/Platform.js";
import { Niche } from "../models/Niche.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { assertIdsExist } from "../utils/validateRefs.js";

function toClientShape(doc) {
  return {
    id: doc._id.toString(),
    userId: doc.userId?.toString(), // Added so we can send messages to their user account
    name: doc.name,
    state: doc.state,
    district: doc.district,
    city: doc.city,
    bio: doc.bio,
    avatarUrl: doc.avatarUrl,
    niches: doc.niches, // populated Niche docs ({ id, name, slug }) or raw ids
    platforms: doc.platforms, // populated Platform docs ({ id, name, slug, icon }) or raw ids
    handle: doc.handle,
    followers: doc.followers,
    posts: doc.posts,
    likes: doc.likes,
    engagement: doc.engagement,
    starting_price: doc.startingPrice,
    is_verified: doc.isVerified,
    socialLinks: doc.socialLinks,
    primaryPlatform: doc.primaryPlatform,
    
    // Additional Profile Fields
    aboutMe: doc.aboutMe,
    previousBrands: doc.previousBrands,
    workSamples: doc.workSamples,
    languages: doc.languages,
    socialAssets: doc.socialAssets,
    rates: doc.rates,
    termsAccepted: doc.termsAccepted,
    paymentDetails: doc.paymentDetails,
    influBrandScore: doc.influBrandScore,
    account_balance: doc.account_balance,
    hashtags: doc.hashtags || [],
    mentions: doc.mentions || [],
    growthHistory: doc.growthHistory || [],
    dailyStats: doc.dailyStats || [],
    recentPosts: doc.recentPosts || [],
  };
}

const POPULATE = [
  { path: "niches", select: "name slug" },
  { path: "platforms", select: "name slug icon" },
];

// GET /api/influencers — public directory, published only
export const listInfluencers = asyncHandler(async (req, res) => {
  const query = { isPublished: true };
  
  if (req.query.niche && req.query.niche !== "All") query.niches = req.query.niche;
  if (req.query.state && req.query.state !== "All") query.state = req.query.state;
  if (req.query.district) query.district = { $in: req.query.district.split(",") };
  if (req.query.platform) query.platforms = { $in: req.query.platform.split(",") };

  if (req.query.q) {
    const searchRegex = new RegExp(req.query.q, "i");
    query.$or = [
      { name: searchRegex },
      { handle: searchRegex },
      { city: searchRegex },
    ];
  }

  if (req.query.maxFollowers) {
    query.followers = { $lte: Number(req.query.maxFollowers) };
  }
  if (req.query.maxPrice) {
    query.startingPrice = { $lte: Number(req.query.maxPrice) };
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  let sortCriteria = { followers: -1 };
  if (req.query.sort === "engagement") sortCriteria = { engagement: -1 };
  else if (req.query.sort === "newest") sortCriteria = { name: 1 }; // Existing frontend sorted name alphabetically for "newest"

  const total = await Influencer.countDocuments(query);
  const docs = await Influencer.find(query)
    .sort(sortCriteria)
    .skip(skip)
    .limit(limit)
    .populate(POPULATE);
    
  res.json({
    data: docs.map(toClientShape),
    total,
    page,
    totalPages: Math.ceil(total / limit)
  });
});

// GET /api/influencers/:id
export const getInfluencer = asyncHandler(async (req, res) => {
  const doc = await Influencer.findById(req.params.id).populate(POPULATE);
  if (!doc || !doc.isPublished) {
    return res.status(404).json({ error: "Influencer not found" });
  }
  res.json(toClientShape(doc));
});

// GET /api/influencers/me — the signed-in creator's own listing (published or not)
export const getMyInfluencerProfile = asyncHandler(async (req, res) => {
  const doc = await Influencer.findOne({ userId: req.user._id }).populate(POPULATE);
  if (!doc) return res.status(404).json({ error: "No influencer profile for this account" });
  res.json(doc);
});

// PATCH /api/influencers/me — creator edits their own listing
export const updateMyInfluencerProfile = asyncHandler(async (req, res) => {
  const allowed = [
    "name",
    "state",
    "district",
    "city",
    "gender",
    "bio",
    "avatarUrl",
    "niches", // array of Niche ids
    "platforms", // array of Platform ids
    "handle",
    "followers",
    "posts",
    "likes",
    "engagement",
    "startingPrice",
    "isPublished",
    "aboutMe",
    "workSamples",
    "languages",
    "socialAssets",
    "rates",
    "termsAccepted",
    "paymentDetails",
  ];
  const updates = {};
  for (const key of allowed) {
    if (key in req.body) updates[key] = req.body[key];
  }

  await assertIdsExist(Niche, updates.niches, "niche");
  await assertIdsExist(Platform, updates.platforms, "platform");

  // --- DEMO FEATURE: Simulate Instagram Fetch ---
  if (updates.socialAssets && updates.socialAssets.Instagram && updates.socialAssets.Instagram.url) {
    updates.followers = 345000;
    updates.posts = 1240;
    updates.likes = 45000;
    updates.engagement = 13.2;
    updates.hashtags = ["#fashion", "#style", "#ootd", "#travel", "#lifestyle", "#beauty", "#gym", "#workout"];
    updates.mentions = ["@zara", "@hm", "@nike", "@mac", "@sephora"];
    
    // Generate 12 months growth
    const growthHistory = [];
    let currentFollowers = 150000;
    for (let i = 11; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      growthHistory.push({
        date: d.toISOString().split('T')[0],
        followers: currentFollowers,
        posts: Math.floor(updates.posts * (1 - (i/12))),
      });
      currentFollowers += Math.floor((updates.followers - currentFollowers) / (i + 1));
    }
    updates.growthHistory = growthHistory;

    // Generate 7 days stats
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      dailyStats.push({
        date: d.toISOString().split('T')[0],
        likes: Math.floor(updates.likes * (Math.random() * 0.5 + 0.5)),
        comments: Math.floor(updates.likes * 0.1 * (Math.random() * 0.5 + 0.5)),
        posts: Math.random() > 0.5 ? 1 : 0,
        videos: Math.random() > 0.8 ? 1 : 0,
      });
    }
    updates.dailyStats = dailyStats;

    // Generate 12 recent posts
    const recentPosts = [];
    
    // Array of high-quality realistic lifestyle/fashion unsplash images for mockup
    const unsplashImages = [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1485230405346-71acb9518d9c?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1509631179647-0c50006423ac?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1434389670869-c8073fc14da8?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1550614000-4b95d466f272?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1495121605193-b116b5b9c5fe?auto=format&fit=crop&q=80&w=400"
    ];

    for (let i = 0; i < 12; i++) {
      const d = new Date(); d.setDate(d.getDate() - i * 2);
      recentPosts.push({
        imageUrl: unsplashImages[i],
        postUrl: updates.socialAssets.Instagram.url,
        likes: Math.floor(updates.likes * (Math.random() * 0.5 + 0.5)),
        comments: Math.floor(updates.likes * 0.1 * (Math.random() * 0.5 + 0.5)),
        date: d.toISOString().split('T')[0]
      });
    }
    updates.recentPosts = recentPosts;
  }
  // ----------------------------------------------

  const doc = await Influencer.findOneAndUpdate({ userId: req.user._id }, updates, {
    new: true,
    runValidators: true,
  }).populate(POPULATE);
  if (!doc) return res.status(404).json({ error: "No influencer profile for this account" });
  res.json(doc);
});

// GET /api/influencers/admin/list — Admins see all influencers (published or not)
export const listInfluencersAdmin = asyncHandler(async (req, res) => {
  const docs = await Influencer.find().sort({ createdAt: -1 }).populate(POPULATE);
  res.json(docs.map(toClientShape));
});

// PATCH /api/influencers/admin/:id/verify — Admins toggle verification
export const verifyInfluencerAdmin = asyncHandler(async (req, res) => {
  if (typeof req.body.isVerified !== "boolean") {
    return res.status(400).json({ error: "isVerified boolean is required" });
  }
  
  const doc = await Influencer.findByIdAndUpdate(
    req.params.id,
    { isVerified: req.body.isVerified },
    { new: true }
  ).populate(POPULATE).populate("userId", "email");
  
  if (!doc) return res.status(404).json({ error: "Influencer not found" });

  // Send email if newly verified
  if (req.body.isVerified && doc.userId && doc.userId.email) {
    import("../utils/email.js")
      .then(({ sendAccountApprovedEmail }) => {
        sendAccountApprovedEmail(doc.userId.email, doc.name).catch(console.error);
      })
      .catch(console.error);
  }

  res.json(toClientShape(doc));
});
