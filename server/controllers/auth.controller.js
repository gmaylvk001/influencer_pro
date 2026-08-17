import { User } from "../models/User.js";
import { Brand } from "../models/Brand.js";
import { Influencer } from "../models/Influencer.js";
import { Platform } from "../models/Platform.js";
import { Niche } from "../models/Niche.js";
import { Otp } from "../models/Otp.js";
import { signToken } from "../utils/jwt.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { assertIdsExist } from "../utils/validateRefs.js";
import { sendOtpEmail } from "../utils/email.js";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// POST /api/auth/send-otp
export const sendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const existingUser = await User.findOne({ email });
  if (existingUser) return res.status(400).json({ error: "Email already in use" });

  // Generate 6-digit OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  await Otp.deleteMany({ email });
  await Otp.create({ email, otp: otpCode });

  console.log(`[OTP GENERATED] Email: ${email} | Code: ${otpCode}`);
  
  await sendOtpEmail(email, otpCode);
  
  res.json({ message: "OTP sent successfully" });
});

// POST /api/auth/signup
// Creates the User plus its matching Brand or Influencer profile row,
// mirroring what the old Supabase `ensureAccountRecords()` trigger-on-login did —
// except here it happens once, atomically, at signup time.
export const signup = asyncHandler(async (req, res) => {
  const { email, password, accountType, fullName, phone, state, district, city, adminSecret, otp } =
    req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }
  if (!["brand", "influencer", "admin"].includes(accountType)) {
    return res.status(400).json({ error: "accountType must be 'brand', 'influencer' or 'admin'" });
  }

  if (accountType === "admin") {
    if (!process.env.ADMIN_SIGNUP_SECRET || adminSecret !== process.env.ADMIN_SIGNUP_SECRET) {
      return res.status(403).json({ error: "Invalid admin invite code" });
    }
  } else {
    const validOtp = await Otp.findOne({ email, otp });
    if (!validOtp) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists" });
  }

  // Validate refs BEFORE creating the User — otherwise a bad platform/niche
  // id fails Influencer/Brand creation *after* the User is already saved,
  // leaving an orphaned User with no matching profile row.
  if (accountType === "influencer") {
    await assertIdsExist(Platform, req.body.platforms, "platform");
    await assertIdsExist(Niche, req.body.niches, "niche");
  } else if (accountType === "brand" && req.body.nicheId) {
    await assertIdsExist(Niche, req.body.nicheId, "niche");
  }

  const user = new User({
    email,
    fullName: fullName || "",
    phone: phone || null,
    city: city || null,
    accountType,
  });
  await user.setPassword(password);
  await user.save();

  try {
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (accountType === "brand") {
      const { companyName, website, nicheId } = req.body;
      const logoUrl = req.body.logoUrl || fileUrl;
      await Brand.create({
        userId: user._id,
        companyName: companyName || fullName || "My brand",
        website: website || null,
        nicheId: nicheId || null,
        contactName: fullName || null,
        state: state || null,
        district: district || null,
        city: city || null,
        logoUrl: logoUrl || null,
      });
    } else if (accountType === "influencer") {
      const { handle, gender, followers, startingPrice } = req.body;
      let { platforms, niches, languages, socialLinks } = req.body;
      
      // When formData is used, arrays might be comma-separated strings or single values
      if (typeof platforms === "string") platforms = platforms.split(",");
      if (typeof niches === "string") niches = niches.split(",");
      if (typeof languages === "string") languages = languages.split(",");
      
      let parsedSocials = {};
      if (socialLinks) {
        try {
          parsedSocials = JSON.parse(socialLinks);
        } catch (e) {}
      }

      const avatarUrl = req.body.avatarUrl || fileUrl;
      await Influencer.create({
        userId: user._id,
        name: fullName || "New creator",
        state: state || null,
        district: district || null,
        city: city || district || "Mumbai",
        gender: gender || null,
        platforms: Array.isArray(platforms) ? platforms : (platforms ? [platforms] : []),
        handle: handle || null,
        niches: Array.isArray(niches) ? niches : (niches ? [niches] : []),
        languages: Array.isArray(languages) ? languages : (languages ? [languages] : []),
        socialAssets: parsedSocials,
        avatarUrl: avatarUrl || null,
        followers: followers ? Number(followers) : 0,
        startingPrice: startingPrice ? Number(startingPrice) : null,
        isPublished: false,
      });
    }
    // accountType === "admin" needs no Brand/Influencer row — it just manages
    // the Platform/Niche catalog.
  } catch (err) {
    // Profile row failed after the User was already saved — roll the User
    // back so we don't leave a dangling account with no matching profile.
    await User.deleteOne({ _id: user._id });
    throw err;
  }

  const token = signToken(user);
  await Otp.deleteMany({ email });
  res.status(201).json({ token, user: user.toPublicJSON() });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !(await user.checkPassword(password))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  if (user.isSuspended) {
    return res.status(403).json({ error: "Your account has been suspended. Please contact support." });
  }

  const token = signToken(user);
  res.json({ token, user: user.toPublicJSON() });
});

