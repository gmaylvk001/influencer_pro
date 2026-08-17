import mongoose from "mongoose";

async function run() {
  await mongoose.connect('mongodb://localhost:27017/influbrand');
  const Influencer = mongoose.model('Influencer', new mongoose.Schema({}, { strict: false }));
  
  // Link the orphaned user ID to the first seeded profile
  const updated = await Influencer.findOneAndUpdate(
    { name: 'Sakshi Sindwani' },
    { $set: { userId: new mongoose.Types.ObjectId('6a756e734064994f7ef77f20') } },
    { new: true }
  );
  console.log('Fixed profile:', updated.name, updated.userId);
  process.exit(0);
}

run();
