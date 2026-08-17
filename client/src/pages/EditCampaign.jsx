import { useRef, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import {
  Instagram,
  Youtube,
  Facebook,
  UploadCloud,
  CheckCircle2,
  Megaphone,
  MapPin,
  Sparkles,
  Users,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StepProgress } from "@/components/site/StepProgress";
import { campaigns as campaignsApi } from "@/lib/api";
import { useCatalog } from "@/hooks/useCatalog";
import { useStates, useDistricts } from "@/hooks/useDistricts";

const STEPS = ["Campaign", "Influencers", "Brand URLs"];

const GOAL_OPTIONS = [
  "Brand Activation",
  "Social Media Marketing",
  "Brand Promotion",
  "Content Outreach",
  "Product Reviews",
];

const CONTENT_FORMAT_OPTIONS = ["Story", "Collaborate", "Post"];

const INFLUENCER_COUNT_OPTIONS = ["1 - 5", "6 - 10", "11 - 25", "26 - 50", "50+"];
const PAY_OPTIONS = ["₹0 - ₹5,000", "₹5,000 - ₹15,000", "₹15,000 - ₹40,000", "₹40,000+"];
const START_OPTIONS = ["Immediately", "Within a week", "Within 2 weeks", "Within 1 month"];

const PACKAGES = [
  {
    id: "option3",
    label: "Starter",
    price: "Free",
    tagline: "Test the waters",
    features: ["Up to 40 guaranteed applications", "Campaign runs for 7 days"],
  },
  {
    id: "option2",
    label: "Growth",
    price: "₹16,999",
    tagline: "Most popular",
    highlight: true,
    features: [
      "Up to 75 guaranteed applications",
      "Contact details for 50 creators",
      "Campaign runs for 30 days",
      "Dedicated relationship manager",
    ],
  },
  {
    id: "option1",
    label: "Scale",
    price: "₹24,999",
    tagline: "Go all-in",
    features: [
      "Up to 150 guaranteed applications",
      "Contact details for 100 creators",
      "Campaign runs for 30 days",
      "Dedicated relationship manager",
    ],
  },
];

const EMPTY_FORM = {
  promotionType: "product",
  nicheId: "",
  promotionState: "",
  promotionDistricts: [],
  promotionAllIndia: false,
  brandName: "",
  brandOverview: "",
  brandWebsite: "",
  goals: [],
  contentFormats: [],
  taskDetails: "",
  briefFile: null,
  influencerCount: "",
  payPerInfluencer: "",
  expectedStart: "",
  instagramUrl: "",
  youtubeUrl: "",
  facebookUrl: "",
};

function SectionCard({ icon: Icon, title, required, children }) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[image:var(--gradient-mint)] text-primary-foreground">
          <Icon className="size-4" />
        </span>
        <h3 className="font-display text-sm font-bold sm:text-base">
          {title}
          {required && <span className="ml-1 text-primary">*</span>}
        </h3>
      </div>
      {children}
    </div>
  );
}

