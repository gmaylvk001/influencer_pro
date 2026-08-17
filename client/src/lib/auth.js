import { useEffect, useState } from "react";
import { auth as api, getToken, setToken } from "@/lib/api";

// Simple auth hook — checks for JWT in localStorage, fetches user on mount.
export function useSession() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then((u) => {
        if (active) setUser(u);
      })
      .catch(() => {
        setToken(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { session: user ? { user } : null, user, loading };
}

// Returns the user + their accountType (brand or influencer).
export function useAccount() {
  const { user, loading } = useSession();
  return { user, accountType: user?.accountType ?? null, loading };
}

// Signs out by clearing the token.
export async function signOutEverywhere() {
  setToken(null);
}
