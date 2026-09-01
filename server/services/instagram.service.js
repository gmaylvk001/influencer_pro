import axios from "axios";
import { InstagramAccount } from "../models/InstagramAccount.js";
import { InstagramMedia } from "../models/InstagramMedia.js";
import { MetricSnapshot } from "../models/MetricSnapshot.js";
import { CampaignParticipant } from "../models/CampaignParticipant.js";
import { Influencer } from "../models/Influencer.js";
import { analyticsService } from "./analytics.service.js";

// Ensure you have these in .env
const META_APP_ID = process.env.META_APP_ID || "mock_app_id";
const META_APP_SECRET = process.env.META_APP_SECRET || "mock_app_secret";
const META_REDIRECT_URI = process.env.META_REDIRECT_URI || "http://localhost:4000/api/instagram/callback";
const GRAPH_API_VERSION = "v20.0";

class InstagramService {
  /**
   * Generates the OAuth URL for the influencer to connect their Instagram account.
   */
  getAuthUrl(state) {
    // If we have a real app ID, use Facebook OAuth
    if (META_APP_ID && META_APP_ID !== "mock_app_id") {
      return `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth?client_id=${META_APP_ID}&display=page&redirect_uri=${META_REDIRECT_URI}&response_type=code&scope=instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement,business_management&state=${state}`;
    }
    // MOCK MODE: Bypass Facebook completely and just bounce straight back to our local callback with a fake code
    return `${META_REDIRECT_URI}?code=mock_oauth_code_12345&state=${state}`;
  }

  /**
   * Fetches Instagram details from an OAuth code without saving to the DB.
   */
  async fetchInstagramDetails(code) {
    if (META_APP_ID === "mock_app_id" || !META_APP_SECRET) {
      throw new Error("Missing real META_APP_ID or META_APP_SECRET in environment variables.");
    }

    // 1. Exchange code for short-lived access token
    const tokenRes = await axios.get(`https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token`, {
      params: {
        client_id: META_APP_ID,
        redirect_uri: META_REDIRECT_URI,
        client_secret: META_APP_SECRET,
        code: code
      }
    });
    const shortLivedToken = tokenRes.data.access_token;

    // 2. Exchange short-lived token for long-lived token
    const llRes = await axios.get(`https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token`, {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: META_APP_ID,
        client_secret: META_APP_SECRET,
        fb_exchange_token: shortLivedToken
      }
    });
    const longLivedToken = llRes.data.access_token;
    const expiresIn = llRes.data.expires_in || (60 * 60 * 24 * 60); // Default to 60 days
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // 3. Fetch user's Facebook Pages
    const pagesRes = await axios.get(`https://graph.facebook.com/${GRAPH_API_VERSION}/me/accounts`, {
      params: { access_token: longLivedToken }
    });
    const pages = pagesRes.data.data;

    if (!pages || pages.length === 0) {
      throw new Error("No Facebook Pages found for this user.");
    }

    // 4. Find a page with an Instagram Business account attached
    let igAccountId = null;
    let connectedPageId = null;
    let igUsername = null;
    let igProfilePic = null;
    let igFollowers = 0;

    let debugPages = [];

    for (const page of pages) {
      try {
        const pageDetails = await axios.get(`https://graph.facebook.com/${GRAPH_API_VERSION}/${page.id}`, {
          params: {
            fields: 'instagram_business_account',
            access_token: page.access_token || longLivedToken
          }
        });
        
        debugPages.push({ pageId: page.id, data: pageDetails.data });

        if (pageDetails.data.instagram_business_account) {
          igAccountId = pageDetails.data.instagram_business_account.id;
          connectedPageId = page.id;
          
          // Fetch username and profile pic of the IG account
          const igDetails = await axios.get(`https://graph.facebook.com/${GRAPH_API_VERSION}/${igAccountId}`, {
            params: {
              fields: 'username,profile_picture_url,followers_count,media_count',
              access_token: longLivedToken
            }
          });
          igUsername = igDetails.data.username;
          igProfilePic = igDetails.data.profile_picture_url;
          igFollowers = igDetails.data.followers_count;

          break; 
        }
      } catch (err) {
        console.error(`Error checking page ${page.id}:`, err.response?.data || err.message);
        debugPages.push({ pageId: page.id, error: err.response?.data || err.message });
      }
    }

    if (!igAccountId) {
      throw new Error(JSON.stringify({
        message: "No connected Instagram Professional account found on any Facebook Pages.",
        pagesScanned: debugPages
      }));
    }

