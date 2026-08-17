import { useEffect, useState } from "react";
import { locations } from "@/lib/api";

// States load once. Districts reload whenever `stateCode` changes — both
// come from the india-location-kit package on the server (getStates /
// getDistricts functions), plus any admin-added custom districts, so this
// hook never hardcodes a list.
export function useStates() {
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    locations
      .listStates()
      .then((docs) => {
        if (!cancelled) setStates(docs);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { states, loading };
}

export function useDistricts(stateCode) {
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!stateCode) {
      setDistricts([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    locations
      .listDistricts(stateCode)
      .then((docs) => {
        if (!cancelled) setDistricts(docs);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [stateCode]);

  return { districts, loading };
}
