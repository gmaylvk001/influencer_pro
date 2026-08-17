import { useEffect, useState } from "react";
import { catalog } from "@/lib/api";

// Fetches the current Platform & Niche lists from the database. Both are
// admin-manageable collections (see server/models/Platform.js and Niche.js),
// so nothing here is hardcoded — new platforms/niches just show up.
export function useCatalog() {
  const [platforms, setPlatforms] = useState([]);
  const [niches, setNiches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([catalog.listPlatforms(), catalog.listNiches()])
      .then(([platformDocs, nicheDocs]) => {
        if (cancelled) return;
        setPlatforms(platformDocs);
        setNiches(nicheDocs);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { platforms, niches, loading, error };
}
