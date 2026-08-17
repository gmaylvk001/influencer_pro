import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCatalog } from "@/hooks/useCatalog";

// Platform options come from the Platform collection (server/models/Platform.js),
// not a hardcoded enum — new platforms show up here as soon as they're added.
export function PlatformSelect({ value, onChange, placeholder = "Select platform" }) {
  const { platforms, loading } = useCatalog();

  return (
    <Select value={value || ""} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={loading ? "Loading…" : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {platforms.map((p) => (
          <SelectItem key={p._id || p.id} value={p._id || p.id}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
