import { Platform } from "../models/Platform.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { cached, invalidate } from "../utils/catalogCache.js";

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// GET /api/platforms — public, used to populate the platform dropdown.
// Cached in-memory for a few minutes since this list rarely changes.
export const listPlatforms = asyncHandler(async (req, res) => {
  if (req.query.all === "true") {
    // Not cached — only used by the admin management screen, which needs
    // to see inactive/deactivated entries too so they can be reactivated.
    const docs = await Platform.find({}).sort({ name: 1 });
    return res.json(docs);
  }
  const docs = await cached("platforms:active", () =>
    Platform.find({ isActive: true }).sort({ name: 1 })
  );
  res.json(docs);
});

// POST /api/platforms — admin only
export const createPlatform = asyncHandler(async (req, res) => {
  const { name, icon } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });
  const doc = await Platform.create({ name, slug: slugify(name), icon: icon || null });
  invalidate("platforms:active");
  res.status(201).json(doc);
});

// PATCH /api/platforms/:id — admin only
export const updatePlatform = asyncHandler(async (req, res) => {
  const allowed = ["name", "icon", "isActive"];
  const updates = {};
  for (const key of allowed) {
    if (key in req.body) updates[key] = req.body[key];
  }
  if (updates.name) updates.slug = slugify(updates.name);

  const doc = await Platform.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!doc) return res.status(404).json({ error: "Platform not found" });
  invalidate("platforms:active");
  res.json(doc);
});

// DELETE /api/platforms/:id — admin only.
// Soft delete: Mongo has no foreign keys, so hard-deleting a platform that's
// still referenced by existing Influencer/Campaign documents would leave
// those with a dangling id. Deactivating keeps the id valid and just hides
// it from new selections.
export const deletePlatform = asyncHandler(async (req, res) => {
  const doc = await Platform.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!doc) return res.status(404).json({ error: "Platform not found" });
  invalidate("platforms:active");
  res.json({ ok: true, deactivated: doc });
});
