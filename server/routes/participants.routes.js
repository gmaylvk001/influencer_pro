import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  inviteParticipant,
  acceptInvite,
  submitDraft,
  reviewDraft,
  getParticipantDetails,
  getMyParticipants,
  submitLiveUrl,
  approveCompletion
} from "../controllers/participants.controller.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(requireAuth);

router.get("/", getMyParticipants);
router.post("/invite", inviteParticipant);
router.post("/:participantId/accept", acceptInvite);
router.post("/:participantId/submit-draft", submitDraft);
router.post("/:participantId/review", reviewDraft);
router.post("/:participantId/submit-live-url", submitLiveUrl);
router.post("/:participantId/approve-completion", approveCompletion);
router.get("/:participantId", getParticipantDetails);

export default router;
