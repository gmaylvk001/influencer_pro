import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/lib/AuthContext";

/**
 * Home ("/") should only be reachable while logged out.
 * Once a brand or influencer is logged in, bounce them to their dashboard.
 * Logging out restores full access to the public site.
 */
export function GuestOnlyRoute({ children }) {
  const { user, accountType, loading } = useAuth();
  const navigate = useNavigate();
  const restricted = accountType === "brand" || accountType === "influencer";

  useEffect(() => {
    if (!loading && user && restricted) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, restricted, loading, navigate]);

  if (loading || (user && restricted)) return null;

  return children;
}

/**
 * Find Influencers ("/influencers") is only accessible to brand accounts
 * that are logged in. Guests go to /auth, other logged-in accounts go to
 * their dashboard.
 */
export function BrandOnlyRoute({ children }) {
  const { user, accountType, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth", { replace: true });
    } else if (accountType !== "brand") {
      navigate("/dashboard", { replace: true });
    }
  }, [user, accountType, loading, navigate]);

  if (loading || !user || accountType !== "brand") return null;

  return children;
}
