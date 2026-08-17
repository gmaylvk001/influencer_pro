import "dotenv/config";
import mongoose from "mongoose";
import { google } from "googleapis";
import { Influencer } from "../models/Influencer.js";
import { Platform } from "../models/Platform.js";

async function scrapeYoutube() {
  const MONGODB_URI = process.env.MONGODB_URI;
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

  if (!MONGODB_URI) {
    console.error("Missing MONGODB_URI env variable.");
    process.exit(1);
  }

  if (!YOUTUBE_API_KEY) {
    console.error("Missing YOUTUBE_API_KEY env variable. Cannot scrape YouTube data.");
    console.log("To enable this feature, add a valid YouTube Data API v3 key to your .env file.");
    process.exit(0);
  }

  await mongoose.connect(MONGODB_URI);
  console.log(`[scrape] connected to MongoDB (${mongoose.connection.name})`);

  const youtubePlatform = await Platform.findOne({ name: "YouTube" });
  if (!youtubePlatform) {
    console.error("YouTube platform not found in database. Run 'npm run seed:influencers' first.");
    process.exit(1);
  }

  const youtube = google.youtube({
    version: "v3",
    auth: YOUTUBE_API_KEY,
  });

  // Find influencers that have YouTube as a platform
  const influencers = await Influencer.find({
    platforms: youtubePlatform._id,
  });

  console.log(`[scrape] found ${influencers.length} influencers with YouTube platform.`);

  let updatedCount = 0;
  for (const inf of influencers) {
    if (!inf.socialLinks || !inf.socialLinks.youtube) {
        console.log(`[scrape] skipping ${inf.name} - no youtube link provided`);
        continue;
    }
    
    // Extract handle or channel ID from URL
    // e.g., https://youtube.com/@CarryMinati
    const url = inf.socialLinks.youtube;
    const match = url.match(/@([^/]+)/);
    
    if (!match) {
       console.log(`[scrape] skipping ${inf.name} - could not extract handle from ${url}`);
       continue;
    }

    const handle = match[1];

    try {
      // Search for the channel by handle to get the channel ID
      const searchRes = await youtube.search.list({
        part: "snippet",
        q: handle,
        type: "channel",
        maxResults: 1,
      });

      if (!searchRes.data.items || searchRes.data.items.length === 0) {
        console.log(`[scrape] Could not find YouTube channel for ${handle}`);
        continue;
      }

      const channelId = searchRes.data.items[0].id.channelId;

      // Get channel statistics
      const channelRes = await youtube.channels.list({
        part: "statistics",
        id: channelId,
      });

      if (channelRes.data.items && channelRes.data.items.length > 0) {
        const stats = channelRes.data.items[0].statistics;
        const subscribers = parseInt(stats.subscriberCount) || 0;
        const totalViews = parseInt(stats.viewCount) || 0;
        const videoCount = parseInt(stats.videoCount) || 0;

        // Calculate a rough engagement rate: (total views / video count) / subscribers * 100
        let engagement = 0;
        if (subscribers > 0 && videoCount > 0) {
           const avgViewsPerVideo = totalViews / videoCount;
           engagement = (avgViewsPerVideo / subscribers) * 100;
           // Cap at 100% just in case
           engagement = Math.min(engagement, 100);
        }

        // Update the influencer if it's their primary platform or if they have more subs here
        if (inf.primaryPlatform === "YouTube" || subscribers > inf.followers) {
            inf.followers = subscribers;
            inf.posts = videoCount;
            // likes is tricky for channels, maybe we just use views / 100 as a proxy for the db
            inf.likes = Math.floor(totalViews / 100); 
            inf.engagement = parseFloat(engagement.toFixed(1));
        }
        
        inf.lastScrapedAt = new Date();
        inf.source = "youtube-api";
        await inf.save();
        updatedCount++;
        console.log(`[scrape] updated ${inf.name} (${subscribers} subs)`);
      }
    } catch (err) {
      console.error(`[scrape] Error processing ${inf.name}:`, err.message);
    }
  }

  console.log(`[scrape] successfully updated ${updatedCount} profiles.`);
  await mongoose.disconnect();
}

scrapeYoutube().catch((err) => {
  console.error(err);
  process.exit(1);
});
