import { Influencer } from "../models/Influencer.js";
import { CampaignParticipant } from "../models/CampaignParticipant.js";

class AnalyticsService {
  /**
   * Recalculates the influencer's overall performance score based on past campaigns.
   */
  async recalculateInfluencerScore(influencerId) {
    try {
      // Find all campaigns this influencer has participated in
      const participations = await CampaignParticipant.find({ influencerId });
      
      if (!participations || participations.length === 0) {
        return;
      }

      let totalReach = 0;
      let totalEngagement = 0;
      let campaignsWithData = 0;

      participations.forEach(p => {
        if (p.performanceMetrics && p.performanceMetrics.views > 0) {
          totalReach += p.performanceMetrics.reach || 0;
          totalEngagement += p.performanceMetrics.engagement || 0;
          campaignsWithData++;
        }
      });

      if (campaignsWithData === 0) return;

      const avgReach = totalReach / campaignsWithData;
      const avgEngagement = totalEngagement / campaignsWithData;
      const avgEngagementRate = totalReach > 0 ? (totalEngagement / totalReach) : 0;

      // Arbitrary scoring formula (can be adjusted by admin)
      // 30% Reach, 30% Engagement Rate, 20% Consistency (Campaign Count), 20% Base
      let score = 20; // Base
      
      // Reach factor (cap at 30 points)
      score += Math.min(30, (avgReach / 100000) * 10);
      
      // Engagement factor (cap at 30 points, expecting ~10% for full points)
      score += Math.min(30, (avgEngagementRate / 0.1) * 30);
      
      // Consistency (cap at 20 points, expecting 5 campaigns for full points)
      score += Math.min(20, (campaignsWithData / 5) * 20);

      score = Math.round(score);

      // Determine classification
      let classification = "Unclassified";
      let recommendedModel = "Unclassified";

      if (score >= 80) {
        classification = "Top Performer";
        recommendedModel = "Annual Contract Candidate";
      } else if (score >= 60) {
        classification = "High Performer";
        recommendedModel = "Per-Video Candidate";
      } else if (score >= 40) {
        classification = "Average Performer";
        recommendedModel = "Per-Video Candidate";
      } else {
        classification = "Low Performer";
        recommendedModel = "Trial Candidate";
      }

      // Update influencer
      await Influencer.findByIdAndUpdate(influencerId, {
        performanceScore: score,
        classification,
        recommendedModel
      });

      console.log(`Updated Influencer ${influencerId} Score: ${score}, Class: ${classification}`);
    } catch (error) {
      console.error("Error recalculating influencer score:", error);
    }
  }
}

export const analyticsService = new AnalyticsService();
