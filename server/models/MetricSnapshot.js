import mongoose from "mongoose";

const metricSnapshotSchema = new mongoose.Schema(
  {
    mediaId: { type: mongoose.Schema.Types.ObjectId, ref: "InstagramMedia", required: true },
    capturedAt: { type: Date, required: true, default: Date.now },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
    reach: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 } // Computed: (likes+comments+shares+saves) / reach
  },
  { timestamps: true }
);

metricSnapshotSchema.index({ mediaId: 1, capturedAt: 1 });

export const MetricSnapshot = mongoose.model("MetricSnapshot", metricSnapshotSchema);
