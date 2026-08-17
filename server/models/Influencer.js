import mongoose from "mongoose";

const influencerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, sparse: true },
    name: { type: String, required: true },

    // Location — state/district codes come from india-location-kit (or the
    // CustomLocation fallback table), never hardcoded in this schema.
    state: { type: String, default: null }, // e.g. "TN"
    district: { type: String, default: null }, // e.g. "Madurai"
    city: { type: String, required: true },

    gender: { type: String, default: null },
    bio: { type: String, default: "" },
    avatarUrl: { type: String, default: null },

    // Was: categories: [String]. Now references the Niche collection so
    // niches can be managed (added/renamed/retired) without a code change.
    niches: [{ type: mongoose.Schema.Types.ObjectId, ref: "Niche" }],

    // Was: platform: enum. Now references the Platform collection for the
    // same reason — new platforms can be added from the DB. Array because an
    // influencer can be active on more than one platform (like niches).
    platforms: [{ type: mongoose.Schema.Types.ObjectId, ref: "Platform" }],

    handle: { type: String, default: null },
    followers: { type: Number, default: 0 },
    posts: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 },
    startingPrice: { type: Number, default: null },
    isVerified: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },

    // Added for real data integration
    socialLinks: {
      instagram: { type: String, default: null },
      youtube: { type: String, default: null },
      linkedin: { type: String, default: null },
      twitter: { type: String, default: null },
      facebook: { type: String, default: null },
    },
    primaryPlatform: { type: String, default: null },
    source: { type: String, default: "seed" },
    lastScrapedAt: { type: Date, default: null },

    // Additional Profile Fields (from Dashboard)
    aboutMe: { type: String, default: "" },
    previousBrands: [{ companyName: String, city: String }],
    workSamples: [{ title: String, url: String, description: String }],
    languages: { type: [String], default: [] },
    socialAssets: { type: Object, default: {} },
    rates: [{ activityType: String, priceINR: Number }],
    termsAccepted: { type: Boolean, default: false },
    paymentDetails: {
      accountHolderName: { type: String, default: "" },
      bankName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      ifscCode: { type: String, default: "" },
      upiId: { type: String, default: "" },
    },
    influBrandScore: { type: Number, default: 0 },
    account_balance: { type: Number, default: 0 },

    // Analytics and Profile Real Data
    hashtags: { type: [String], default: [] },
    mentions: { type: [String], default: [] },
    growthHistory: {
      type: [{ date: String, followers: Number, posts: Number }],
      default: []
    },
    dailyStats: {
      type: [{ date: String, likes: Number, comments: Number, posts: Number, videos: Number }],
      default: []
    },
    recentPosts: {
      type: [{ imageUrl: String, likes: Number, comments: Number, date: String }],
      default: []
    },
  },
  { timestamps: true }
);

influencerSchema.index({ followers: -1 });
influencerSchema.index({ isPublished: 1 });
influencerSchema.index({ niches: 1 });
influencerSchema.index({ platforms: 1 });
influencerSchema.index({ state: 1, district: 1 });

export const Influencer = mongoose.model("Influencer", influencerSchema);