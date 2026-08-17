import mongoose from "mongoose";

// Fallback table for locations that aren't in the offline india-location-kit
// dataset yet (e.g. a newly formed district). Admins can add one from the
// dashboard instead of waiting on a code deploy or a package update.
const customLocationSchema = new mongoose.Schema(
  {
    stateCode: { type: String, required: true, uppercase: true, trim: true },
    stateName: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

customLocationSchema.index({ stateCode: 1, name: 1 }, { unique: true });

export const CustomLocation = mongoose.model("CustomLocation", customLocationSchema);
