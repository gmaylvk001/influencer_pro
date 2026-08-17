import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema(
  {
    brandId: { type: mongoose.Schema.Types.ObjectId, ref: "Brand", required: true },
    title: { type: String, required: true },
    brief: { type: String, default: null },
    // Was: category: String. Now references the Niche collection.
    nicheId: { type: mongoose.Schema.Types.ObjectId, ref: "Niche", default: null },
    state: { type: String, default: null },
    district: { type: String, default: null },
    city: { type: String, default: null },
    // Was: platform: enum. Now references the Platform collection.
    platformId: { type: mongoose.Schema.Types.ObjectId, ref: "Platform", default: null },
    budget: { type: Number, default: null },
    startsOn: { type: Date, default: null },
    endsOn: { type: Date, default: null },
    status: { type: String, enum: ["draft", "pending", "pending_admin_approval", "approved", "active", "completed", "cancelled", "suspended"], default: "draft" },

    // --- "Create Campaign" wizard fields (Campaign Details / Influencer Details / Brand URLs) ---
    promotionType: { type: String, enum: ["product", "service"], default: "product" },
    promotionCities: { type: [String], default: [] }, // e.g. ["All Over the USA", "Boston", ...]
    brandName: { type: String, default: null },
    brandOverview: { type: String, default: null },
    brandWebsite: { type: String, default: null },
    goals: { type: [String], default: [] }, // "What do you want to achieve?"
    contentFormats: { type: [String], default: [] }, // "How the content should be made?" — Story / Collaborate / Post
    taskDetails: { type: String, default: null }, // "Campaign Details" textarea (deliverables)
    briefFileName: { type: String, default: null },
    briefFileUrl: { type: String, default: null },

    influencerCount: { type: String, default: null }, // e.g. "1 - 5"
    payPerInfluencer: { type: String, default: null }, // e.g. "USD 100 - USD 400"
    expectedStart: { type: String, default: null }, // "Immediately" | "Within a week" | ...

    instagramUrl: { type: String, default: null },
    youtubeUrl: { type: String, default: null },
    facebookUrl: { type: String, default: null },

    packageSelected: { type: String, enum: ["option1", "option2", "option3", null], default: null },
    type: { type: String, enum: ["self_managed", "managed", "invite_only"], default: "self_managed" },
  },
  { timestamps: true }
);

export const Campaign = mongoose.model("Campaign", campaignSchema);
