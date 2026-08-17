import { useCatalog } from "@/hooks/useCatalog";

// Multi-select version of PlatformSelect — used wherever an influencer's
// platforms array is edited (signup, dashboard profile). PlatformSelect
// (single value) stays as-is for Campaign.platformId, which is still a
// single ref.
export function PlatformChips({ value = [], onChange, max = 6 }) {
  const { platforms, loading } = useCatalog();

  function toggle(id) {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else if (value.length < max) {
      onChange([...value, id]);
    }
  }

  if (loading) return <p className="text-xs text-muted-foreground">Loading platforms…</p>;

  return (
    <div className="flex flex-wrap gap-2">
      {platforms.map((p) => {
        const id = p._id || p.id;
        const active = value.includes(id);
        return (
          <button
            type="button"
            key={id}
            onClick={() => toggle(id)}
            className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
              active
                ? "border-transparent bg-foreground text-background"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {p.name}
          </button>
        );
      })}
    </div>
  );
}