import mongoose from "mongoose";

const instagramAccountSchema = new mongoose.Schema(
  {
    influencerId: { type: mongoose.Schema.Types.ObjectId, ref: "Influencer", required: true, unique: true },
    instagramUserId: { type: String, required: true },
    accessToken: { type: String, required: true },
    tokenExpiresAt: { type: Date, required: true },
    pageId: { type: String, default: null }, // Facebook Page ID linked to the Instagram Professional Account
    username: { type: String, default: null },
    profilePictureUrl: { type: String, default: null }
  },
  { timestamps: true }
);

export const InstagramAccount = mongoose.model("InstagramAccount", instagramAccountSchema);
