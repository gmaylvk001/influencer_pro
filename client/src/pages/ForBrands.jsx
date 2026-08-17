import { Link } from "react-router";
import { motion } from "framer-motion";
import { BarChart3, Handshake, Rocket, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { FloatingBlob } from "@/components/motion/Parallax";
import ctaBrand from "@/assets/cta-brand.jpg";

const BENEFITS = [
  { icon: ShieldCheck, title: "Vetted creators", copy: "Verified profiles with real engagement." },
  { icon: Handshake, title: "Managed offers", copy: "Negotiate and confirm in one thread." },
  { icon: BarChart3, title: "Clear reporting", copy: "Reach, engagement and cost per engagement." },
  { icon: Rocket, title: "Fast turnaround", copy: "Most campaigns go live within a week." },
];

export default function ForBrands() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="hero-glow absolute inset-0" />
        <FloatingBlob
          className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-primary/30 opacity-20 blur-3xl"
          duration={15}
        />
        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="font-display text-4xl font-extrabold sm:text-5xl">
              Influencer marketing that <span className="text-gradient">actually converts</span>
            </h1>
            <p className="mt-4 max-w-lg text-sm text-muted-foreground">
              Influbrand gives your team a single workspace to discover Indian creators, negotiate
              deliverables and measure the outcome of every collaboration.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="hero" size="lg" asChild>
                <Link to="/signup/brand">Create a brand account</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/influencers">Browse the directory</Link>
              </Button>
            </div>
          </motion.div>
          <motion.img
            src={ctaBrand}
            alt="Beauty products styled for an influencer brand campaign"
            loading="lazy"
            width={1200}
            height={800}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="w-full rounded-[2rem] border border-border object-cover"
          />
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" stagger={0.1}>
          {BENEFITS.map((b) => (
            <RevealItem key={b.title}>
              <motion.div whileHover={{ y: -6 }} className="surface-panel h-full p-6">
                <b.icon className="size-6 text-primary" />
                <h2 className="mt-4 font-display text-lg font-semibold">{b.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{b.copy}</p>
              </motion.div>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>
    </>
  );
}
