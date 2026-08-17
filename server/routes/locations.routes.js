import { Router } from "express";
import {
  listStates,
  listDistricts,
  addCustomDistrict,
  removeCustomDistrict,
} from "../controllers/locations.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/states", listStates);
router.get("/districts", listDistricts);
router.post("/districts", requireAuth, requireRole("admin"), addCustomDistrict);
router.delete("/districts/:id", requireAuth, requireRole("admin"), removeCustomDistrict);

export default router;
