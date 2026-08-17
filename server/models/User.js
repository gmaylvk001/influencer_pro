import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, default: "" },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, default: null },
    city: { type: String, default: null },
    avatarUrl: { type: String, default: null },
    accountType: { type: String, enum: ["influencer", "brand", "admin"], required: true, default: "influencer" },
    isSuspended: { type: Boolean, default: false },
    notificationPreferences: {
      emailAlerts: { type: Boolean, default: true },
      smsAlerts: { type: Boolean, default: false },
      marketing: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

userSchema.methods.setPassword = async function setPassword(plainPassword) {
  this.passwordHash = await bcrypt.hash(plainPassword, 10);
};

userSchema.methods.checkPassword = function checkPassword(plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    fullName: this.fullName,
    email: this.email,
    phone: this.phone,
    city: this.city,
    avatarUrl: this.avatarUrl,
    accountType: this.accountType,
    isSuspended: this.isSuspended,
    notificationPreferences: this.notificationPreferences,
    createdAt: this.createdAt,
  };
};

export const User = mongoose.model("User", userSchema);
