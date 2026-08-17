import { useState, useEffect } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  BadgeCheck,
  Handshake,
  Rocket,
  Search,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { InfluencerCard } from "@/components/site/InfluencerCard";
import { influencers as influencersApi } from "@/lib/api";
import { useCatalog } from "@/hooks/useCatalog";
import { useStates } from "@/hooks/useDistricts";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { Parallax, FloatingBlob } from "@/components/motion/Parallax";
import { AnimatedCounter } from "@/components/motion/AnimatedCounter";
import heroImage from "@/assets/hero-creator.jpg";
import ctaBrand from "@/assets/cta-brand.jpg";
import ctaInfluencer from "@/assets/cta-influencer.jpg";

const STEPS = [
  { icon: Search, title: "Sign up", copy: "Create a brand account in under a minute." },
  { icon: Handshake, title: "Shortlist", copy: "Filter creators by niche, city and engagement." },
  { icon: BarChart3, title: "Monitor", copy: "Track responses and campaign progress live." },
  { icon: Wallet, title: "Get results", copy: "Approve content and pay only for delivery." },
];

const SERVICES = [
  { icon: Sparkles, title: "Influencer marketing", copy: "Full-funnel creator campaigns." },
  { icon: Rocket, title: "Brand promotion", copy: "Launches that reach the right feeds." },
  { icon: BadgeCheck, title: "Product reviews", copy: "Honest reviews from trusted voices." },
  { icon: BarChart3, title: "Performance reporting", copy: "Reach, engagement and CPE tracking." },
];

const FAQS = [
  {
    q: "How does Influbrand work?",
    a: "Create a brand account, browse our creator directory, shortlist the influencers that fit your niche, and send them a campaign offer. You approve deliverables before payment is released.",
  },
  {
    q: "How much does an influencer campaign cost?",
    a: "It depends on the creator tier and deliverables. Micro-influencers typically start around \u20B96,500 per collaboration, while established creators are listed with their own starting price.",
  },
  {
    q: "Can I choose the influencers myself?",
    a: "Yes. Every listing shows followers, average likes and engagement rate so you can shortlist independently, or ask our team for a curated list.",
  },
  {
    q: "How do I know the influencers are genuine?",
    a: "Creator statistics are pulled from their connected profiles and verified accounts carry a badge on their listing.",
  },
  {
    q: "When do I pay?",
    a: "Campaign budgets are confirmed when a creator accepts your offer, and released once the agreed content is live.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Influbrand cut our creator sourcing time in half. We shortlisted five great fits in a single afternoon.",
    name: "Ananya Rao",
    role: "Marketing Lead, Nova Skincare",
  },
  {
    quote:
      "The engagement data on every profile made it easy to trust who we were partnering with.",
    name: "Kabir Malhotra",
    role: "Founder, Urban Roots",
  },
  {
    quote:
      "We went from brief to live content in under two weeks — the dashboard kept everything organised.",
    name: "Sneha Iyer",
    role: "Brand Manager, Chai Point",
  },
];

const BRAND_STRIP = ["Nova Skincare", "Urban Roots", "Chai Point", "Bloom & Co", "Fitrite", "Wander India"];

function Metric({ value, suffix, label }) {
  return (
    <div>
      <dt className="font-display text-3xl font-bold text-primary">
        <AnimatedCounter value={value} suffix={suffix} />
      </dt>
      <dd className="text-xs text-muted-foreground">{label}</dd>
    </div>
  );
}

function SectionHeading({ eyebrow, title, copy }) {
  return (
    <Reveal className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">{title}</h2>
      {copy && <p className="mt-3 text-sm text-muted-foreground">{copy}</p>}
    </Reveal>
  );
}

