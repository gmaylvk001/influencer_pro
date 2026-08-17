import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { initSocket } from "./socket.js";

import authRoutes from "./routes/auth.routes.js";
import influencersRoutes from "./routes/influencers.routes.js";
import brandsRoutes from "./routes/brands.routes.js";
import campaignsRoutes from "./routes/campaigns.routes.js";
import shortlistsRoutes from "./routes/shortlists.routes.js";
import messagesRoutes from "./routes/messages.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import platformsRoutes from "./routes/platforms.routes.js";
import nichesRoutes from "./routes/niches.routes.js";
import locationsRoutes from "./routes/locations.routes.js";
import connectsRoutes from "./routes/connects.routes.js";
import transactionsRoutes from "./routes/transactions.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import participantsRoutes from "./routes/participants.routes.js";
import disputesRoutes from "./routes/disputes.routes.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

const PORT = process.env.PORT || 4000;

// ── MongoDB connection ──────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI env variable. Copy .env.example → .env and set it.");
  process.exit(1);
}

// ── Express app & HTTP Server ───────────────────────────────────
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

// ── Routes ──────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/influencers", influencersRoutes);
app.use("/api/brands", brandsRoutes);
app.use("/api/campaigns", campaignsRoutes);
app.use("/api/shortlists", shortlistsRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/platforms", platformsRoutes);
app.use("/api/niches", nichesRoutes);
app.use("/api/locations", locationsRoutes);
app.use("/api/connects", connectsRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/participants", participantsRoutes);
app.use("/api/disputes", disputesRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

// ── Start ───────────────────────────────────────────────────────
mongoose.set("strictQuery", true);
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log(`[db] connected to MongoDB (${mongoose.connection.name})`);
    server.listen(PORT, () => {
      console.log(`[server] Influbrand API & Socket.io listening on http://85.215.236.172:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("[server] failed to start:", err);
    process.exit(1);
  });
