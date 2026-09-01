import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { Building2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { useGoogleLogin } from "@react-oauth/google";

const REMEMBER_KEY = "influbrand_remembered_email";

export default function Auth() {
  const { user, loading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("brand"); // brand | influencer — cosmetic, same login endpoint
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState("login"); // "login" | "forgot" | "reset"

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    const saved = window.localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      setEmail(saved);
      setRemember(true);
    }
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await auth.login(email, password);
      if (remember) window.localStorage.setItem(REMEMBER_KEY, email);
      else window.localStorage.removeItem(REMEMBER_KEY);
      await refreshUser();
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message || "Invalid email or password");
    } finally {
      setBusy(false);
    }
  }

  const handleGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setBusy(true);
      try {
        await auth.googleLogin(tokenResponse.access_token, tab);
        await refreshUser();
        toast.success("Logged in with Google!");
        navigate("/dashboard");
      } catch (err) {
        toast.error(err.message || "Google sign-in failed");
      } finally {
        setBusy(false);
      }
    },
    onError: () => toast.error("Google login failed")
  });

  async function handleForgotPassword(e) {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email first.");
      return;
    }
    setBusy(true);
    try {
      await auth.forgotPassword(email);
      toast.success(`Password reset code sent to ${email}`);
      setView("reset");
    } catch (err) {
      toast.error(err.message || "Failed to send reset code");
    } finally {
      setBusy(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    if (!email || !otp || !password) {
      toast.error("Please fill in all fields.");
      return;
    }
    setBusy(true);
    try {
      await auth.resetPassword(email, otp, password);
      await refreshUser();
      toast.success("Password reset successfully! You are now logged in.");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message || "Failed to reset password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative overflow-hidden">
      <div className="hero-glow absolute inset-0" />
      <div className="relative mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-border/60 lg:my-16 lg:grid-cols-2">
        {/* Left brand panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-[image:var(--gradient-gold)] p-10 lg:flex">
          <div className="hero-glow absolute inset-0" />
          <div className="relative">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[image:var(--gradient-mint)] font-display text-lg font-bold text-primary-foreground">
              i
            </span>
            <h2 className="mt-8 font-display text-3xl font-bold leading-tight">
              Drive influence,
              <br />
              <span className="text-gradient">drive results.</span>
            </h2>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Join the marketplace where Indian brands and creators team up for measurable
              campaigns — no guesswork, just results.
            </p>
          </div>
          <dl className="relative grid grid-cols-3 gap-4">
            {[
              ["875+", "Collaborations"],
              ["6.0K+", "Creators"],
              ["18", "Cities"],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="font-display text-xl font-bold text-primary">{value}</dt>
                <dd className="text-xs text-muted-foreground">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Right form panel */}
        <div className="relative bg-card p-8 sm:p-10">
          <div className="relative">
            <h1 className="font-display text-2xl font-bold">
              {view === "login" ? "Log in to Influbrand" : view === "forgot" ? "Reset your password" : "Set new password"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {view === "login"
                ? "Brands and creators use the same login — just pick your account type."
                : view === "forgot"
                ? "Enter your email address and we'll send you a 6-digit verification code to reset your password."
                : `Enter the 6-digit code we sent to ${email} along with your new password.`}
            </p>

            {view === "login" && (
              <>
                <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl border border-border bg-muted/30 p-1">
              <button
                type="button"
                onClick={() => setTab("brand")}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors ${
                  tab === "brand"
                    ? "bg-[image:var(--gradient-mint)] text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Building2 className="size-4" />
                Brand
              </button>
              <button
                type="button"
                onClick={() => setTab("influencer")}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors ${
                  tab === "influencer"
                    ? "bg-[image:var(--gradient-mint)] text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sparkles className="size-4" />
                Influencer
              </button>
            </div>

            {/* <Button type="button" variant="outline" className="mt-6 w-full" onClick={handleGoogle}>
              <svg className="size-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.47c-.28 1.48-1.13 2.73-2.4 3.58v2.98h3.88c2.27-2.09 3.58-5.17 3.58-8.59z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.88-2.98c-1.08.72-2.45 1.16-4.05 1.16-3.11 0-5.75-2.1-6.69-4.92H1.3v3.09C3.27 21.3 7.31 24 12 24z" />
                <path fill="#FBBC05" d="M5.31 14.36c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28V6.71H1.3A11.97 11.97 0 000 12.08c0 1.94.46 3.77 1.3 5.37l4.01-3.09z" />
                <path fill="#EA4335" d="M12 4.75c1.76 0 3.35.61 4.6 1.79l3.45-3.45C17.94 1.19 15.24 0 12 0 7.31 0 3.27 2.7 1.3 6.71l4.01 3.09C6.25 6.98 8.89 4.75 12 4.75z" />
              </svg>
              Continue with Google
            </Button>

            <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or continue with email
              <span className="h-px flex-1 bg-border" />
            </div> */}
            </>
            )}

            {view === "login" && (
            <form className="space-y-4" onSubmit={handleLogin}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="inline-flex cursor-pointer items-center gap-2 text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  Remember me
                </label>
                <button type="button" onClick={() => setView("forgot")} className="text-primary hover:underline">
                  Forgot password?
                </button>
              </div>

              <Button variant="hero" className="w-full" type="submit" disabled={busy}>
                {busy ? "Signing in…" : "Log in"}
              </Button>
            </form>
            )}

            {view === "forgot" && (
              <form className="mt-8 space-y-4" onSubmit={handleForgotPassword}>
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                  />
                </div>
                <Button variant="hero" className="w-full" type="submit" disabled={busy}>
                  {busy ? "Sending..." : "Send reset code"}
                </Button>
                <button type="button" onClick={() => setView("login")} className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground">
                  Back to login
                </button>
              </form>
            )}

            {view === "reset" && (
              <form className="mt-8 space-y-4" onSubmit={handleResetPassword}>
                <div className="space-y-2">
                  <Label htmlFor="reset-otp">6-digit Code</Label>
                  <Input
                    id="reset-otp"
                    type="text"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    className="text-center tracking-widest"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                  />
                </div>
                <Button variant="hero" className="w-full" type="submit" disabled={busy}>
                  {busy ? "Resetting..." : "Set new password"}
                </Button>
                <button type="button" onClick={() => setView("login")} className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground">
                  Back to login
                </button>
              </form>
            )}

            {view === "login" && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              New here?{" "}
              <Link to="/signup/brand" className="text-primary hover:underline">
                Sign up as a brand
              </Link>{" "}
              or{" "}
              <Link to="/signup/influencer" className="text-primary hover:underline">
                as a creator
              </Link>
              .
            </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
