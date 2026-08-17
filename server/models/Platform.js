import mongoose from "mongoose";

const platformSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    icon: { type: String, default: null }, // lucide-react icon name used on the client
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Platform = mongoose.model("Platform", platformSchema);
