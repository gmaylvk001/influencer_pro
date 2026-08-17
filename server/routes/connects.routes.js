import { Router } from "express";
import {
  listPackages,
  purchaseConnects,
  listPurchases,
  listWallet,
} from "../controllers/connects.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth, requireRole("brand"));
router.get("/packages", listPackages);
router.post("/purchase", purchaseConnects);
router.get("/purchases", listPurchases);
router.get("/wallet", listWallet);

export default router;
