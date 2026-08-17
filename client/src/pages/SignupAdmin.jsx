import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

export default function SignupAdmin() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    adminSecret: "",
  });

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password || !form.adminSecret) {
      toast.error("Please fill in every field, including the invite code.");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      await auth.signup({
        email: form.email,
        password: form.password,
        accountType: "admin",
        fullName: form.fullName,
        adminSecret: form.adminSecret,
      });
      await refreshUser();
      toast.success("Admin account created.");
      navigate("/dashboard/admin/catalog");
    } catch (err) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative overflow-hidden">
      <div className="hero-glow absolute inset-0" />
      <div className="relative mx-auto w-full max-w-md px-4 py-16">
        <div className="surface-panel p-8">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[image:var(--gradient-mint)] text-primary-foreground">
            <ShieldCheck className="size-5" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold">Admin sign-up</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Requires an invite code from whoever manages the server (it's the
            <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">ADMIN_SIGNUP_SECRET</code>
            value in the server's environment).
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input required value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@influbrand.com" />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input required type="password" minLength={6} value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="At least 6 characters" />
            </div>
            <div className="space-y-2">
              <Label>Admin invite code</Label>
              <Input required type="password" value={form.adminSecret} onChange={(e) => set("adminSecret", e.target.value)} placeholder="Ask whoever set up the server" />
            </div>
            <Button variant="hero" size="lg" className="w-full" type="submit" disabled={busy}>
              {busy ? "Creating…" : "Create admin account"} <ArrowRight className="size-4" />
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
