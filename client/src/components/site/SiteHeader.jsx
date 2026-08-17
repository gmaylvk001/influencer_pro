import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { useAuth } from "@/lib/AuthContext";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/influencers", label: "Find Influencers" },
  { to: "/for-brands", label: "For Brands" },
  { to: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  function handleSignOut() {
    logout();
    navigate("/auth", { replace: true });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {!user && NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `relative rounded-lg px-3 py-2 text-sm transition-colors after:absolute after:bottom-0.5 after:left-3 after:right-3 after:h-[2px] after:rounded-full after:bg-[image:var(--gradient-gold)] after:transition-opacity ${
                  isActive
                    ? "text-foreground after:opacity-100"
                    : "text-muted-foreground hover:text-foreground after:opacity-0"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop auth buttons */}
        <div className="hidden items-center gap-2 md:flex">
          {!loading && user ? (
            <>
              <Button variant="soft" size="sm" asChild>
                <Link to="/dashboard">My account</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">Login</Link>
              </Button>
              <Button variant="hero" size="sm" asChild>
                <Link to="/signup/brand">Start a campaign</Link>
              </Button>
            </>
          )}
          <ThemeToggle />
        </div>

        {/* Mobile menu toggle */}
        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4">
            {!user && NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2">
              {user ? (
                <>
                  <Button variant="soft" className="flex-1" asChild>
                    <Link to="/dashboard">My account</Link>
                  </Button>
                  <Button variant="outline" onClick={handleSignOut}>
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="flex-1" asChild>
                    <Link to="/auth">Login</Link>
                  </Button>
                  <Button variant="hero" className="flex-1" asChild>
                    <Link to="/signup/brand">Sign up</Link>
                  </Button>
                </>
              )}
              <div className="flex items-center justify-center pt-2">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
