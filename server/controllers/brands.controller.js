import { Brand } from "../models/Brand.js";
import { Niche } from "../models/Niche.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { assertIdsExist } from "../utils/validateRefs.js";

const POPULATE = [{ path: "nicheId", select: "name slug" }];

// Consistent response shape across controllers — strips Mongoose internals
// (__v, etc.) instead of leaking them straight to the client.
function toClientShape(doc) {
  return {
    id: doc._id.toString(),
    companyName: doc.companyName,
    website: doc.website,
    nicheId: doc.nicheId, // populated Niche doc ({ id, name, slug }) or null
    contactName: doc.contactName,
    state: doc.state,
    district: doc.district,
    city: doc.city,
    about: doc.about,
    logoUrl: doc.logoUrl,
    connectBalance: doc.connectBalance,
  };
}

// GET /api/brands/me
export const getMyBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findOne({ userId: req.user._id }).populate(POPULATE);
  if (!brand) return res.status(404).json({ error: "No brand profile for this account" });
  res.json(toClientShape(brand));
});

// PATCH /api/brands/me
export const updateMyBrand = asyncHandler(async (req, res) => {
  const allowed = [
    "companyName",
    "website",
    "nicheId",
    "contactName",
    "state",
    "district",
    "city",
    "about",
    "logoUrl",
  ];
  const updates = {};
  for (const key of allowed) {
    if (key in req.body) updates[key] = req.body[key];
  }

  await assertIdsExist(Niche, updates.nicheId, "niche");

  const brand = await Brand.findOneAndUpdate({ userId: req.user._id }, updates, {
    new: true,
    runValidators: true,
  }).populate(POPULATE);
  if (!brand) return res.status(404).json({ error: "No brand profile for this account" });
  res.json(toClientShape(brand));
});
