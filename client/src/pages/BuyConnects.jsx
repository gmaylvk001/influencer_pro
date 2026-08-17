import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Zap, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { connects } from "@/lib/api";
import { formatInr } from "@/lib/utils";

export default function BuyConnects() {
  const [packages, setPackages] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buyingKey, setBuyingKey] = useState(null);

  useEffect(() => {
    connects
      .packages()
      .then((data) => {
        setPackages(data.packages);
        setBalance(data.connectBalance);
      })
      .catch(() => toast.error("Couldn't load connect packages."))
      .finally(() => setLoading(false));
  }, []);

  async function buy(pkg) {
    setBuyingKey(pkg.key);
    try {
      const { connectBalance } = await connects.purchase(pkg.key);
      setBalance(connectBalance);
      toast.success(`${pkg.connects} connects added to your wallet.`);
    } catch (err) {
      toast.error(err.message || "Purchase failed. Try again.");
    } finally {
      setBuyingKey(null);
    }
  }

  return (
    <div className="surface-panel overflow-hidden">
      <div className="border-b border-border px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold">Connect Packages</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Connects let you unlock the contact details of influencers who've applied to your
              campaigns, so you can reach out directly — no middleman.
            </p>
          </div>
          {balance !== null && (
            <span className="rounded-full border border-border bg-muted/50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
              Balance: {balance}
            </span>
          )}
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading packages…</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {packages.map((pkg) => (
              <div
                key={pkg.key}
                className={`surface-panel surface-panel-hover relative flex flex-col overflow-hidden ${
                  pkg.bestValue ? "border-[color:var(--gold)]/60" : ""
                }`}
              >
                {pkg.bestValue && (
                  <span
                    className="absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gold-foreground"
                    style={{ background: "var(--gradient-gold)" }}
                  >
                    Best Value
                  </span>
                )}
                <div className="flex flex-1 flex-col items-center gap-1 px-6 pb-5 pt-8 text-center">
                  <p className="font-display text-5xl font-bold">{pkg.connects}</p>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Connects
                  </p>
                </div>
                <div
                  className="px-6 py-3 text-center font-display text-lg font-bold text-primary-foreground"
                  style={{ background: "var(--gradient-mint)" }}
                >
                  {formatInr(pkg.priceInr)}
                </div>
                <div className="flex flex-col items-center gap-4 px-6 py-5">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Check className="size-3.5 text-primary" />
                    Valid for lifetime
                  </p>
                  <Button
                    variant={pkg.bestValue ? "hero" : "outline"}
                    className="w-full"
                    disabled={buyingKey !== null}
                    onClick={() => buy(pkg)}
                  >
                    <Zap className="size-4" />
                    {buyingKey === pkg.key ? "Processing…" : "Buy Now"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
