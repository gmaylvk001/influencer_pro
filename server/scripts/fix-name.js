import mongoose from "mongoose";

async function run() {
  await mongoose.connect('mongodb://localhost:27017/influbrand');
  const Influencer = mongoose.model('Influencer', new mongoose.Schema({}, { strict: false }));
  
  const updated = await Influencer.findOneAndUpdate(
    { userId: new mongoose.Types.ObjectId('6a756e734064994f7ef77f20') },
    { 
      $set: { 
        name: 'Ragul P',
        avatarUrl: 'https://ui-avatars.com/api/?name=Ragul+P&background=random&size=200',
        city: 'Madurai'
      } 
    },
    { new: true }
  );
  console.log('Updated profile name:', updated.name, 'City:', updated.city);
  process.exit(0);
}

run();
