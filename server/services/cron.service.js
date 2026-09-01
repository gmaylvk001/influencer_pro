import cron from "node-cron";
import axios from "axios";
import { InstagramAccount } from "../models/InstagramAccount.js";
import { InstagramMedia } from "../models/InstagramMedia.js";
import { instagramService } from "./instagram.service.js";

const GRAPH_API_VERSION = "v20.0";
const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;

class CronService {
  start() {
    // 1. Refresh tokens daily at midnight
    cron.schedule("0 0 * * *", async () => {
      console.log("[Cron] Starting daily token refresh job...");
      await this.refreshTokens();
      console.log("[Cron] Daily token refresh job completed.");
    });

    // 2. Sync Influencer Profiles every 1 minute (influencer page real data)
    cron.schedule("* * * * *", async () => {
      console.log("[Cron] Starting 1-minute influencer profile sync...");
      await this.syncAllProfiles();
      console.log("[Cron] Influencer profile sync completed.");
    });

    // 3. Sync Campaign Participant Metrics every 1 minute (campaign page real data)
    cron.schedule("* * * * *", async () => {
      console.log("[Cron] Starting 1-minute campaign media sync...");
      await this.syncCampaignMetrics();
      console.log("[Cron] Campaign media sync completed.");
    });
  }

  async refreshTokens() {
    try {
      const accounts = await InstagramAccount.find({});
      
      for (const account of accounts) {
        if (account.tokenExpiresAt) {
          const timeUntilExpiry = account.tokenExpiresAt.getTime() - Date.now();
          const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
          
          if (timeUntilExpiry < sevenDaysMs && timeUntilExpiry > 0) {
            console.log(`[Cron] Refreshing token for influencer ${account.influencerId}`);
            try {
              if (META_APP_ID && META_APP_ID !== "mock_app_id" && META_APP_SECRET) {
                const refreshRes = await axios.get(`https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token`, {
                  params: {
                    grant_type: 'fb_exchange_token',
                    client_id: META_APP_ID,
                    client_secret: META_APP_SECRET,
                    fb_exchange_token: account.accessToken
                  }
                });
                
                account.accessToken = refreshRes.data.access_token;
                const expiresIn = refreshRes.data.expires_in || (60 * 60 * 24 * 60);
                account.tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);
                await account.save();
              }
            } catch (err) {
              console.error(`[Cron] Failed to refresh token for influencer ${account.influencerId}:`, err.response?.data || err.message);
            }
          }
        }
      }
    } catch (err) {
      console.error("[Cron] Error during token refresh:", err);
    }
  }

  async syncAllProfiles() {
    try {
      const accounts = await InstagramAccount.find({});
      for (const account of accounts) {
        console.log(`[Cron] Syncing profile for influencer ${account.influencerId}`);
        await instagramService.syncInfluencerProfile(account);
      }
    } catch (err) {
      console.error("[Cron] Error during profile sync:", err);
    }
  }

  async syncCampaignMetrics() {
    try {
      const allMedia = await InstagramMedia.find({});
      for (const media of allMedia) {
        console.log(`[Cron] Syncing media metrics for media ${media._id}`);
        await instagramService.syncMediaMetrics(media._id);
      }
    } catch (err) {
      console.error("[Cron] Error during campaign metrics sync:", err);
    }
  }
}

export const cronService = new CronService();
