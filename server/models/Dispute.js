import mongoose from "mongoose";

const disputeSchema = new mongoose.Schema(
  {
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", required: true },
    brandId: { type: mongoose.Schema.Types.ObjectId, ref: "Brand", required: true },
    influencerId: { type: mongoose.Schema.Types.ObjectId, ref: "Influencer", required: true },
    participantId: { type: mongoose.Schema.Types.ObjectId, ref: "CampaignParticipant", required: true },
    openedBy: { type: String, enum: ["brand", "influencer"], required: true },
    reason: { type: String, required: true }, // Short description of the issue
    evidence: { type: [String], default: [] }, // Array of URLs to screenshots, etc.
    status: { type: String, enum: ["open", "under_review", "resolved_influencer", "resolved_brand", "cancelled"], default: "open" },
    adminNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Dispute = mongoose.model("Dispute", disputeSchema);
