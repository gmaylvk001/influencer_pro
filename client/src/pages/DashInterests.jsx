import { useState, useEffect } from "react";
import { shortlists } from "@/lib/api";

function EmptyRow({ colSpan, message }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-12 text-center text-sm text-muted-foreground">
        {message}
      </td>
    </tr>
  );
}

export default function DashInterests() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    shortlists
      .list()
      .then((data) => setRows(data.filter((r) => r.kind === "shortlist")))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="surface-panel overflow-hidden">
      <div className="border-b border-border px-6 py-5">
        <h2 className="font-display text-lg font-bold text-primary">Profile Interests</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Brands who have shown interest in your profile
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground bg-muted/30">
              <th className="px-6 py-3 font-semibold">#</th>
              <th className="px-6 py-3 font-semibold">Brand Info</th>
              <th className="px-6 py-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <EmptyRow colSpan={3} message="Loading…" />
            ) : rows.length === 0 ? (
              <EmptyRow colSpan={3} message="No Record(s)" />
            ) : (
              rows.map((row, i) => (
                <tr key={row._id} className="border-b border-border/60 last:border-0 transition-colors hover:bg-muted/20">
                  <td className="px-6 py-4 text-muted-foreground">{i + 1}</td>
                  <td className="px-6 py-4 font-medium">
                    {row.brandId?.companyName || "Unknown Brand"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground px-2 py-1 bg-muted/50 rounded">Viewed</span>
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
