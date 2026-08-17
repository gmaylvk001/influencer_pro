import { Niche } from "../models/Niche.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { cached, invalidate } from "../utils/catalogCache.js";

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// GET /api/niches — public, used to populate niche/category checkboxes.
// Cached in-memory for a few minutes since this list rarely changes.
export const listNiches = asyncHandler(async (req, res) => {
  if (req.query.all === "true") {
    const docs = await Niche.find({}).sort({ name: 1 });
    return res.json(docs);
  }
  const docs = await cached("niches:active", () =>
    Niche.find({ isActive: true }).sort({ name: 1 })
  );
  res.json(docs);
});

// POST /api/niches — admin only
export const createNiche = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });
  const doc = await Niche.create({ name, slug: slugify(name) });
  invalidate("niches:active");
  res.status(201).json(doc);
});

// PATCH /api/niches/:id — admin only
export const updateNiche = asyncHandler(async (req, res) => {
  const allowed = ["name", "isActive"];
  const updates = {};
  for (const key of allowed) {
    if (key in req.body) updates[key] = req.body[key];
  }
  if (updates.name) updates.slug = slugify(updates.name);

  const doc = await Niche.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!doc) return res.status(404).json({ error: "Niche not found" });
  invalidate("niches:active");
  res.json(doc);
});

// DELETE /api/niches/:id — admin only.
// Soft delete, same reasoning as platforms.controller.js — never hard-delete
// a referenced id.
export const deleteNiche = asyncHandler(async (req, res) => {
  const doc = await Niche.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!doc) return res.status(404).json({ error: "Niche not found" });
  invalidate("niches:active");
  res.json({ ok: true, deactivated: doc });
});
