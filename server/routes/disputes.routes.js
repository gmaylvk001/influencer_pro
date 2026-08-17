import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { createDispute, listMyDisputes } from "../controllers/disputes.controller.js";

const router = express.Router();

router.use(requireAuth);

router.post("/", createDispute);
router.get("/", listMyDisputes);

export default router;
