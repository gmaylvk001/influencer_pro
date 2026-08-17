import mongoose from "mongoose";

const contentRevisionSchema = new mongoose.Schema(
  {
    submissionId: { type: mongoose.Schema.Types.ObjectId, ref: "ContentSubmission", required: true },
    brandId: { type: mongoose.Schema.Types.ObjectId, ref: "Brand", required: true },
    feedback: { type: String, required: true }, // The brand's feedback, e.g., "Add the CTA 'Shop now'"
  },
  { timestamps: true }
);

export const ContentRevision = mongoose.model("ContentRevision", contentRevisionSchema);
