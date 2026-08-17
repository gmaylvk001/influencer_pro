import { useEffect, useState } from "react";
import { connects } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function ConnectWallet() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    connects
      .wallet()
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="surface-panel overflow-hidden">
      <div className="border-b border-border px-6 py-5">
        <h2 className="font-display text-lg font-bold">Connect Wallet</h2>
        <p className="text-sm text-muted-foreground">
          Every connect credited or spent, with a running closing balance.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Description</th>
              <th className="px-6 py-3">Debited</th>
              <th className="px-6 py-3">Credited</th>
              <th className="px-6 py-3">Closing Balance</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                  No record(s)
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-border/60 last:border-0">
                  <td className="px-6 py-4 text-muted-foreground">{formatDate(row.date)}</td>
                  <td className="px-6 py-4">{row.description}</td>
                  <td className="px-6 py-4 text-muted-foreground">{row.debited ?? "—"}</td>
                  <td className="px-6 py-4">
                    {row.credited ? (
                      <span
                        className="inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-bold text-primary-foreground"
                        style={{ background: "var(--gradient-mint)" }}
                      >
                        {row.credited}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-6 py-4 font-semibold">{row.closingBalance}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
