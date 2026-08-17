import mongoose from 'mongoose';
import 'dotenv/config';
import { CampaignParticipant } from './models/CampaignParticipant.js';

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  const result = await CampaignParticipant.updateMany({ agreedAmount: 0 }, { $set: { agreedAmount: 5000 } });
  console.log('Fixed', result.modifiedCount, 'participants to have 5000 budget');
  process.exit(0);
}
fix();
