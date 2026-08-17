import { useEffect, useState } from "react";
import { campaigns as campaignsApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";

const PACKAGES = {
  option3: { label: "Starter", price: 0 },
  option2: { label: "Growth", price: 16999 },
  option1: { label: "Scale", price: 24999 }
};

export default function PackagePurchaseHistory() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    campaignsApi.list()
      .then((data) => {
        // Only show campaigns where a package was selected
        const packagesBought = data
          .filter(c => c.packageSelected)
          .map(c => {
            const pkgInfo = PACKAGES[c.packageSelected] || { label: "Custom Package", price: 0 };
            return {
              id: c._id,
              date: c.createdAt,
              campaignTitle: c.title,
              packageLabel: pkgInfo.label,
              amountInr: pkgInfo.price,
              status: c.status
            };
          });
        setRows(packagesBought);
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="surface-panel overflow-hidden">
      <div className="border-b border-border px-6 py-5">
        <h2 className="font-display text-lg font-bold">Package Purchase History</h2>
        <p className="text-sm text-muted-foreground">A record of every campaign package purchase made on your account.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-6 py-3">#</th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Campaign</th>
              <th className="px-6 py-3">Package</th>
              <th className="px-6 py-3">Amount</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                  No record(s)
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={row.id} className="border-b border-border/60 last:border-0">
                  <td className="px-6 py-4 text-muted-foreground">{i + 1}</td>
                  <td className="px-6 py-4 text-muted-foreground">{formatDate(row.date)}</td>
                  <td className="px-6 py-4 font-medium">{row.campaignTitle}</td>
                  <td className="px-6 py-4">{row.packageLabel}</td>
                  <td className="px-6 py-4 font-semibold">{row.amountInr === 0 ? "Free" : `₹${row.amountInr.toLocaleString('en-IN')}`}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold capitalize text-primary">
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
