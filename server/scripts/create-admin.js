import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/User.js";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    const email = "admin@influbrand.com";
    const password = "adminpassword123";

    const existing = await User.findOne({ email });
    if (existing) {
      console.log("Admin user already exists. Email: admin@influbrand.com");
      process.exit(0);
    }

    const admin = new User({
      fullName: "System Admin",
      email: email,
      accountType: "admin"
    });
    
    await admin.setPassword(password);
    await admin.save();

    console.log("Admin user created successfully!");
    console.log("Email:", email);
    console.log("Password:", password);

  } catch (err) {
    console.error("Error creating admin:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createAdmin();
