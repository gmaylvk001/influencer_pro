import express from "express";
import jwt from "jsonwebtoken";
import { instagramService } from "../services/instagram.service.js";
import { requireAuth } from "../middleware/auth.js";
import { InstagramMedia } from "../models/InstagramMedia.js";
import { Influencer } from "../models/Influencer.js";

const router = express.Router();

/**
 * GET /api/instagram/auth
 * Generates OAuth URL for influencer to connect their account.
 */
router.get("/auth", requireAuth, async (req, res) => {
  try {
    const influencer = await Influencer.findOne({ userId: req.user._id });
    if (!influencer) {
      return res.status(404).json({ error: "Influencer profile not found" });
    }
    
    const influencerId = influencer._id.toString();
    // Pass the influencerId as the state so we know who they are on callback
    const url = instagramService.getAuthUrl(influencerId);
    res.json({ url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/instagram/auth/signup
 * Generates OAuth URL for a new influencer signing up.
 */
router.get("/auth/signup", (req, res) => {
  try {
    const url = instagramService.getAuthUrl("signup");
    res.redirect(url);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/instagram/callback
 * Handle Meta OAuth callback (code and state)
 */
router.get("/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) {
      return res.status(400).json({ error: "Missing code or state" });
    }

    const frontendUrl = process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',')[0] : "http://localhost:5173";

    if (state === "signup") {
      const details = await instagramService.fetchInstagramDetails(code);
      
      const igToken = jwt.sign(details, process.env.JWT_SECRET, { expiresIn: "1h" });
      
      const params = new URLSearchParams({
        ig_token: igToken,
        handle: details.igUsername || "",
        followers: details.igFollowers || 0,
        avatarUrl: details.igProfilePic || ""
      });

      return res.redirect(`${frontendUrl}/signup/influencer?${params.toString()}`);
    }

    const influencerId = state;
    await instagramService.handleCallback(code, influencerId);

    // Redirect to frontend dashboard with success query param
    res.redirect(`${frontendUrl}/dashboard/profile?ig_connected=true`);
  } catch (error) {
    const errorDetails = error.response?.data || error.message;
    console.error("Instagram Callback Error:", errorDetails);
    res.status(500).send(`Authentication failed. Details: ${JSON.stringify(errorDetails)}`);
  }
});

import { CampaignParticipant } from "../models/CampaignParticipant.js";

/**
 * POST /api/instagram/sync-campaign
 * Manually trigger a sync for all media in a campaign.
 */
router.post("/sync-campaign/:campaignId", requireAuth, async (req, res) => {
  try {
    const mediaList = await InstagramMedia.find({ campaignId: req.params.campaignId });
    
    let syncedCount = 0;
    for (const media of mediaList) {
      const result = await instagramService.syncMediaMetrics(media._id);
      if (result) syncedCount++;
    }

    res.json({ message: "Sync complete", totalMedia: mediaList.length, syncedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