function Field({ label, required, children, hint }) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-primary"> *</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ChipToggle({ options, value, onChange }) {
  function toggle(opt) {
    if (value.includes(opt)) onChange(value.filter((v) => v !== opt));
    else onChange([...value, opt]);
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value.includes(opt);
        return (
          <button
            type="button"
            key={opt}
            onClick={() => toggle(opt)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              active
                ? "border-transparent bg-foreground text-background"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function PillRadio({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            type="button"
            key={opt}
            onClick={() => onChange(opt)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium capitalize transition-colors ${
              active
                ? "border-transparent bg-[image:var(--gradient-mint)] text-primary-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function PromotionLocationPicker({ state, districts, allIndia, onStateChange, onDistrictsChange, onAllIndiaChange }) {
  const { states, loading: statesLoading } = useStates();
  const { districts: districtOptions, loading: districtsLoading } = useDistricts(state);

  function toggleDistrict(name) {
    if (districts.includes(name)) onDistrictsChange(districts.filter((d) => d !== name));
    else onDistrictsChange([...districts, name]);
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => onAllIndiaChange(!allIndia)}
        className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
          allIndia
            ? "border-transparent bg-foreground text-background"
            : "border-border text-muted-foreground hover:text-foreground"
        }`}
      >
        <MapPin className="size-3.5" />
        All Over India
      </button>

      {!allIndia && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>State</Label>
            <Select
              value={state || ""}
              onValueChange={(v) => {
                onStateChange(v);
                onDistrictsChange([]);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={statesLoading ? "Loading…" : "Select state"} />
              </SelectTrigger>
              <SelectContent>
                {states.map((s) => (
                  <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Districts</Label>
            {!state ? (
              <p className="text-xs text-muted-foreground">Pick a state first.</p>
            ) : districtsLoading ? (
              <p className="text-xs text-muted-foreground">Loading districts…</p>
            ) : (
              <ChipToggle
                options={districtOptions.map((d) => d.name)}
                value={districts}
                onChange={onDistrictsChange}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

async function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function EditCampaign() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const { niches } = useCatalog();
  const [step, setStep] = useState(1); 
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    campaignsApi.get(id)
      .then(data => {
        console.log("Fetched campaign data:", data);
        setForm({
          promotionType: data.promotionType || "product",
          nicheId: data.nicheId?._id || data.nicheId || "",
          promotionState: data.state || "",
          promotionDistricts: data.promotionCities?.filter(c => c !== "All Over India") || [],
          promotionAllIndia: data.promotionCities?.includes("All Over India") || false,
          brandName: data.brandName || "",
          brandOverview: data.brandOverview || "",
          brandWebsite: data.brandWebsite || "",
          goals: data.goals || [],
          contentFormats: data.contentFormats || [],
          taskDetails: data.taskDetails || data.brief || "",
          briefFile: null,
          influencerCount: data.influencerCount || "",
          payPerInfluencer: data.payPerInfluencer || "",
          expectedStart: data.expectedStart || "",
          instagramUrl: data.instagramUrl || "",
          youtubeUrl: data.youtubeUrl || "",
          facebookUrl: data.facebookUrl || "",
          _existingFileName: data.briefFileName || ""
        });
      })
      .catch(err => {
        console.error("Failed to fetch campaign:", err);
        toast.error(err.message || "Failed to load campaign");
      })
      .finally(() => setLoading(false));
  }, [id]);

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateStep1() {
    if (!form.brandName.trim() || !form.brandOverview.trim() || !form.brandWebsite.trim()) {
      toast.error("Please fill in your brand name, overview and website.");
      return false;
    }
    if (!form.promotionAllIndia && form.promotionDistricts.length === 0) {
      toast.error("Select at least one place to promote your brand in.");
      return false;
    }
    if (form.contentFormats.length === 0) {
      toast.error("Select how the content should be made.");
      return false;
    }
    if (!form.taskDetails.trim()) {
      toast.error("Please describe what creators will do for your campaign.");
      return false;
    }
    return true;
  }

  function validateStep2() {
    if (!form.influencerCount || !form.payPerInfluencer || !form.expectedStart) {
      toast.error("Please complete every influencer detail field.");
      return false;
    }
    return true;
  }

  function goNext(e) {
    e.preventDefault();
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setStep((s) => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleComplete(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const promotionCities = form.promotionAllIndia ? ["All Over India"] : form.promotionDistricts;
      const formData = new FormData();
      formData.append("title", `${form.brandName} Promotion`);
      formData.append("brief", form.taskDetails);
      if (form.nicheId) formData.append("nicheId", form.nicheId);
      if (!form.promotionAllIndia && form.promotionState) formData.append("state", form.promotionState);
      formData.append("promotionType", form.promotionType);
      
      promotionCities.forEach(c => formData.append("promotionCities", c));
      formData.append("brandName", form.brandName);
      formData.append("brandOverview", form.brandOverview);
      formData.append("brandWebsite", form.brandWebsite);
      form.goals.forEach(g => formData.append("goals", g));
      form.contentFormats.forEach(c => formData.append("contentFormats", c));
      formData.append("taskDetails", form.taskDetails);
      if (form.briefFile) {
        formData.append("briefFileName", form.briefFile.name);
        if (form.briefFile.size > 5 * 1024 * 1024) {
          toast.error("Campaign brief must be under 5 MB.");
          setBusy(false);
          return;
        }
        formData.append("file", form.briefFile);
      }

      await campaignsApi.update(id, formData);
      toast.success("Campaign updated successfully");
      navigate("/dashboard/campaigns");
    } catch (err) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <div className="py-24 text-center">Loading campaign...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header ribbon — reuses the app's own ink/mint identity, not a copy of any reference layout */}
      <div className="relative overflow-hidden rounded-2xl" style={{ background: "var(--gradient-ink)" }}>
        <div
          className="absolute inset-y-0 right-0 w-1/3"
          style={{ background: "var(--gradient-mint)", opacity: 0.12, clipPath: "polygon(30% 0, 100% 0, 100% 100%, 0 100%)" }}
        />
        <div className="relative px-6 py-8 text-center sm:px-10">
          {step < 4 ? (
            <>
              <p className="flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-white/45">
                <span className="h-px w-6" style={{ background: "var(--gradient-gold)" }} />
                Edit campaign
              </p>
              <h1 className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">
                Update Campaign Details
              </h1>
              <div className="mx-auto mt-6 max-w-lg">
                <StepProgress steps={STEPS} current={step} />
              </div>
            </>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
                Almost there
              </h1>
              <p className="mx-auto mt-3 max-w-lg text-sm text-white/70">
                Your campaign has been submitted. Pick a plan below and our team will start
                matching you with creators.
              </p>
            </>
          )}
        </div>
        <div className="h-px w-full" style={{ background: "var(--gradient-gold)", opacity: 0.7 }} />
      </div>

      <div className="surface-panel overflow-hidden">
        {/* STEP 1 — Campaign Details */}
        {step === 1 && (
          <form onSubmit={goNext} className="space-y-5 p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Tell us about your brand</h2>
              <span className="text-xs text-muted-foreground">*Required</span>
            </div>

            <SectionCard icon={Megaphone} title="What are we promoting?">
              <div className="space-y-4">
                <PillRadio options={["product", "service"]} value={form.promotionType} onChange={(v) => set("promotionType", v)} />
                <Select value={form.nicheId} onValueChange={(v) => set("nicheId", v)}>
                  <SelectTrigger><SelectValue placeholder="Choose a category" /></SelectTrigger>
                  <SelectContent>
                    {niches.map((n) => (
                      <SelectItem key={n._id || n.id} value={n._id || n.id}>{n.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </SectionCard>

            <SectionCard icon={MapPin} title="Where should we promote your brand?" required>
              <PromotionLocationPicker
                state={form.promotionState}
                districts={form.promotionDistricts}
                allIndia={form.promotionAllIndia}
                onStateChange={(v) => set("promotionState", v)}
                onDistrictsChange={(v) => set("promotionDistricts", v)}
                onAllIndiaChange={(v) => set("promotionAllIndia", v)}
              />
            </SectionCard>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Brand name" required>
                <Input value={form.brandName} onChange={(e) => set("brandName", e.target.value)} placeholder="Your brand name in full" />
              </Field>
              <Field label="Brand website" required>
                <Input value={form.brandWebsite} onChange={(e) => set("brandWebsite", e.target.value)} placeholder="https://www.example.com" />
              </Field>
            </div>

            <Field label="Brand overview" required>
              <Textarea rows={3} value={form.brandOverview} onChange={(e) => set("brandOverview", e.target.value)} placeholder="Write a couple lines about your brand" />
            </Field>

            <SectionCard icon={Sparkles} title="What do you want to achieve?">
              <ChipToggle options={GOAL_OPTIONS} value={form.goals} onChange={(v) => set("goals", v)} />
            </SectionCard>

            <SectionCard icon={Sparkles} title="How should the content be made?" required>
              <ChipToggle options={CONTENT_FORMAT_OPTIONS} value={form.contentFormats} onChange={(v) => set("contentFormats", v)} />
            </SectionCard>

            <Field label="Campaign brief" required>
              <Textarea
                rows={4}
                maxLength={5000}
                value={form.taskDetails}
                onChange={(e) => set("taskDetails", e.target.value)}
                placeholder="Describe what creators will do for your campaign and their deliverables"
              />
              <p className="text-xs text-muted-foreground">{5000 - form.taskDetails.length} characters remaining</p>
            </Field>

            <Field label="Attach a brief document" hint="Max file size: 5 MB. Leave empty to keep existing file.">
              <div className="flex items-center gap-2">
                <Input readOnly value={form.briefFile?.name || form._existingFileName || "No file selected"} className="flex-1" />
                <Button type="button" variant="soft" onClick={() => fileRef.current?.click()}>
                  <UploadCloud className="size-4" />
                  Browse
                </Button>
                <input ref={fileRef} type="file" hidden onChange={(e) => set("briefFile", e.target.files?.[0] || null)} />
              </div>
            </Field>

            <Button type="submit" variant="hero" size="lg" className="w-full">
              Continue to influencer details
            </Button>
          </form>
        )}

        {/* STEP 2 — Influencer Details */}
        {step === 2 && (
          <form onSubmit={goNext} className="space-y-5 p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Who do you need?</h2>
              <span className="text-xs text-muted-foreground">*Required</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Creators needed" required>
                <Select value={form.influencerCount} onValueChange={(v) => set("influencerCount", v)}>
                  <SelectTrigger><SelectValue placeholder="Choose a range" /></SelectTrigger>
                  <SelectContent>
                    {INFLUENCER_COUNT_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Budget per creator" required>
                <Select value={form.payPerInfluencer} onValueChange={(v) => set("payPerInfluencer", v)}>
                  <SelectTrigger><SelectValue placeholder="Choose a range" /></SelectTrigger>
                  <SelectContent>
                    {PAY_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <SectionCard icon={Users} title="When do you want to start?" required>
              <PillRadio options={START_OPTIONS} value={form.expectedStart} onChange={(v) => set("expectedStart", v)} />
            </SectionCard>

            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={goBack}>
                Back
              </Button>
              <Button type="submit" variant="hero" className="flex-1">
                Continue to brand URLs
              </Button>
            </div>
          </form>
        )}

        {/* STEP 3 — Brand URLs */}
        {step === 3 && (
          <form onSubmit={handleComplete} className="space-y-5 p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Link your brand's social presence</h2>
              <span className="text-xs text-muted-foreground">Optional but recommended</span>
            </div>

            <SectionCard icon={Link2} title="Brand URLs">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted"><Instagram className="size-4" /></span>
                  <Input value={form.instagramUrl} onChange={(e) => set("instagramUrl", e.target.value)} placeholder="Instagram URL" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted"><Youtube className="size-4" /></span>
                  <Input value={form.youtubeUrl} onChange={(e) => set("youtubeUrl", e.target.value)} placeholder="YouTube URL" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted"><Facebook className="size-4" /></span>
                  <Input value={form.facebookUrl} onChange={(e) => set("facebookUrl", e.target.value)} placeholder="Facebook URL" />
                </div>
              </div>
            </SectionCard>

            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={goBack}>
                Back
              </Button>
              <Button type="submit" variant="hero" className="flex-1" disabled={busy}>
                {busy ? "Saving…" : "Submit campaign"}
              </Button>
            </div>
          </form>
        )}


      </div>
    </div>
  );
}