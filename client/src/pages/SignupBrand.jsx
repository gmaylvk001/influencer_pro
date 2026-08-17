import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { Building2, Camera, ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StepProgress } from "@/components/site/StepProgress";
import { LocationSelect } from "@/components/site/LocationSelect";
import { auth } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { useCatalog } from "@/hooks/useCatalog";

const STEPS = ["Account", "Verify", "Business"];

function Field({ label, required, children }) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-primary"> *</span>}
      </Label>
      {children}
    </div>
  );
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function SignupBrand() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const fileRef = useRef(null);
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const { niches } = useCatalog();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    company_name: "",
    website: "",
    nicheId: "",
    state: "",
    district: "",
    otp: "",
  });

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateStep1() {
    if (!form.full_name || !form.email || !form.password) {
      toast.error("Please fill in your name, email and password.");
      return false;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return false;
    }
    return true;
  }

  function handleNext(e) {
    e.preventDefault();
    if (validateStep1()) {
      setStep(2);
      if (!otpSent) sendOtp();
    }
  }

  async function sendOtp() {
    setSendingOtp(true);
    try {
      await auth.sendOtp({ email: form.email });
      setOtpSent(true);
      toast.success(`Verification code sent to ${form.email}`);
    } catch (err) {
      toast.error(err.message || "Failed to send verification code");
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await readAsDataUrl(file);
    setLogoPreview(dataUrl);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.company_name) {
      toast.error("Please enter your company name.");
      return;
    }
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append("email", form.email);
      formData.append("password", form.password);
      formData.append("accountType", "brand");
      formData.append("fullName", form.full_name);
      formData.append("companyName", form.company_name);
      formData.append("phone", form.phone);
      formData.append("website", form.website);
      formData.append("nicheId", form.nicheId);
      formData.append("state", form.state);
      formData.append("district", form.district);
      formData.append("city", form.district);
      
      if (fileRef.current?.files?.[0]) {
        formData.append("file", fileRef.current.files[0]);
      }
      formData.append("otp", form.otp);

      await auth.signup(formData);
      await refreshUser();
      toast.success("Account created. Welcome to Influbrand!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative overflow-hidden">
      <div className="hero-glow absolute inset-0" />
      <div className="relative mx-auto w-full max-w-2xl px-4 py-16">
        <div className="surface-panel p-8">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[image:var(--gradient-mint)] text-primary-foreground">
            <Building2 className="size-5" />
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold">Create a brand account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tell us about your business and start shortlisting creators today.
          </p>

          <div className="mt-8">
            <StepProgress steps={STEPS} current={step} />
          </div>

          {step === 1 && (
            <form className="mt-8 grid gap-4 sm:grid-cols-2" onSubmit={handleNext}>
              <Field label="Your name" required>
                <Input required value={form.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Riya Sharma" />
              </Field>
              <Field label="Work email" required>
                <Input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@company.com" />
              </Field>
              <Field label="Phone">
                <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 98765 43210" />
              </Field>
              <Field label="Password" required>
                <Input required type="password" minLength={6} value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="At least 6 characters" />
              </Field>

              <div className="sm:col-span-2">
                <Button variant="hero" size="lg" className="w-full" type="submit">
                  Continue <ArrowRight className="size-4" />
                </Button>
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  Already registered?{" "}
                  <Link to="/auth" className="text-primary hover:underline">Log in</Link>
                </p>
              </div>
            </form>
          )}

          {step === 2 && (
            <form className="mt-8 space-y-5" onSubmit={(e) => { e.preventDefault(); if (form.otp.length === 6) setStep(3); else toast.error("Enter 6-digit code"); }}>
              <div className="flex flex-col items-center rounded-xl border border-border bg-muted/30 p-6 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[image:var(--gradient-mint)] text-primary-foreground">
                  <ShieldCheck className="size-6" />
                </span>
                <p className="mt-3 font-display text-lg font-semibold">Verify your email</p>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  {otpSent
                    ? `Enter the 6-digit code we sent to ${form.email}.`
                    : `We'll send a 6-digit verification code to ${form.email || "your email"}.`}
                </p>

                <div className="mt-6 w-full max-w-[200px]">
                  <Input
                    type="text"
                    maxLength={6}
                    className="text-center text-2xl tracking-widest"
                    placeholder="000000"
                    value={form.otp}
                    onChange={(e) => set("otp", e.target.value.replace(/\D/g, ""))}
                  />
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={sendOtp}
                    disabled={sendingOtp}
                    className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
                  >
                    {sendingOtp ? "Sending..." : otpSent ? "Resend code" : "Send code"}
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" size="lg" onClick={() => setStep(1)}>
                  <ArrowLeft className="size-4" /> Back
                </Button>
                <Button variant="hero" size="lg" className="flex-1" type="submit">
                  Continue <ArrowRight className="size-4" />
                </Button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form className="mt-8 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
              <div className="flex flex-col items-center gap-3 sm:col-span-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border bg-muted/40 transition-colors hover:border-primary/60"
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="h-full w-full object-cover" />
                  ) : (
                    <Building2 className="size-8 text-muted-foreground" />
                  )}
                  <span className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-[image:var(--gradient-mint)] text-primary-foreground">
                    <Camera className="size-4" />
                  </span>
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                <p className="text-xs text-muted-foreground">Upload your company logo (optional)</p>
              </div>

              <Field label="Company name" required>
                <Input required value={form.company_name} onChange={(e) => set("company_name", e.target.value)} placeholder="Nova Skincare" />
              </Field>
              <Field label="Website">
                <Input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://" />
              </Field>
              <Field label="Industry / niche">
                <Select value={form.nicheId} onValueChange={(v) => set("nicheId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                  <SelectContent>
                    {niches.map((n) => (
                      <SelectItem key={n._id || n.id} value={n._id || n.id}>{n.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <LocationSelect
                state={form.state}
                district={form.district}
                onStateChange={(v) => set("state", v)}
                onDistrictChange={(v) => set("district", v)}
              />

              <div className="flex gap-3 sm:col-span-2">
                <Button type="button" variant="outline" size="lg" onClick={() => setStep(2)}>
                  <ArrowLeft className="size-4" /> Back
                </Button>
                <Button variant="hero" size="lg" className="flex-1" type="submit" disabled={busy}>
                  {busy ? "Creating account…" : "Create brand account"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
