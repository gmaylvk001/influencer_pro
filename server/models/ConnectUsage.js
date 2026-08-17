import mongoose from "mongoose";

const connectUsageSchema = new mongoose.Schema(
  {
    brandId: { type: mongoose.Schema.Types.ObjectId, ref: "Brand", required: true },
    shortlistId: { type: mongoose.Schema.Types.ObjectId, ref: "Shortlist", required: true },
    connects: { type: Number, default: 1 }, // Amount of connects deducted
  },
  { timestamps: true }
);

connectUsageSchema.index({ brandId: 1, createdAt: -1 });

export const ConnectUsage = mongoose.model("ConnectUsage", connectUsageSchema);
