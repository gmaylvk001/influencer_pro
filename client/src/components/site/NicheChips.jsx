import { useCatalog } from "@/hooks/useCatalog";

// Niche ("category") options come from the Niche collection
// (server/models/Niche.js), not a hardcoded array — new niches show up here
// as soon as they're added via the API.
export function NicheChips({ value = [], onChange, max = 5 }) {
  const { niches, loading } = useCatalog();

  function toggle(id) {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else if (value.length < max) {
      onChange([...value, id]);
    }
  }

  if (loading) return <p className="text-xs text-muted-foreground">Loading niches…</p>;

  return (
    <div className="flex flex-wrap gap-2">
      {niches.map((n) => {
        const id = n._id || n.id;
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
            {n.name}
          </button>
        );
      })}
    </div>
  );
}
