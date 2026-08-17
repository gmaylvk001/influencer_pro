import mongoose from "mongoose";

// Mongo doesn't enforce foreign keys, so anything that stores a Platform/Niche
// _id needs to check the id is (a) a valid ObjectId and (b) actually exists
// and is active — otherwise a typo'd or stale id silently saves and shows up
// as a broken reference on the frontend.

export function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// Throws a 400 error (caught by the global error handler) if any id is
// missing, malformed, or doesn't exist in the given model.
export async function assertIdsExist(Model, ids, label) {
  if (!ids) return;
  const list = Array.isArray(ids) ? ids : [ids];
  if (list.length === 0) return;

  const invalid = list.filter((id) => !isValidObjectId(id));
  if (invalid.length > 0) {
    const err = new Error(`Invalid ${label} id(s): ${invalid.join(", ")}`);
    err.status = 400;
    throw err;
  }

  const found = await Model.find({ _id: { $in: list }, isActive: true }).select("_id");
  if (found.length !== list.length) {
    const foundIds = new Set(found.map((d) => d._id.toString()));
    const missing = list.filter((id) => !foundIds.has(id.toString()));
    const err = new Error(`Unknown or inactive ${label} id(s): ${missing.join(", ")}`);
    err.status = 400;
    throw err;
  }
}
