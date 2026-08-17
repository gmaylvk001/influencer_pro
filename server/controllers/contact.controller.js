import { ContactMessage } from "../models/ContactMessage.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// POST /api/contact — public contact form on the marketing site
export const submitContactMessage = asyncHandler(async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: "name, email and message are required" });
  }

  const doc = await ContactMessage.create({ name, email, message });
  res.status(201).json({ id: doc._id.toString() });
});
