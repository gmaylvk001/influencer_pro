import mongoose from "mongoose";

await mongoose.connect("mongodb://127.0.0.1:27017/influbrand");

// Fix the campaign whose participant is already "campaign_completed"
const result = await mongoose.connection.db.collection("campaigns").updateOne(
  { _id: new mongoose.Types.ObjectId("6a79bd5666030fba24eb10ea") },
  { $set: { status: "completed" } }
);
console.log("Updated rfewcx Promotion to completed:", result.modifiedCount);

// Verify
const campaigns = await mongoose.connection.db.collection("campaigns")
  .find({}, { projection: { title: 1, status: 1 } }).toArray();
console.log("All campaigns now:", JSON.stringify(campaigns, null, 2));

process.exit(0);
