import mongoose from 'mongoose';
import { Influencer } from './models/Influencer.js';
import { Platform } from './models/Platform.js';

mongoose.connect('mongodb://127.0.0.1:27017/influbrand').then(async () => {
  const instagram = await Platform.findOne({ slug: 'instagram' });
  if (!instagram) {
    console.log('No Instagram platform found!');
    process.exit(1);
  }

  const influencers = await Influencer.find({ platforms: { $size: 0 } });
  let count = 0;
  for (const inf of influencers) {
    inf.platforms.push(instagram._id);
    await inf.save();
    count++;
  }
  
  console.log('Updated influencers:', count);
  process.exit(0);
}).catch(console.error);
