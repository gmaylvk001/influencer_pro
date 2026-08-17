import { Router } from "express";
import { getMyBrand, updateMyBrand } from "../controllers/brands.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/me", requireAuth, requireRole("brand"), getMyBrand);
router.patch("/me", requireAuth, requireRole("brand"), updateMyBrand);

export default router;
