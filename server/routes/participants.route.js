import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  inviteParticipant,
  acceptInvite,
  submitDraft,
  reviewDraft,
  getParticipantDetails
} from "../controllers/participants.controller.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

router.post("/invite", inviteParticipant);
router.post("/:participantId/accept", acceptInvite);
router.post("/:participantId/submit-draft", submitDraft);
router.post("/:participantId/review", reviewDraft);
router.get("/:participantId", getParticipantDetails);

export default router;
