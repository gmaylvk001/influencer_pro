import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useStates, useDistricts } from "@/hooks/useDistricts";

// A State → District cascading picker. Both lists are fetched from the
// server (india-location-kit + any admin-added custom districts) — nothing
// is hardcoded here, so new districts just show up once added on the backend.
export function LocationSelect({ state, district, onStateChange, onDistrictChange }) {
  const { states, loading: statesLoading } = useStates();
  const { districts, loading: districtsLoading } = useDistricts(state);

  return (
    <>
      <div className="space-y-2">
        <Label>State</Label>
        <Select
          value={state || ""}
          onValueChange={(v) => {
            onStateChange(v);
            onDistrictChange(""); // reset district when state changes
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder={statesLoading ? "Loading…" : "Select state"} />
          </SelectTrigger>
          <SelectContent>
            {states.map((s) => (
              <SelectItem key={s.code} value={s.code}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>District</Label>
        <Select value={district || ""} onValueChange={onDistrictChange} disabled={!state}>
          <SelectTrigger>
            <SelectValue
              placeholder={!state ? "Pick a state first" : districtsLoading ? "Loading…" : "Select district"}
            />
          </SelectTrigger>
          <SelectContent>
            {districts.map((d) => (
              <SelectItem key={d.code || d.name} value={d.name}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
