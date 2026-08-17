import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { Sparkles, ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
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
import { PlatformChips } from "@/components/site/PlatformChips";
import { NicheChips } from "@/components/site/NicheChips";
import { auth } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

const STEPS = ["Basic info", "Socials", "Niche & pricing", "Verify"];

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

export default function SignupInfluencer() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const fileRef = useRef(null);
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [niches, setNiches] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [languages, setLanguages] = useState([]);
  const [socialLinks, setSocialLinks] = useState({});
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    state: "",
    district: "",
    gender: "female",
    startingPrice: "",
  });

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await readAsDataUrl(file);
    setAvatarPreview(dataUrl);
  }

  function goNext(e) {
    e.preventDefault();
    if (step === 1) {
      if (!form.full_name || !form.email || !form.password) {
        toast.error("Please fill in your name, email and password.");
        return;
      }
      if (form.password.length < 6) {
        toast.error("Password must be at least 6 characters.");
        return;
      }
      if (!form.state || !form.district) {
        toast.error("Please select your state and district.");
        return;
      }
    }
    if (step === 2 && Object.keys(socialLinks).length === 0) {
      toast.error("Please add at least one social media link.");
      return;
    }
    if (step === 3 && niches.length === 0) {
      toast.error("Pick at least one content niche.");
      return;
    }
    setStep((s) => s + 1);
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

  async function handleVerifyAndSubmit(e) {
    e.preventDefault();
    if (!otpSent) {
      sendOtp();
      return;
    }
    if (otp.trim().length !== 6) {
      toast.error("Enter the 6-digit code we sent you.");
      return;
    }
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append("email", form.email);
      formData.append("password", form.password);
      formData.append("accountType", "influencer");
      formData.append("fullName", form.full_name);
      formData.append("phone", form.phone);
      formData.append("handle", form.handle);
      formData.append("gender", form.gender);
      formData.append("state", form.state);
      formData.append("district", form.district);
      formData.append("city", form.district);
      formData.append("startingPrice", form.startingPrice);
      formData.append("otp", otp);
      
      formData.append("socialLinks", JSON.stringify(socialLinks));
      
      languages.forEach(l => formData.append("languages", l));
      niches.forEach(n => formData.append("niches", n));
      
      if (fileRef.current?.files?.[0]) {
        formData.append("file", fileRef.current.files[0]);
      }

      await auth.signup(formData);
      await refreshUser();
      toast.success("Profile created. Complete your details to go live!");
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
            <Sparkles className="size-5" />
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold">Join as an influencer</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your creator profile and start receiving collaboration offers.
          </p>

          <div className="mt-8">
            <StepProgress steps={STEPS} current={step} />
          </div>

          {step === 1 && (
            <form className="mt-8 grid gap-4 sm:grid-cols-2" onSubmit={goNext}>
              <div className="flex flex-col items-center gap-3 sm:col-span-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border bg-muted/40 hover:border-primary/60"
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" />
                  ) : (
                    <Sparkles className="size-8 text-muted-foreground" />
                  )}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                <p className="text-xs text-muted-foreground">Upload a profile photo (optional)</p>
              </div>
              <Field label="Full name" required>
                <Input required value={form.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Aarav Mehta" />
              </Field>
              <Field label="Email" required>
                <Input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@gmail.com" />
              </Field>
              <Field label="Phone">
                <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 98765 43210" />
              </Field>
              <Field label="Gender">
                <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <LocationSelect
                state={form.state}
                district={form.district}
                onStateChange={(v) => set("state", v)}
                onDistrictChange={(v) => set("district", v)}
              />
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
            <form className="mt-8 space-y-6" onSubmit={goNext}>
              <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-6">
                <Label className="text-base">Your Social Media Assets</Label>
                <div className="space-y-4 mt-4">
                  {[
                    { id: "Blog", label: "Blog", ph: "https://www.example.com" },
                    { id: "Facebook", label: "Facebook", ph: "https://www.facebook.com/yourprofile" },
                    { id: "Twitter", label: "Twitter", ph: "https://x.com/yourprofile" },
                    { id: "Instagram", label: "Instagram", ph: "https://www.instagram.com/yourprofile" },
                    { id: "Pinterest", label: "Pinterest", ph: "https://in.pinterest.com/yourprofile" },
                    { id: "Youtube", label: "Youtube", ph: "https://www.youtube.com/c/yourchannel" },
                    { id: "Roposo", label: "Roposo", ph: "https://www.roposo.com/profile/yourprofile" },
                    { id: "MX TakaTak", label: "MX TakaTak", ph: "https://usr.mxtakatak.com/yourprofile" },
                  ].map((p) => {
                    const isActive = socialLinks[p.id] !== undefined;
                    return (
                      <div key={p.id} className="flex items-center gap-4">
                        <label className="flex w-32 cursor-pointer items-center gap-2 text-sm font-medium">
                          <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSocialLinks({ ...socialLinks, [p.id]: { url: "" } });
                              } else {
                                const newLinks = { ...socialLinks };
                                delete newLinks[p.id];
                                setSocialLinks(newLinks);
                              }
                            }}
                            className="h-4 w-4 rounded border-border accent-primary"
                          />
                          {p.label}
                        </label>
                        <Input
                          disabled={!isActive}
                          value={socialLinks[p.id]?.url || ""}
                          onChange={(e) => setSocialLinks({ ...socialLinks, [p.id]: { url: e.target.value } })}
                          placeholder={`Enter your ${p.label} URL; E.g. ${p.ph}`}
                          className="flex-1"
                        />
                      </div>
                    );
                  })}
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
            <form className="mt-8 space-y-5" onSubmit={goNext}>
              <div>
                <Label>Content niches (up to 5)</Label>
                <div className="mt-3">
                  <NicheChips value={niches} onChange={setNiches} />
                </div>
              </div>
              
              <div>
                <Label>Content Languages</Label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    "Assamese", "Bengali", "Bhojpuri", "English", "Gujarati", 
                    "Haryanvi", "Hindi", "Kannada", "Malayalam", "Marathi", 
                    "Odia", "Punjabi", "Rajasthani", "Tamil", "Telugu", "Urdu"
                  ].map(lang => {
                    const isSelected = languages.includes(lang);
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setLanguages(languages.filter(l => l !== lang));
                          } else {
                            setLanguages([...languages, lang]);
                          }
                        }}
                        className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
                          isSelected 
                            ? "border-primary bg-primary text-primary-foreground" 
                            : "border-border bg-card text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {lang}
                      </button>
                    )
                  })}
                </div>
              </div>
              <Field label="Starting price (₹)">
                <Input type="number" value={form.startingPrice} onChange={(e) => set("startingPrice", e.target.value)} placeholder="25000" />
              </Field>
              <div className="flex gap-3">
                <Button type="button" variant="outline" size="lg" onClick={() => setStep(2)}>
                  <ArrowLeft className="size-4" /> Back
                </Button>
                <Button variant="hero" size="lg" className="flex-1" type="submit">
                  Continue <ArrowRight className="size-4" />
                </Button>
              </div>
            </form>
          )}

          {step === 4 && (
            <form className="mt-8 space-y-5" onSubmit={handleVerifyAndSubmit}>
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

                {otpSent ? (
                  <Input
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="mt-4 w-40 text-center tracking-[0.4em]"
                  />
                ) : null}

                {otpSent && (
                  <button
                    type="button"
                    onClick={sendOtp}
                    disabled={sendingOtp}
                    className="mt-3 text-xs text-primary hover:underline"
                  >
                    Resend code
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" size="lg" onClick={() => setStep(3)}>
                  <ArrowLeft className="size-4" /> Back
                </Button>
                <Button variant="hero" size="lg" className="flex-1" type="submit" disabled={busy || sendingOtp}>
                  {busy
                    ? "Creating profile…"
                    : otpSent
                    ? "Verify & create profile"
                    : sendingOtp
                    ? "Sending code…"
                    : "Send verification code"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}