    return {
      igAccountId,
      connectedPageId,
      igUsername,
      igProfilePic,
      igFollowers,
      longLivedToken,
      expiresAt
    };
  }

  /**
   * Mock method for handling the OAuth callback for an existing user.
   */
  async handleCallback(code, influencerId) {
    try {
      const details = await this.fetchInstagramDetails(code);

      // 5. Create or update the InstagramAccount
      const account = await InstagramAccount.findOneAndUpdate(
        { influencerId },
        {
          instagramUserId: details.igAccountId,
          accessToken: details.longLivedToken,
          tokenExpiresAt: details.expiresAt,
          pageId: details.connectedPageId,
          username: details.igUsername || "instagram_user",
          profilePictureUrl: details.igProfilePic || ""
        },
        { new: true, upsert: true }
      );

      // 6. Sync profile data now that we have the account
      await this.syncInfluencerProfile(account);

      return account;
    } catch (error) {
      console.error("Error handling Instagram callback:", error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Syncs the core profile stats (followers, posts, avg engagement) for an influencer.
   */
  async syncInfluencerProfile(account) {
    try {
      const igDetails = await axios.get(`https://graph.facebook.com/${GRAPH_API_VERSION}/${account.instagramUserId}`, {
        params: {
          fields: 'followers_count,follows_count,media_count,profile_picture_url',
          access_token: account.accessToken
        }
      });
      
      const igFollowers = igDetails.data.followers_count;
      const igFollowing = igDetails.data.follows_count;
      const igPosts = igDetails.data.media_count || 0;
      const igProfilePic = igDetails.data.profile_picture_url;

      let avgLikes = 0;
      let avgComments = 0;
      let topHashtags = [];
      let topMentions = [];

      let mediaRes;
      try {
        mediaRes = await axios.get(`https://graph.facebook.com/${GRAPH_API_VERSION}/${account.instagramUserId}/media`, {
          params: {
            fields: 'caption,like_count,comments_count,timestamp',
            limit: 30,
            access_token: account.accessToken
          }
        });

        if (mediaRes.data.data && mediaRes.data.data.length > 0) {
          let totalLikes = 0;
          let totalComments = 0;
          const hashtagCounts = {};
          const mentionCounts = {};

          mediaRes.data.data.forEach(post => {
            totalLikes += post.like_count || 0;
            totalComments += post.comments_count || 0;
            
            if (post.caption) {
              const tags = post.caption.match(/#[a-zA-Z0-9_]+/g) || [];
              tags.forEach(t => hashtagCounts[t] = (hashtagCounts[t] || 0) + 1);
              
              const m = post.caption.match(/@[a-zA-Z0-9_.]+/g) || [];
              m.forEach(t => mentionCounts[t] = (mentionCounts[t] || 0) + 1);
            }
          });

          avgLikes = Math.floor(totalLikes / mediaRes.data.data.length);
          avgComments = Math.floor(totalComments / mediaRes.data.data.length);
          
          topHashtags = Object.entries(hashtagCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(x => x[0]);
          topMentions = Object.entries(mentionCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(x => x[0]);
        }
      } catch (err) {
        console.error("Error fetching recent media for profile sync:", err.response?.data || err.message);
      }

      const recentDailyStats = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateString = d.toISOString().split('T')[0];
        recentDailyStats.push({ date: dateString, likes: 0, comments: 0, posts: 0 });
      }

      if (mediaRes && mediaRes.data && mediaRes.data.data) {
        mediaRes.data.data.forEach(post => {
          if (post.timestamp) {
            const postDate = post.timestamp.split('T')[0];
            const dayStat = recentDailyStats.find(s => s.date === postDate);
            if (dayStat) {
              dayStat.posts += 1;
              dayStat.likes += post.like_count || 0;
              dayStat.comments += post.comments_count || 0;
            }
          }
        });
      }

      const updateData = {};
      if (igProfilePic) updateData.avatarUrl = igProfilePic;
      if (igFollowers !== undefined) updateData.followers = igFollowers;
      if (igFollowing !== undefined) updateData.following = igFollowing;
      if (igPosts !== undefined) updateData.posts = igPosts;
      if (avgLikes > 0) updateData.likes = avgLikes;
      if (avgComments > 0) updateData.avgComments = avgComments;
      if (topHashtags.length > 0) updateData.hashtags = topHashtags;
      if (topMentions.length > 0) updateData.mentions = topMentions;
      if (recentDailyStats.length > 0) updateData.dailyStats = recentDailyStats;
      
      if (account.username && account.username !== "instagram_user") {
        updateData.handle = `@${account.username}`;
      }

      if (igFollowers > 0 && (avgLikes > 0 || avgComments > 0)) {
        updateData.engagement = Number((((avgLikes + avgComments) / igFollowers) * 100).toFixed(1));
      } else if (igFollowers !== undefined) {
        updateData.engagement = 0;
      }

      if (Object.keys(updateData).length > 0) {
        await Influencer.findByIdAndUpdate(account.influencerId, updateData);
      }
    } catch (err) {
      console.error("Error in syncInfluencerProfile:", err.message);
    }
  }

  /**
   * Sync metrics for a specific media item.
   */
  async syncMediaMetrics(mediaId) {
    try {
      const media = await InstagramMedia.findById(mediaId).populate("influencerId");
      if (!media) return null;

      const account = await InstagramAccount.findOne({ influencerId: media.influencerId._id });
      if (!account) return null;

      if (META_APP_ID === "mock_app_id") {
        console.warn("Using mock metrics since real META_APP_ID is not configured");
        // ... (mock fallback logic if needed, but we assume real keys)
      }

      // 1. Fetch basic media fields (likes, comments, media_type)
      const mediaRes = await axios.get(`https://graph.facebook.com/${GRAPH_API_VERSION}/${media.mediaId}`, {
        params: {
          fields: 'media_type,like_count,comments_count',
          access_token: account.accessToken
        }
      });
      const mediaType = mediaRes.data.media_type;
      const likes = mediaRes.data.like_count || 0;
      const comments = mediaRes.data.comments_count || 0;

      // Update media type if not set
      if (!media.mediaType) {
        media.mediaType = mediaType;
      }

      // 2. Fetch insights
      let metrics = "";
      if (mediaType === "VIDEO" || mediaType === "REELS") {
        metrics = "views,reach,saved,shares";
      } else {
        metrics = "impressions,reach,saved";
      }

      let views = 0, reach = 0, saves = 0, shares = 0;
      
      try {
        const insightsRes = await axios.get(`https://graph.facebook.com/${GRAPH_API_VERSION}/${media.mediaId}/insights`, {
          params: {
            metric: metrics,
            access_token: account.accessToken
          }
        });
        
        const data = insightsRes.data.data;
        data.forEach(item => {
          if (item.name === 'views' || item.name === 'impressions') views = item.values[0].value;
          if (item.name === 'reach') reach = item.values[0].value;
          if (item.name === 'saved') saves = item.values[0].value;
          if (item.name === 'shares') shares = item.values[0].value;
        });
      } catch (err) {
        console.error(`Error fetching insights for media ${media.mediaId}:`, err.response?.data || err.message);
        // Fallback to basic likes/comments if insights fail (e.g. for some older posts or permission issues)
        views = likes + comments; // rough fallback
      }

      const snapshot = new MetricSnapshot({
        mediaId: media._id,
        views: views,
        likes: likes,
        comments: comments,
        reach: reach,
        shares: shares,
        saves: saves,
        engagementRate: reach > 0 ? ((likes + comments + shares + saves) / reach) : 0
      });

      await snapshot.save();

      // Update media lastSyncAt
      media.lastSyncAt = new Date();
      await media.save();

      // Update participant metrics
      await this.updateParticipantMetrics(media.campaignId, media.influencerId._id, snapshot);

      return snapshot;
    } catch (error) {
      console.error("Error syncing media metrics:", error.response?.data || error.message);
    }
  }

  /**
   * Updates the campaign participant's embedded metrics object.
   */
  async updateParticipantMetrics(campaignId, influencerId, latestSnapshot) {
    try {
      await CampaignParticipant.findOneAndUpdate(
        { campaignId, influencerId },
        {
          "performanceMetrics.views": latestSnapshot.views,
          "performanceMetrics.reach": latestSnapshot.reach,
          "performanceMetrics.engagement": latestSnapshot.likes + latestSnapshot.comments + latestSnapshot.shares + latestSnapshot.saves,
          "performanceMetrics.engagementRate": latestSnapshot.engagementRate,
          "performanceMetrics.lastUpdated": new Date()
        }
      );
      
      // After updating a participant, optionally trigger a full analytics recalculation for this influencer
      await analyticsService.recalculateInfluencerScore(influencerId);
      
    } catch (error) {
      console.error("Error updating participant metrics:", error);
    }
  }
}

export const instagramService = new InstagramService();
