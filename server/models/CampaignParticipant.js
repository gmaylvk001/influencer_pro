import mongoose from "mongoose";

const campaignParticipantSchema = new mongoose.Schema(
  {
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", required: true },
    brandId: { type: mongoose.Schema.Types.ObjectId, ref: "Brand", required: true },
    influencerId: { type: mongoose.Schema.Types.ObjectId, ref: "Influencer", required: true },
    status: {
      type: String,
      enum: [
        "invited",
        "accepted",
        "declined",
        "content_in_progress",
        "draft_submitted",
        "brand_review",
        "revision_requested",
        "draft_approved",
        "ready_to_publish",
        "published",
        "post_verification",
        "campaign_completed",
        "payment_released",
        "paid"
      ],
      default: "invited"
    },
    agreedAmount: { type: Number, default: 0 },
    platformFee: { type: Number, default: 0 },
    invitationMessage: { type: String, default: "" },
    deadline: { type: Date, default: null }
  },
  { timestamps: true }
);

campaignParticipantSchema.index({ brandId: 1, influencerId: 1, campaignId: 1 }, { unique: true });

export const CampaignParticipant = mongoose.model("CampaignParticipant", campaignParticipantSchema);
