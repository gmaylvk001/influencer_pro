import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    influencerId: { type: mongoose.Schema.Types.ObjectId, ref: "Influencer", required: true },
    brandId: { type: mongoose.Schema.Types.ObjectId, ref: "Brand", required: true },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", default: null },
    shortlistId: { type: mongoose.Schema.Types.ObjectId, ref: "Shortlist", default: null },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "cleared", "withdrawn", "pending_funds", "funds_secured", "ready_for_release", "released"], default: "pending" },
    title: { type: String, required: true }, // E.g., "Campaign Payment: Summer Fashion"
  },
  { timestamps: true }
);

export const Transaction = mongoose.model("Transaction", transactionSchema);