function CtaCard({ image, alt, eyebrow, title, copy, to, cta }) {
  return (
    <div className="surface-panel relative overflow-hidden">
      <div className="overflow-hidden">
        <motion.img
          src={image}
          alt={alt}
          loading="lazy"
          width={1200}
          height={800}
          className="h-44 w-full object-cover opacity-70"
          initial={{ scale: 1.15 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <div className="p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
        <h3 className="mt-2 font-display text-2xl font-bold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{copy}</p>
        <Button variant="hero" className="mt-5" asChild>
          <Link to={to}>{cta}</Link>
        </Button>
      </div>
    </div>
  );
}

export default function Home() {
  const [influencers, setInfluencers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { niches } = useCatalog();
  const { states } = useStates();

  useEffect(() => {
    influencersApi
      .list()
      .then((res) => setInfluencers(res.data || []))
      .catch(() => setInfluencers([]))
      .finally(() => setLoading(false));
  }, []);

  const featured = influencers.slice(0, 6);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background pointer-events-none" />
        <div className="hero-glow absolute inset-0 opacity-50" />
        <FloatingBlob
          className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[image:var(--gradient-mint)] opacity-20 blur-3xl"
          duration={16}
        />
        <FloatingBlob
          className="pointer-events-none absolute -right-16 top-40 h-64 w-64 rounded-full bg-primary/30 opacity-20 blur-3xl"
          duration={12}
          delay={2}
        />
        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground"
            >
              <Sparkles className="size-3.5 text-primary" /> India&rsquo;s creator marketplace
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-5 font-display text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl"
            >
              Drive influence,
              <br />
              <span className="text-gradient">drive results.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mt-5 max-w-lg text-base text-muted-foreground"
            >
              Influbrand helps brands and agencies partner with Indian creators across fashion,
              food, tech and more — with measurable engagement, not guesswork.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Button variant="hero" size="lg" asChild>
                <Link to="/signup/brand">
                  Start a campaign <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/influencers">Browse influencers</Link>
              </Button>
            </motion.div>
            <motion.dl
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="mt-10 grid max-w-md grid-cols-3 gap-6"
            >
              <Metric value={875} suffix="+" label="Collaborations" />
              <Metric value={6.0} suffix="K+" label="Creators" />
              <Metric value={18} suffix="" label="Cities" />
            </motion.dl>
          </motion.div>

          <Parallax speed={0.15} className="relative">
            <motion.div
              className="absolute -inset-6 rounded-[3rem] bg-[image:var(--gradient-mint)] opacity-20 blur-3xl"
              animate={{ opacity: [0.15, 0.28, 0.15] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.img
              src={heroImage}
              alt="Indian content creator filming a brand campaign video"
              width={1200}
              height={1408}
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full rounded-[2rem] border border-border object-cover shadow-[var(--shadow-glow)]"
            />
          </Parallax>
        </div>
      </section>

      {/* As seen in / trusted by strip */}
      <section className="border-b border-border/60 bg-muted/20 overflow-hidden relative">
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-muted/20 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-muted/20 to-transparent z-10 pointer-events-none" />
        <div className="py-10">
          <Reveal>
            <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-primary/80 mb-8">
              Trusted by top brands across India
            </p>
          </Reveal>
          <div className="relative flex w-[200%] overflow-hidden">
            <motion.div 
              className="flex items-center justify-around gap-16 whitespace-nowrap min-w-full shrink-0"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ repeat: Infinity, ease: "linear", duration: 20 }}
            >
               {[...BRAND_STRIP, ...BRAND_STRIP, ...BRAND_STRIP, ...BRAND_STRIP].map((brand, i) => (
                  <span key={i} className="font-display text-2xl md:text-3xl font-extrabold text-muted-foreground/30 hover:text-primary/70 transition-colors cursor-default">
                    {brand}
                  </span>
               ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <SectionHeading
          eyebrow="How it works"
          title="Launch a campaign in 4 steps"
          copy="From brief to published content, every stage lives in one dashboard."
        />
        <RevealGroup className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" stagger={0.1}>
          {STEPS.map((step, i) => (
            <RevealItem key={step.title}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ duration: 0.25 }}
                className="surface-panel h-full p-6"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[image:var(--gradient-mint)] text-primary-foreground">
                  <step.icon className="size-5" />
                </div>
                <p className="text-xs font-semibold text-primary">Step {i + 1}</p>
                <h3 className="mt-1 font-display text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.copy}</p>
              </motion.div>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      {/* Featured creators */}
      <section className="border-y border-border/60 bg-[image:var(--gradient-deep)]">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
          <SectionHeading
            eyebrow="Top creators"
            title="Micro-influencers in India"
            copy="A snapshot of creators currently accepting brand collaborations."
          />
          {loading ? (
            <p className="mt-10 text-sm text-muted-foreground">Loading creators…</p>
          ) : (
            <RevealGroup className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
              {featured.map((influencer) => (
                <RevealItem key={influencer.id || influencer._id} scale>
                  <InfluencerCard influencer={influencer} actionLabel="View" />
                </RevealItem>
              ))}
            </RevealGroup>
          )}
          <Reveal className="mt-10 text-center">
            <Button variant="hero" size="lg" asChild>
              <Link to="/influencers">
                See all influencers <ArrowRight className="size-4" />
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <SectionHeading
          eyebrow="Testimonials"
          title="Brands that grew with Influbrand"
          copy="A few words from marketing teams who launched campaigns on the platform."
        />
        <RevealGroup className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
          {TESTIMONIALS.map((t) => (
            <RevealItem key={t.name}>
              <motion.div whileHover={{ y: -4 }} className="surface-panel h-full p-6">
                <p className="text-sm text-foreground/90">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-5 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[image:var(--gradient-mint)] font-display text-xs font-bold text-primary-foreground">
                    {t.name.split(" ").map((n) => n[0]).join("")}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      {/* Services */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <SectionHeading
          eyebrow="Services"
          title="Bespoke influencer marketing"
          copy="Pick a single collaboration or a fully managed always-on programme."
        />
        <RevealGroup className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" stagger={0.08}>
          {SERVICES.map((service) => (
            <RevealItem key={service.title}>
              <motion.div whileHover={{ y: -6 }} className="surface-panel h-full p-6">
                <service.icon className="size-6 text-primary" />
                <h3 className="mt-4 font-display text-lg font-semibold">{service.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{service.copy}</p>
              </motion.div>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      {/* Categories & cities */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6">
        <Reveal className="surface-panel p-8" scale>
          <h2 className="font-display text-2xl font-bold">Business segments and categories</h2>
          <div className="mt-6 flex flex-wrap gap-2">
            {niches.map((n, i) => (
              <motion.div
                key={n._id || n.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.02 }}
              >
                <Link
                  to={`/influencers?niche=${encodeURIComponent(n._id || n.id)}`}
                  className="rounded-full border border-border bg-muted/30 px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
                >
                  {n.name}
                </Link>
              </motion.div>
            ))}
          </div>
          <h3 className="mt-10 font-display text-xl font-semibold">Creators by state</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {states.map((s, i) => (
              <motion.div
                key={s.code}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.02 }}
              >
                <Link
                  to={`/influencers?state=${encodeURIComponent(s.code)}`}
                  className="rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
                >
                  {s.name}
                </Link>
              </motion.div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Dual CTA */}
      <RevealGroup className="mx-auto grid w-full max-w-7xl gap-5 px-4 pb-16 sm:px-6 md:grid-cols-2" stagger={0.12}>
        <RevealItem direction="left">
          <CtaCard
            image={ctaInfluencer}
            alt="Travel creator filming content in India"
            eyebrow="For creators"
            title="Turn your audience into income"
            copy="Join Influbrand to receive paid collaborations from brands in your niche."
            to="/signup/influencer"
            cta="Sign up as an influencer"
          />
        </RevealItem>
        <RevealItem direction="right">
          <CtaCard
            image={ctaBrand}
            alt="Beauty products styled for a brand campaign"
            eyebrow="For brands"
            title="Your next campaign starts here"
            copy="Shortlist creators, send offers and track deliverables in one place."
            to="/signup/brand"
            cta="Start a campaign"
          />
        </RevealItem>
      </RevealGroup>

      {/* FAQ */}
      <section className="mx-auto w-full max-w-3xl px-4 pb-20 sm:px-6">
        <SectionHeading eyebrow="FAQ" title="Frequently asked questions" />
        <Accordion type="single" collapsible className="mt-8">
          {FAQS.map((faq, i) => (
            <Reveal key={faq.q} delay={i * 0.05}>
              <AccordionItem value={faq.q} className="surface-panel mb-3 px-5">
                <AccordionTrigger className="text-left font-display text-base">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            </Reveal>
          ))}
        </Accordion>
      </section>
    </>
  );
}
