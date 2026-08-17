import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router";
import {
  Plus,
  LogOut,
  Menu,
  X,
  Headphones,
  ChevronDown,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/Logo";
import { useAuth } from "@/lib/AuthContext";
import { brands, influencers } from "@/lib/api";
import { calculateInfluBrandScore } from "@/lib/catalog";
import { ThemeToggle } from "./ThemeToggle";

const PURCHASE_LINKS = [
  { to: "/dashboard/purchases/buy-connects", label: "Buy Connects" },
  { to: "/dashboard/purchases/wallet", label: "Connect Wallet" },
  { to: "/dashboard/purchases/connect-history", label: "Connect Purchase History" },
  { to: "/dashboard/purchases/package-history", label: "Package Purchase History" },
];

const BRAND_NAV = [
  { to: "/dashboard", end: true, label: "Dashboard" },
  { to: "/dashboard/influencers", label: "Influencers" },
  { to: "/dashboard/campaigns", label: "My Campaigns" },
  { to: "/dashboard/offers", label: "Active Collabs" },
  { to: "/dashboard/messages", label: "Inbox" },
  { to: "/dashboard/profile", label: "My Profile" },
  { to: "/dashboard/purchases", label: "My Purchase" },
];

const INFLUENCER_NAV = [
  { to: "/dashboard/campaigns", label: "Campaigns" },
  { to: "/dashboard/offers", label: "Direct Offers" },
  { to: "/dashboard/messages", label: "Inbox" },
  { to: "/dashboard/public-profile", label: "Public Profile" },
  { to: "/dashboard/interests", label: "Profile Interests" },
  { to: "/dashboard/unlocks", label: "URL Unlocks" },
  { to: "/dashboard/profile", label: "Edit Profile" },
  { to: "/dashboard/earnings", label: "My Earnings" },
  { to: "/dashboard/others", label: "Others" },
];

const ADMIN_NAV = [
  { to: "/dashboard/admin/overview", label: "Overview" },
  { to: "/dashboard/admin/users", label: "User Management" },
  { to: "/dashboard/admin/catalog", label: "Manage Catalog" },
  { to: "/dashboard/admin/verification", label: "Verify Influencers" }
];

export function DashboardLayout() {
  const { user, accountType, loading, logout, isImpersonating, stopImpersonating } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [connectBalance, setConnectBalance] = useState(null);
  const [influencerStats, setInfluencerStats] = useState({ score: 0, balance: 0 });
  const [profileOpen, setProfileOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(null);
  const profileRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (accountType === "influencer") {
      influencers
        .me()
        .then((i) => {
          setIsVerified(i.isVerified ?? i.is_verified);
          setInfluencerStats({
            score: calculateInfluBrandScore(i),
            balance: i.account_balance || i.accountBalance || 0
          });
        })
        .catch(() => setIsVerified(null));
    }
  }, [accountType]);

  useEffect(() => {
    if (accountType === "brand") {
      brands
        .me()
        .then((b) => setConnectBalance(b.connectBalance))
        .catch(() => setConnectBalance(null));
    }
  }, [accountType]);

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    // Admins have no brand/influencer dashboard content — send them
    // straight to the page they actually need.
    if (!loading && user && accountType === "admin" && window.location.pathname === "/dashboard") {
      navigate("/dashboard/admin/overview", { replace: true });
    }
  }, [user, accountType, loading, navigate]);

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground animate-pulse">Loading your account…</p>
      </main>
    );
  }

  if (!user) return null;

  const isBrand = accountType === "brand";
  const isAdmin = accountType === "admin";
  const navItems = isBrand ? BRAND_NAV : isAdmin ? ADMIN_NAV : INFLUENCER_NAV;
  const displayName = user.fullName || user.email?.split("@")[0] || "there";
  const firstName = displayName.split(" ")[0];

  function handleLogout() {
    logout();
    navigate("/");
  }

  const stats = isAdmin
    ? []
    : isBrand
    ? [{ value: String(connectBalance ?? 0).padStart(2, "0"), label: "Connect balance" }]
    : [
        { value: Number(influencerStats.score).toFixed(1), label: "InfluBrand score" },
        { value: `₹${influencerStats.balance}`, label: "Account balance" },
      ];

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-background text-foreground">
      {isImpersonating && (
        <div className="bg-destructive text-destructive-foreground px-4 py-2 text-center text-sm font-semibold flex items-center justify-center gap-4">
          <span>You are currently impersonating {displayName}.</span>
          <button 
            onClick={() => {
              stopImpersonating();
              navigate("/dashboard/admin/users");
            }} 
            className="underline hover:text-white transition-colors"
          >
            Return to Admin
          </button>
        </div>
      )}
      {/* Identity row — clean, quiet, JPMorgan-style restraint */}
      <div className="relative z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Logo />
          <div className="flex items-center gap-5">
            <Link
              to="/dashboard/support"
              className="hidden items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:flex"
            >
              <Headphones className="size-4" />
              Support
            </Link>
            <div ref={profileRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((v) => !v)}
                className="group flex items-center gap-2.5 rounded-full border border-transparent py-1 pr-1 pl-1.5 text-sm font-medium transition-colors hover:border-border"
              >
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
                  style={{ background: "var(--gradient-ink)" }}
                >
                  <span className="text-gold">{displayName.slice(0, 1).toUpperCase()}</span>
                </span>
                <span className="hidden sm:inline">{displayName}</span>
                <ChevronDown
                  className={`size-3.5 text-muted-foreground transition-transform ${profileOpen ? "rotate-180" : ""}`}
                />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full z-20 mt-2 w-64 overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-card)]">
                  {isVerified !== null && (
                    <div className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="text-muted-foreground">Current Status</span>
                      <span
                        className="rounded-full px-2.5 py-1 text-xs font-bold text-primary-foreground"
                        style={{ background: "var(--gradient-mint)" }}
                      >
                        {isVerified ? "Approved" : "Under review"}
                      </span>
                    </div>
                  )}
                  <div className="divide-y divide-border/60 border-t border-border/60">
                    {user.email && (
                      <div className="flex items-center gap-2.5 px-4 py-3 text-sm">
                        <Mail className="size-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">{user.email}</span>
                      </div>
                    )}
                    {user.phone && (
                      <div className="flex items-center gap-2.5 px-4 py-3 text-sm">
                        <Phone className="size-4 shrink-0 text-muted-foreground" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                    {user.city && (
                      <div className="flex items-center gap-2.5 px-4 py-3 text-sm">
                        <MapPin className="size-4 shrink-0 text-muted-foreground" />
                        <span>{user.city}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <button
              className="rounded-md border border-border p-1.5 lg:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Signature stat ribbon — deep ink block, oversized condensed numerals (Nike),
          a single hairline gold rule underneath for quiet authority (JPMorgan). */}
      <div className="relative overflow-hidden" style={{ background: "var(--gradient-ink)" }}>
        <div
          className="absolute inset-y-0 right-0 w-1/3"
          style={{ background: "var(--gradient-mint)", opacity: 0.1, clipPath: "polygon(30% 0, 100% 0, 100% 100%, 0 100%)" }}
        />
        <div className="relative mx-auto flex w-full max-w-7xl flex-wrap items-end justify-between gap-6 px-4 py-7 sm:px-6">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-white/45">
              <span className="h-px w-6" style={{ background: "var(--gradient-gold)" }} />
              {isBrand ? "Brand account" : isAdmin ? "Admin account" : "Creator account"}
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">
              Hi, {firstName}.
            </h1>
          </div>

          <div className="flex items-end gap-8">
            {stats.map((s) => (
              <div key={s.label}>
                <p
                  className="leading-none text-[var(--volt)]"
                  style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.25rem, 4.5vw, 3.25rem)", fontWeight: 700, letterSpacing: "-0.03em" }}
                >
                  {s.value}
                </p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-white/50">
                  {s.label}
                </p>
              </div>
            ))}
            {isBrand && (
              <Button variant="hero" size="sm" asChild className="mb-1.5">
                <Link to="/dashboard/campaigns/new">
                  <Plus className="size-4" />
                  New campaign
                </Link>
              </Button>
            )}
          </div>
        </div>
        <div className="h-px w-full" style={{ background: "var(--gradient-gold)", opacity: 0.7 }} />
      </div>

      {/* Nav — bold uppercase pills instead of a thin underline row */}
      <div className="border-b border-border bg-card">
        <nav
          className={`mx-auto flex w-full max-w-7xl gap-1 overflow-x-auto px-4 py-2.5 sm:px-6 ${
            mobileOpen ? "flex" : "hidden"
          } lg:flex flex-col lg:flex-row lg:items-center`}
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-1 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                  isActive
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground lg:ml-auto"
          >
            <LogOut className="size-3.5" />
            Log out
          </button>
        </nav>
      </div>

      {/* My Purchase sub-nav — plain in-flow pill row, only while inside that
          section. No absolute positioning, so it can't get clipped by the
          nav's overflow-x-auto scroll container. */}
      {isBrand && location.pathname.startsWith("/dashboard/purchases") && (
        <div className="border-b border-border bg-muted/30">
          <nav className="mx-auto flex w-full max-w-7xl flex-wrap gap-1.5 px-4 py-2.5 sm:px-6">
            {PURCHASE_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    isActive
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-transparent text-muted-foreground hover:border-border hover:bg-card hover:text-foreground"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </div>
    </div>
  );
}