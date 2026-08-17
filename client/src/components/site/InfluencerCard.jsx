import { BadgeCheck, Heart, Instagram, Send, Star, Youtube, Music2, Facebook, Twitter, Linkedin, Globe } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { formatCount, formatRupees, initials, derivedRating } from "@/lib/catalog";

const PLATFORM_ICON = {
  youtube: Youtube,
  tiktok: Music2,
  instagram: Instagram,
  facebook: Facebook,
  "x-twitter": Twitter,
  linkedin: Linkedin,
};

function Stat({ label, value }) {
  return (
    <div>
      <p className="font-display text-sm font-semibold">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

export function InfluencerCard({ influencer, onShortlist, onOffer, actionLabel, busy, isShortlisted, isOffered, isDashboard = false }) {
  const platform = influencer.platforms && influencer.platforms.length > 0 ? influencer.platforms[0] : null; // Use first platform from array
  const PlatformIcon = PLATFORM_ICON[platform?.slug] || Globe;
  const rating = derivedRating(influencer);
  const basePath = isDashboard ? "/dashboard/influencers" : "/influencers";

  return (
    <article className="surface-panel flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-premium)]">
      <div className="relative flex h-40 items-center justify-center" style={{ background: "var(--gradient-ink)" }}>
        {influencer.avatarUrl ? (
          <img
            src={influencer.avatarUrl}
            alt={influencer.name}
            className="relative h-20 w-20 rounded-full border-2 object-cover"
            style={{ borderColor: "var(--gold)" }}
          />
        ) : (
          <span
            className="relative flex h-20 w-20 items-center justify-center rounded-full font-display text-2xl font-bold text-gold"
            style={{ border: "2px solid var(--gold)" }}
          >
            {initials(influencer.name)}
          </span>
        )}
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-xs text-white/80 backdrop-blur">
          <PlatformIcon className="size-3.5" />
          {platform?.name || "Platform"}
        </span>
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-gold" style={{ background: "oklch(0.16 0.02 250 / 0.55)" }}>
          <Star className="size-3.5 fill-current" />
          {rating}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link to={`${basePath}/${influencer.id || influencer._id}`} className="hover:underline">
              <h3 className="flex items-center gap-1.5 font-display text-lg font-semibold">
                {influencer.name}
                {influencer.is_verified && <BadgeCheck className="size-4 text-primary" />}
              </h3>
            </Link>
            <p className="text-xs text-muted-foreground">{influencer.city}</p>
            <Link to={`${basePath}/${influencer.id || influencer._id}`} className="mt-1 text-[11px] font-medium text-primary hover:underline block">
              View Profile
            </Link>
          </div>
          <div className="text-right">
            <p className="font-display text-lg font-bold text-primary">
              {formatCount(influencer.followers)}
            </p>
            <p className="text-[11px] text-muted-foreground">Followers</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(influencer.niches || []).slice(0, 4).map((n) => (
            <span
              key={n._id || n}
              className="rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-[11px] text-muted-foreground"
            >
              {n.name || n}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-muted/25 p-3 text-center">
          <Stat label="Posts" value={formatCount(influencer.posts)} />
          <Stat label="Avg likes" value={formatCount(influencer.likes)} />
          <Stat label="Engagement" value={`${influencer.engagement}%`} />
        </div>

        <p className="text-xs text-muted-foreground">
          Starts at <span className="text-foreground">{formatRupees(influencer.starting_price)}</span>
        </p>

        <div className="mt-auto flex gap-2 pt-2">
          <Button
            variant={isShortlisted ? "secondary" : "soft"}
            size="icon"
            aria-label="Add to shortlist"
            disabled={busy || isShortlisted}
            onClick={() => onShortlist?.(influencer)}
            className={isShortlisted ? "text-red-500" : ""}
          >
            <Heart className={`size-4 ${isShortlisted ? "fill-current" : ""}`} />
          </Button>
          <Button
            variant={isOffered ? "secondary" : "hero"}
            className="flex-1"
            disabled={busy || isOffered}
            onClick={() => onOffer?.(influencer)}
          >
            {isOffered ? (
              "Applied"
            ) : (
              <>
                <Send className="size-4" />
                {actionLabel ?? "Send offer"}
              </>
            )}
          </Button>
        </div>
      </div>
    </article>
  );
}
