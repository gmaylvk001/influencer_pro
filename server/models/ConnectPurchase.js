import mongoose from "mongoose";

// One row per successful "Buy Connects" checkout. Also doubles as the source
// for the Connect Wallet ledger (each purchase = a credit entry) and the
// Package Purchase History table — brands only ever buy connect packages
// today, so both history views read from this same collection.
const connectPurchaseSchema = new mongoose.Schema(
  {
    brandId: { type: mongoose.Schema.Types.ObjectId, ref: "Brand", required: true },
    packageKey: { type: String, required: true },
    connects: { type: Number, required: true },
    amountInr: { type: Number, required: true },
    status: { type: String, enum: ["success"], default: "success" },
  },
  { timestamps: true }
);

connectPurchaseSchema.index({ brandId: 1, createdAt: -1 });

export const ConnectPurchase = mongoose.model("ConnectPurchase", connectPurchaseSchema);
