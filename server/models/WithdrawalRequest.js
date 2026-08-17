import mongoose from "mongoose";

const withdrawalRequestSchema = new mongoose.Schema(
  {
    influencerId: { type: mongoose.Schema.Types.ObjectId, ref: "Influencer", required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "approved", "rejected", "processed"], default: "pending" },
    adminNotes: { type: String, default: "" },
    paymentMethodDetails: { type: Object, default: {} }, // Snapshotted at time of request
  },
  { timestamps: true }
);

export const WithdrawalRequest = mongoose.model("WithdrawalRequest", withdrawalRequestSchema);
