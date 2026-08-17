import { getStates, getDistricts } from "india-location-kit";
import { CustomLocation } from "../models/CustomLocation.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// GET /api/locations/states — all Indian states & UTs (from india-location-kit)
export const listStates = asyncHandler(async (req, res) => {
  res.json(getStates());
});

// GET /api/locations/districts?state=TN
// Districts come from the india-location-kit function for that state code,
// PLUS any districts an admin has added manually (new districts formed after
// the package's dataset was published, name variants, etc.) — nothing here
// is a hardcoded array, both sources are queried at request time.
export const listDistricts = asyncHandler(async (req, res) => {
  const stateCode = (req.query.state || "").toUpperCase();
  if (!stateCode) {
    return res.status(400).json({ error: "state query param is required, e.g. ?state=TN" });
  }

  const packageDistricts = getDistricts(stateCode).map((d) => ({
    name: d.name,
    code: d.code,
    source: "package",
  }));

  const customDistricts = await CustomLocation.find({ stateCode }).sort({ name: 1 });
  const extra = customDistricts.map((d) => ({ name: d.name, code: null, source: "custom" }));

  // De-dupe by lower-cased name in case an admin re-adds one the package
  // later ships with an update.
  const seen = new Set();
  const merged = [];
  for (const d of [...packageDistricts, ...extra]) {
    const key = d.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(d);
  }
  merged.sort((a, b) => a.name.localeCompare(b.name));

  res.json(merged);
});

// POST /api/locations/districts — admin only, adds a district missing from
// the offline dataset (e.g. a newly carved-out district) without a deploy.
export const addCustomDistrict = asyncHandler(async (req, res) => {
  const { stateCode, stateName, name } = req.body;
  if (!stateCode || !stateName || !name) {
    return res.status(400).json({ error: "stateCode, stateName and name are required" });
  }
  const doc = await CustomLocation.create({
    stateCode: stateCode.toUpperCase(),
    stateName,
    name,
  });
  res.status(201).json(doc);
});

// DELETE /api/locations/districts/:id — admin only
export const removeCustomDistrict = asyncHandler(async (req, res) => {
  const doc = await CustomLocation.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ error: "Custom district not found" });
  res.json({ ok: true });
});
