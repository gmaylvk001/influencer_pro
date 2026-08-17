import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    influencerId: { type: mongoose.Schema.Types.ObjectId, ref: "Influencer", default: null },
    subject: { type: String, default: null },
    body: { type: String, required: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);
