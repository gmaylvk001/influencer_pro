import mongoose from "mongoose";

const deliverableSchema = new mongoose.Schema(
  {
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", required: true },
    participantId: { type: mongoose.Schema.Types.ObjectId, ref: "CampaignParticipant", default: null }, // Null if it's a template for the whole campaign, set if specific to participant
    type: { type: String, required: true }, // e.g., "Reel", "Story", "Static Post", "YouTube Video"
    description: { type: String, default: "" }, // Details about this specific deliverable
    requirements: { type: [String], default: [] }, // "Must tag @brand", "Must include #BrandName"
    deadline: { type: Date, default: null }
  },
  { timestamps: true }
);

export const Deliverable = mongoose.model("Deliverable", deliverableSchema);
