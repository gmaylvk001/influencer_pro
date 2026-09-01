import mongoose from "mongoose";

const instagramMediaSchema = new mongoose.Schema(
  {
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", required: true },
    influencerId: { type: mongoose.Schema.Types.ObjectId, ref: "Influencer", required: true },
    mediaId: { type: String, required: true }, // Instagram Media ID
    permalink: { type: String, default: null },
    mediaType: { type: String, default: null }, // e.g., REEL, IMAGE, CAROUSEL_ALBUM
    caption: { type: String, default: null },
    publishedAt: { type: Date, default: null },
    lastSyncAt: { type: Date, default: null }
  },
  { timestamps: true }
);

instagramMediaSchema.index({ campaignId: 1, influencerId: 1, mediaId: 1 }, { unique: true });

export const InstagramMedia = mongoose.model("InstagramMedia", instagramMediaSchema);
