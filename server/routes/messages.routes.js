import { Router } from "express";
import { listMyMessages, sendMessage, markMessageRead } from "../controllers/messages.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);
router.get("/", listMyMessages);
router.post("/", sendMessage);
router.patch("/:id/read", markMessageRead);

export default router;
