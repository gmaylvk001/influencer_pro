import { Router } from "express";
import {
  listNiches,
  createNiche,
  updateNiche,
  deleteNiche,
} from "../controllers/niches.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", listNiches);
router.post("/", requireAuth, requireRole("admin"), createNiche);
router.patch("/:id", requireAuth, requireRole("admin"), updateNiche);
router.delete("/:id", requireAuth, requireRole("admin"), deleteNiche);

export default router;
