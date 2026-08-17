import { useEffect, useState, useRef } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router";
import {
  LogOut,
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  Users,
  Box,
  BadgeCheck,
  Target,
  CreditCard
} from "lucide-react";
import { Logo } from "@/components/site/Logo";
import { useAuth } from "@/lib/AuthContext";
import { ThemeToggle } from "./ThemeToggle";

const ADMIN_NAV = [
  { to: "/dashboard/admin/overview", label: "Overview", icon: LayoutDashboard },
  { to: "/dashboard/admin/users", label: "User Management", icon: Users },
  { to: "/dashboard/admin/campaigns", label: "Campaigns", icon: Target },
  { to: "/dashboard/admin/transactions", label: "Transactions", icon: CreditCard },
  { to: "/dashboard/admin/catalog", label: "Manage Catalog", icon: Box },
  { to: "/dashboard/admin/verification", label: "Verify Influencers", icon: BadgeCheck }
];

export function AdminLayout() {
  const { user, accountType, loading, logout, isImpersonating, stopImpersonating } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
    if (!loading && user && accountType !== "admin") navigate("/dashboard", { replace: true });
  }, [user, accountType, loading, navigate]);

  if (loading || !user || accountType !== "admin") {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground animate-pulse">Loading admin workspace…</p>
      </main>
    );
  }

  const displayName = user.fullName || user.email?.split("@")[0] || "Admin";

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden text-foreground">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card/95 backdrop-blur z-20 shadow-xl">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Logo />
        </div>
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1.5">
          <p className="px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Command Center</p>
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`
                }
              >
                <Icon className="size-4.5" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="size-4.5" /> Log out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Impersonation Banner */}
        {isImpersonating && (
          <div className="bg-destructive text-destructive-foreground px-4 py-2 text-center text-sm font-semibold flex items-center justify-center gap-4 z-50 shrink-0 shadow-lg">
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

        {/* Mobile Header */}
        <header className="lg:hidden h-16 flex items-center justify-between px-4 border-b border-border bg-card/95 backdrop-blur z-30 shrink-0">
          <Logo />
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              className="rounded-md border border-border p-1.5 text-foreground hover:bg-muted transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </header>

        {/* Mobile Nav Overlay */}
        {mobileOpen && (
          <div className="lg:hidden absolute inset-0 z-40 bg-background flex flex-col pt-16">
            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
              {ADMIN_NAV.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold transition-all ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`
                    }
                  >
                    <Icon className="size-5" />
                    {item.label}
                  </NavLink>
                );
              })}
              <div className="pt-4 mt-4 border-t border-border">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="size-5" /> Log out
                </button>
              </div>
            </nav>
          </div>
        )}

        {/* Desktop Top Header (Profile only) */}
        <header className="hidden lg:flex h-16 items-center justify-end gap-4 px-8 border-b border-border bg-background shrink-0 shadow-sm z-10">
          <ThemeToggle />
          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-3 rounded-full border border-border bg-card py-1.5 pl-2 pr-3 text-sm font-semibold transition-colors hover:bg-muted"
            >
              <div className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span>{displayName}</span>
              <ChevronDown className={`size-4 text-muted-foreground transition-transform ${profileOpen ? "rotate-180" : ""}`} />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border bg-card shadow-xl overflow-hidden py-1">
                <div className="px-4 py-2 border-b border-border mb-1">
                  <p className="font-semibold text-sm truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors">
                  Log out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Main Scrolling Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 relative">
          {/* Subtle background glow for aesthetics */}
          <div className="absolute top-0 left-1/4 w-1/2 h-96 bg-primary/5 rounded-full blur-[100px] -z-10 pointer-events-none" />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
