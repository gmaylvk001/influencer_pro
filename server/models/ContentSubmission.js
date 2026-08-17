import mongoose from "mongoose";

const contentSubmissionSchema = new mongoose.Schema(
  {
    deliverableId: { type: mongoose.Schema.Types.ObjectId, ref: "Deliverable", default: null },
    participantId: { type: mongoose.Schema.Types.ObjectId, ref: "CampaignParticipant", required: true },
    fileUrl: { type: String, required: true }, // URL to the uploaded video or image draft
    fileName: { type: String, default: "" },
    caption: { type: String, default: "" },
    hashtags: { type: [String], default: [] },
    mentions: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["submitted", "reviewing", "revision_requested", "approved", "rejected"],
      default: "submitted"
    }
  },
  { timestamps: true }
);

export const ContentSubmission = mongoose.model("ContentSubmission", contentSubmissionSchema);
