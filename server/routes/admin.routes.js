import express from "express";
import { 
  getStats, 
  getUsers, 
  toggleUserSuspension, 
  getUserDetails, 
  editUser, 
  deleteUser, 
  impersonateUser, 
  getHistoricalStats,
  getCampaigns,
  updateCampaignStatus,
  getTransactions,
  getActivity,
  getWithdrawals,
  updateWithdrawalStatus,
  getDisputes,
  updateDisputeStatus
} from "../controllers/admin.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// All admin routes require authentication and admin privileges
router.use(requireAuth);
router.use((req, res, next) => {
  if (req.user.accountType !== "admin") {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }
  next();
});

router.get("/stats", getStats);
router.get("/stats/historical", getHistoricalStats);
router.get("/activity", getActivity);

router.get("/users", getUsers);
router.get("/users/:id/details", getUserDetails);
router.patch("/users/:id", editUser);
router.delete("/users/:id", deleteUser);
router.patch("/users/:id/suspend", toggleUserSuspension);
router.post("/users/:id/impersonate", impersonateUser);

router.get("/campaigns", getCampaigns);
router.patch("/campaigns/:id/status", updateCampaignStatus);

router.get("/withdrawals", getWithdrawals);
router.patch("/withdrawals/:id/status", updateWithdrawalStatus);

router.get("/disputes", getDisputes);
router.patch("/disputes/:id/status", updateDisputeStatus);

router.get("/transactions", getTransactions);

export default router;
