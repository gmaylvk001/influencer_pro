import mongoose from "mongoose";
import "dotenv/config";
import { Shortlist } from "./models/Shortlist.js";
import { CampaignParticipant } from "./models/CampaignParticipant.js";

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to DB.");

  const oldAccepted = await Shortlist.find({ response: "accepted" });
  console.log(`Found ${oldAccepted.length} accepted shortlists/offers.`);

  let migrated = 0;
  for (const doc of oldAccepted) {
    if (!doc.campaignId) {
      console.log("Skipping shortlist without campaignId:", doc._id);
      continue;
    }

    const existing = await CampaignParticipant.findOne({
      brandId: doc.brandId,
      influencerId: doc.influencerId,
      campaignId: doc.campaignId
    });

    if (!existing) {
      await CampaignParticipant.create({
        campaignId: doc.campaignId,
        brandId: doc.brandId,
        influencerId: doc.influencerId,
        status: "accepted", // maps to new state machine
        agreedAmount: 0 // Defaulting to 0 since old model didn't have amount
      });
      migrated++;
    }
  }

  console.log(`Migrated ${migrated} records into the new CampaignParticipant system.`);
  process.exit(0);
}

migrate();