// GET /api/auth/me
export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toPublicJSON() });
});

// DELETE /api/auth/me
export const deleteMe = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const accountType = req.user.accountType;

  if (accountType === "brand") {
    await Brand.findOneAndDelete({ userId });
  } else if (accountType === "influencer") {
    await Influencer.findOneAndDelete({ userId });
  }

  await User.findByIdAndDelete(userId);
  res.json({ success: true, message: "Account completely deleted" });
});

// PATCH /api/auth/me/settings
export const updateSettings = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, notificationPreferences } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) return res.status(404).json({ error: "User not found" });

  if (currentPassword && newPassword) {
    const isMatch = await user.checkPassword(currentPassword);
    if (!isMatch) return res.status(400).json({ error: "Incorrect current password" });
    if (newPassword.length < 6) return res.status(400).json({ error: "New password must be at least 6 characters" });
    
    await user.setPassword(newPassword);
  }

  if (notificationPreferences) {
    user.notificationPreferences = {
      ...user.notificationPreferences,
      ...notificationPreferences
    };
  }

  await user.save();
  res.json({ message: "Settings updated successfully", user: user.toPublicJSON() });
});

// GET /api/auth/me/export
export const exportData = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ error: "User not found" });

  let profile = null;
  if (user.accountType === "influencer") {
    profile = await Influencer.findOne({ userId: user._id })
      .populate("niches platforms");
  } else if (user.accountType === "brand") {
    profile = await Brand.findOne({ userId: user._id })
      .populate("nicheId");
  }

  const exportData = {
    account: user.toPublicJSON(),
    profile,
    exportDate: new Date().toISOString()
  };

  res.setHeader("Content-Disposition", 'attachment; filename="my_data_export.json"');
  res.setHeader("Content-Type", "application/json");
  res.status(200).send(JSON.stringify(exportData, null, 2));
});

// POST /api/auth/google
export const googleLogin = asyncHandler(async (req, res) => {
  const { credential, accountType } = req.body;
  if (!credential) return res.status(400).json({ error: "Google credential is required" });

  try {
    // Fetch user info using the access_token
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${credential}` }
    });
    
    if (!userInfoRes.ok) {
      throw new Error("Failed to fetch user info from Google");
    }
    
    const payload = await userInfoRes.json();
    const email = payload.email.toLowerCase();
    
    let user = await User.findOne({ email });
    
    if (!user) {
      // First time logging in with Google
      if (!accountType || !["brand", "influencer"].includes(accountType)) {
        return res.status(400).json({ error: "accountType (brand or influencer) is required for new accounts" });
      }

      user = new User({
        email,
        fullName: payload.name || "",
        accountType,
      });
      // We don't set a password for Google-auth users. We can set a random one or leave it un-checkable.
      await user.setPassword(Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10));
      await user.save();

      // Create corresponding profile
      if (accountType === "brand") {
        await Brand.create({
          userId: user._id,
          companyName: payload.name || "My brand",
          logoUrl: payload.picture || null,
        });
      } else if (accountType === "influencer") {
        await Influencer.create({
          userId: user._id,
          name: payload.name || "Creator",
          avatarUrl: payload.picture || null,
        });
      }
    }

    const token = signToken(user);
    res.json({ token, user: user.toPublicJSON() });
  } catch (error) {
    console.error("Google verify error:", error);
    res.status(401).json({ error: "Invalid Google credential" });
  }
});