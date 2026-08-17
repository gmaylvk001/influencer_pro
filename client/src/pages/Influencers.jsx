import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, ChevronUp, SlidersHorizontal, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InfluencerCard } from "@/components/site/InfluencerCard";
import { influencers as influencersApi, shortlists } from "@/lib/api";
import { formatCount, formatRupees, derivedRating } from "@/lib/catalog";
import { useCatalog } from "@/hooks/useCatalog";
import { useStates } from "@/hooks/useDistricts";
import { useAuth } from "@/lib/AuthContext";

const MAX_FOLLOWERS = 1000000;
const MAX_PRICE = 100000;

function FilterGroup({ title, options, active, onSelect, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen || active !== "All");

  return (
    <div className="surface-panel surface-panel-hover overflow-hidden rounded-xl">
      <button 
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-5 text-left"
      >
        <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
        {open ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <ul className="max-h-72 space-y-1 overflow-y-auto px-5 pb-5 pr-1 custom-scrollbar">
              {options.map((option) => (
                <li key={option.value}>
                  <button
                    onClick={() => onSelect(option.value)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-all ${
                      active === option.value
                        ? "bg-primary/10 text-primary font-semibold shadow-sm"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    {option.label}
                    {active === option.value && <div className="size-1.5 rounded-full bg-primary" />}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RangeSlider({ title, value, max, onChange, format }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="surface-panel surface-panel-hover overflow-hidden rounded-xl">
      <button 
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-5 text-left"
      >
        <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
        {open ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-5 pb-5 overflow-hidden"
          >
            <input
              type="range"
              min={0}
              max={max}
              step={max / 100}
              value={value}
              onChange={(e) => onChange(Number(e.target.value))}
              className="w-full accent-primary h-2 bg-muted rounded-lg appearance-none cursor-pointer"
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">0</span>
              <p className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                Up to {format(value)}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PlatformFilter({ platforms, selected, onToggle }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="surface-panel surface-panel-hover overflow-hidden rounded-xl">
      <button 
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-5 text-left"
      >
        <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Platform
        </h3>
        {open ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-5 pb-5 overflow-hidden"
          >
            <div className="space-y-2">
              {platforms.map((p) => {
                const id = p._id || p.id;
                const isSelected = selected.includes(id);
                return (
                  <label key={id} className={`flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors ${isSelected ? "bg-primary/5" : "hover:bg-muted/50"}`}>
                    <div className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>
                      {isSelected && <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <span className={`text-sm ${isSelected ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{p.name}</span>
                  </label>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Influencers({ isDashboard = false }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, accountType } = useAuth();
  const { platforms, niches } = useCatalog();
  const { states } = useStates();
  const [influencers, setInfluencers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("popular");
  const [busyId, setBusyId] = useState(null);
  const [platformIds, setPlatformIds] = useState([]);
  const [maxFollowers, setMaxFollowers] = useState(MAX_FOLLOWERS);
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE);

  // "niche" and "state" hold ids/codes in the URL; "All" means no filter.
  const nicheFilter = searchParams.get("niche") || "All";
  const stateFilter = searchParams.get("state") || "All";
  const query = searchParams.get("q") || "";

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [myLists, setMyLists] = useState([]);

  useEffect(() => {
    if (accountType === "brand") {
      shortlists.list().then(setMyLists).catch(console.error);
    }
  }, [accountType]);

  useEffect(() => {
    setLoading(true);
    influencersApi
      .list({
        page,
        limit: 20,
        q: query,
        niche: nicheFilter,
        state: stateFilter,
        platform: platformIds.join(","),
        maxFollowers,
        maxPrice,
        sort,
      })
      .then((res) => {
        setInfluencers(res.data);
        setTotalPages(res.totalPages);
      })
      .catch(() => setInfluencers([]))
      .finally(() => setLoading(false));
  }, [page, query, nicheFilter, stateFilter, platformIds, maxFollowers, maxPrice, sort]);

  function togglePlatform(id) {
    setPlatformIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setPage(1); // Reset page on filter change
  }

  // Update page reset for other filters
  useEffect(() => {
    setPage(1);
  }, [query, nicheFilter, stateFilter, maxFollowers, maxPrice, sort]);

  const results = influencers;

  function setFilter(patch) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(patch).forEach(([key, value]) => {
        if (value === undefined || value === "") next.delete(key);
        else next.set(key, value);
      });
      return next;
    }, { replace: true });
  }

  async function addToList(influencer, kind) {
    if (!user) {
      toast.error("Please sign in as a brand to shortlist creators.");
      return;
    }
    if (accountType !== "brand") {
      toast.error("Only brand accounts can shortlist or send offers.");
      return;
    }
    setBusyId(influencer.id || influencer._id);
    try {
      const newList = await shortlists.create({ influencerId: influencer.id || influencer._id, kind });
      setMyLists((prev) => {
        const filtered = prev.filter(
          (s) => (s.influencerId?._id || s.influencerId) !== (influencer.id || influencer._id)
        );
        return [...filtered, newList];
      });
      toast.success(
        kind === "offer"
          ? `Offer sent to ${influencer.name}.`
          : `${influencer.name} added to your shortlist.`
      );
    } catch (err) {
      toast.error(
        err.status === 409
          ? `${influencer.name} is already on your list.`
          : "Something went wrong. Please try again."
      );
    } finally {
      setBusyId(null);
    }
  }

  const nicheOptions = [{ value: "All", label: "All" }, ...niches.map((n) => ({ value: n._id || n.id, label: n.name }))];
  const stateOptions = [{ value: "All", label: "All" }, ...states.map((s) => ({ value: s.code, label: s.name }))];

  return (
    <div className={isDashboard ? "px-6" : ""}>
      {!isDashboard && (
        <section className="relative overflow-hidden border-b border-border/60">
          <div className="hero-glow absolute inset-0" />
          <div className="relative mx-auto w-full max-w-7xl px-4 py-14 sm:px-6">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-black"
            style={{ background: "var(--gradient-gold)" }}
          >
            Creator directory
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 max-w-2xl font-display text-3xl font-extrabold tracking-tight sm:text-5xl"
          >
            Find <span className="text-gradient">influencers</span> for every
            niche
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-3 max-w-2xl text-sm text-muted-foreground"
          >
            A handpicked directory of Indian creators — filter by niche, state and engagement to
            find the right voice for your campaign.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 flex max-w-xl items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setFilter({ q: e.target.value || undefined })}
                placeholder="Search by name or handle"
                className="pl-9"
              />
            </div>
            <Button variant="hero" asChild>
              <Link to="/signup/brand">Start a campaign</Link>
            </Button>
          </motion.div>
        </div>
      </section>
      )}

      <div className={isDashboard ? "grid w-full gap-8 py-8 lg:grid-cols-[260px_1fr]" : "mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[260px_1fr]"}>
        <motion.aside
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-6"
        >
          <FilterGroup
            title="Filter by niche"
            options={nicheOptions}
            active={nicheFilter}
            onSelect={(value) => setFilter({ niche: value === "All" ? undefined : value })}
          />
          <FilterGroup
            title="Filter by state"
            options={stateOptions}
            active={stateFilter}
            onSelect={(value) => setFilter({ state: value === "All" ? undefined : value })}
          />
          <PlatformFilter platforms={platforms} selected={platformIds} onToggle={togglePlatform} />
          <RangeSlider
            title="Follower range"
            value={maxFollowers}
            max={MAX_FOLLOWERS}
            onChange={setMaxFollowers}
            format={formatCount}
          />
          <RangeSlider
            title="Price range"
            value={maxPrice}
            max={MAX_PRICE}
            onChange={setMaxPrice}
            format={formatRupees}
          />
          <div className="surface-panel p-6">
            <h3 className="font-display text-lg font-semibold">Are you a creator?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              List your profile and get discovered by brands.
            </p>
            <Button variant="hero" className="mt-4 w-full" asChild>
              <Link to="/signup/influencer">Sign up as an influencer</Link>
            </Button>
          </div>
        </motion.aside>

        <main>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {loading ? "Loading…" : (
                <>Total <span className="text-foreground">{results.length} results</span> found</>
              )}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground flex items-center gap-1"><SlidersHorizontal className="size-4" /> Sort by:</span>
              {["popular", "engagement", "rating", "newest"].map((key) => (
                <button
                  key={key}
                  onClick={() => setSort(key)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-all ${
                    sort === key
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="surface-panel h-[360px] animate-pulse rounded-2xl p-5 flex flex-col items-center justify-center">
                  <div className="size-24 rounded-full bg-muted mb-4" />
                  <div className="h-4 w-32 bg-muted rounded mb-2" />
                  <div className="h-3 w-20 bg-muted rounded mb-6" />
                  <div className="w-full h-px bg-border mb-6" />
                  <div className="flex gap-4 w-full justify-center">
                    <div className="h-8 w-16 bg-muted rounded-md" />
                    <div className="h-8 w-16 bg-muted rounded-md" />
                    <div className="h-8 w-16 bg-muted rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="surface-panel flex flex-col items-center justify-center py-20 text-center rounded-2xl border-dashed">
              <div className="flex size-16 items-center justify-center rounded-full bg-muted mb-4">
                <UserX className="size-8 text-muted-foreground" />
              </div>
              <p className="font-display text-xl font-bold">No creators found</p>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                We couldn't find any creators matching your exact filters. Try widening the niche, state or range filters.
              </p>
              <Button variant="outline" className="mt-6" onClick={() => {
                setFilter({ niche: undefined, state: undefined, q: undefined });
                setPlatformIds([]);
                setMaxFollowers(MAX_FOLLOWERS);
              }}>
                Clear all filters
              </Button>
            </div>
          ) : (
            <motion.div
              key={results.length}
              className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.06 } },
              }}
            >
              {results.map((influencer) => {
                const listStatus = myLists.find(
                  (s) => (s.influencerId?._id || s.influencerId) === (influencer.id || influencer._id)
                );
                const isShortlisted = listStatus?.kind === "shortlist" || listStatus?.kind === "offer";
                const isOffered = listStatus?.kind === "offer";
                return (
                  <motion.div
                    key={influencer.id || influencer._id}
                    variants={{
                      hidden: { opacity: 0, y: 32, scale: 0.94 },
                      show: {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
                      },
                    }}
                  >
                    <InfluencerCard
                      influencer={influencer}
                      busy={busyId === (influencer.id || influencer._id)}
                      isShortlisted={isShortlisted}
                      isOffered={isOffered}
                      onShortlist={(inf) => addToList(inf, "shortlist")}
                      onOffer={(inf) => addToList(inf, "offer")}
                      isDashboard={isDashboard}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {!loading && totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-4">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm font-medium text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
