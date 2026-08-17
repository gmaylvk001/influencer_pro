import { Router } from "express";
import {
  sendOtp,
  signup,
  login,
  me,
  deleteMe,
  updateSettings,
  exportData,
  googleLogin
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { loginLimiter, otpLimiter } from "../middleware/rateLimit.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.post("/send-otp", otpLimiter, sendOtp);
router.post("/signup", upload.single("file"), signup);
router.post("/login", loginLimiter, login);
router.post("/google", loginLimiter, googleLogin);
router.get("/me", requireAuth, me);
router.delete("/me", requireAuth, deleteMe);
router.patch("/me/settings", requireAuth, updateSettings);
router.get("/me/export", requireAuth, exportData);

export default router;
