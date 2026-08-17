import { Link } from "react-router";

export function Logo({ compact = false }) {
  return (
    <Link to="/" className="inline-flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[image:var(--gradient-mint)] text-primary-foreground font-display text-lg font-bold">
        i
      </span>
      {!compact && (
        <span className="font-display text-xl font-bold tracking-tight">
          Influ<span className="text-gradient">brand</span>
        </span>
      )}
    </Link>
  );
}
