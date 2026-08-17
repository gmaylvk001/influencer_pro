import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getMyTransactions, withdrawFunds } from "../controllers/transactions.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/me", getMyTransactions);
router.post("/withdraw", withdrawFunds);

export default router;
