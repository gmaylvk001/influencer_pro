import { Message } from "../models/Message.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getReceiverSocketId, getIo } from "../socket.js";

// GET /api/messages — everything sent to or by the signed-in user
export const listMyMessages = asyncHandler(async (req, res) => {
  const messages = await Message.find({
    $or: [{ senderId: req.user._id }, { recipientId: req.user._id }],
  })
    .sort({ createdAt: -1 })
    .populate("senderId", "fullName email")
    .populate("recipientId", "fullName email");
  res.json(messages);
});

// POST /api/messages
export const sendMessage = asyncHandler(async (req, res) => {
  const { recipientId, influencerId, subject, body } = req.body;
  if (!recipientId || !body) {
    return res.status(400).json({ error: "recipientId and body are required" });
  }

  const message = await Message.create({
    senderId: req.user._id,
    recipientId,
    influencerId: influencerId || null,
    subject: subject || null,
    body,
  });

  // Send New Message Email
  import("../models/User.js").then(({ User }) => {
    User.findById(recipientId).select("email notificationPreferences").then(recipient => {
      // Check if user has disabled email notifications for messages (assuming we store this in preferences)
      if (recipient && recipient.email && recipient.notificationPreferences?.email !== false) {
        import("../utils/email.js")
          .then(({ sendNewMessageEmail }) => {
            sendNewMessageEmail(recipient.email, req.user.fullName || "A user", subject || "New Message")
              .catch(console.error);
          })
          .catch(console.error);
      }
    }).catch(console.error);
  });

  // Populate the message to match the GET /api/messages shape
  const populatedMessage = await Message.findById(message._id)
    .populate("senderId", "fullName email")
    .populate("recipientId", "fullName email");

  // Socket.io: emit the message only to the recipient in real-time.
  // The sender already receives the message via the HTTP response, so we
  // do NOT emit back to the sender — doing so caused race-condition
  // duplicates that produced ghost "self" contacts in the conversation list.
  const recipientSocketId = getReceiverSocketId(recipientId);

  if (recipientSocketId) {
    getIo().to(recipientSocketId).emit("newMessage", populatedMessage);
  }

  res.status(201).json(populatedMessage);
});

// PATCH /api/messages/:id/read — recipient marks a message as read
export const markMessageRead = asyncHandler(async (req, res) => {
  const message = await Message.findOneAndUpdate(
    { _id: req.params.id, recipientId: req.user._id },
    { readAt: new Date() },
    { new: true }
  );
  if (!message) return res.status(404).json({ error: "Message not found" });
  res.json(message);
});
