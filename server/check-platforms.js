import mongoose from 'mongoose';
import { Influencer } from './models/Influencer.js';

mongoose.connect('mongodb://127.0.0.1:27017/influbrand').then(async () => {
  const influencers = await Influencer.find({ platforms: { $size: 0 } });
  console.log('Remaining without platforms:', influencers.length);
  process.exit(0);
});
