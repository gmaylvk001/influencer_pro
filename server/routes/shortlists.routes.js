import { Router } from "express";
import {
  createShortlist,
  listMyShortlists,
  respondToShortlist,
  unlockContact,
  submitTask,
  approveTask,
  rejectTask
} from "../controllers/shortlists.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);
router.get("/", listMyShortlists);
router.post("/", createShortlist);
router.patch("/:id", requireRole("influencer"), respondToShortlist);
router.patch("/:id/unlock", unlockContact);

router.post("/:id/submit", requireRole("influencer"), submitTask);
router.post("/:id/approve", requireRole("brand"), approveTask);
router.post("/:id/reject", requireRole("brand"), rejectTask);

export default router;
