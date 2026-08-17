import { Router } from "express";
import {
  listInfluencers,
  getInfluencer,
  getMyInfluencerProfile,
  updateMyInfluencerProfile,
  listInfluencersAdmin,
  verifyInfluencerAdmin
} from "../controllers/influencers.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/admin/list", requireAuth, requireRole("admin"), listInfluencersAdmin);
router.patch("/admin/:id/verify", requireAuth, requireRole("admin"), verifyInfluencerAdmin);

router.get("/", listInfluencers);
router.get("/me", requireAuth, requireRole("influencer"), getMyInfluencerProfile);
router.patch("/me", requireAuth, requireRole("influencer"), updateMyInfluencerProfile);
router.get("/:id", getInfluencer);

export default router;
