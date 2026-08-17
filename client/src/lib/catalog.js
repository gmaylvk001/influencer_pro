// Platforms, niches (categories) and locations used to be hardcoded here.
// They now live in the database — see hooks/useCatalog.js (platforms +
// niches) and hooks/useDistricts.js (states + districts, via
// india-location-kit on the server) so they can grow without a code change.

// The backend doesn't store a rating field yet, so derive a display-only
// rating (3.5–5.0) from engagement rate — deterministic per influencer id.
export function derivedRating(influencer) {
  const base = 3.5 + Math.min(1.5, (influencer.engagement || 0) / 10);
  return Math.round(base * 10) / 10;
}

export function calculateInfluBrandScore(profileData) {
  if (!profileData) return 0;
  const followers = profileData.followers || 0;
  const posts = profileData.posts || 0;
  const following = Math.floor(followers * 0.05); 
  const bioWords = (profileData.bio || "").split(/\s+/).filter(Boolean).length;
  
  const niches = profileData.niches || [];
  const multiCategory = niches.length > 1;
  const hasInsta = !!profileData.socialAssets?.Instagram?.url || !!profileData.handle;

  const scoreLive = hasInsta ? 1 : 0;
  const scoreFollowers = followers > 100000 ? 8 : followers > 50000 ? 6 : followers > 10000 ? 4 : followers > 1000 ? 2 : 0;
  const scorePosts = posts > 1000 ? 3 : posts > 500 ? 2 : posts > 100 ? 1 : 0;
  const scoreFollowing = following > 100 ? 2 : following > 10 ? 1 : 0;
  const scoreDesc = bioWords > 10 ? 1 : 0;
  const scoreMulti = multiCategory ? 1 : 0;
  const scoreCategory = niches.length > 0 ? 3 : 0;

  return scoreLive + scoreFollowers + scorePosts + scoreFollowing + scoreDesc + scoreMulti + scoreCategory;
}

export function formatCount(value) {
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return `${value}`;
}

export function formatRupees(value) {
  if (value == null) return "On request";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
