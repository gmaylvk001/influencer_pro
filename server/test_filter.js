import mongoose from 'mongoose';
mongoose.connect('mongodb://127.0.0.1:27017/influbrand').then(async () => {
  const docs = await mongoose.connection.db.collection('influencers').find({ isPublished: true, startingPrice: { $lte: 5000 } }).toArray();
  console.log('Count:', docs.length);
  const hasRagul = docs.some(d => d.name === 'Ragul P');
  console.log('Has Ragul:', hasRagul);
  process.exit(0);
});
