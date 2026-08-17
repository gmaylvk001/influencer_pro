import { Router } from "express";
import {
  listPlatforms,
  createPlatform,
  updatePlatform,
  deletePlatform,
} from "../controllers/platforms.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", listPlatforms);
router.post("/", requireAuth, requireRole("admin"), createPlatform);
router.patch("/:id", requireAuth, requireRole("admin"), updatePlatform);
router.delete("/:id", requireAuth, requireRole("admin"), deletePlatform);

export default router;
