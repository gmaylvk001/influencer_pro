import { useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { contact as contactApi } from "@/lib/api";

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await contactApi.submit({
        name: form.get("name"),
        email: form.get("email"),
        message: form.get("message"),
      });
      setSent(true);
      toast.success("Thanks! Our team will get back to you within one business day.");
    } catch (err) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative overflow-hidden">
      <div className="hero-glow absolute inset-0" />
      <div className="relative mx-auto grid w-full max-w-5xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.2fr]">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Let&rsquo;s talk</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Tell us about your brand and we&rsquo;ll send a curated shortlist of creators for your
            category and budget.
          </p>
          <ul className="mt-8 space-y-4 text-sm text-muted-foreground">
            {[
              { icon: Mail, text: "hello@influbrand.in" },
              { icon: Phone, text: "+91 98300 00000" },
              { icon: MapPin, text: "Kolkata, India" },
            ].map((item, i) => (
              <motion.li
                key={item.text}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <item.icon className="size-4 text-primary" /> {item.text}
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="surface-panel space-y-4 p-8"
          onSubmit={handleSubmit}
        >
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-10 text-center"
              >
                <p className="font-display text-lg font-semibold">Message sent</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  We'll get back to you within one business day.
                </p>
              </motion.div>
            ) : (
              <motion.div key="form" exit={{ opacity: 0 }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" required maxLength={100} placeholder="Your name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cemail">Email</Label>
                  <Input id="cemail" name="email" type="email" required maxLength={255} placeholder="you@brand.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="msg">How can we help?</Label>
                  <Textarea id="msg" name="message" required maxLength={1000} rows={5} placeholder="Tell us about your campaign" />
                </div>
                <Button variant="hero" className="w-full" type="submit" disabled={busy}>
                  {busy ? "Sending…" : "Send message"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.form>
      </div>
    </main>
  );
}
