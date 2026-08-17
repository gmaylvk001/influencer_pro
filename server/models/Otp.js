import { Schema, model } from "mongoose";

const otpSchema = new Schema(
  {
    email: { type: String, required: true },
    otp: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 300 }, // Expires after 5 minutes (300 seconds)
  }
);

export const Otp = model("Otp", otpSchema);
