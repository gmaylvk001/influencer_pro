import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Search, Loader2, Download, ArrowUpRight, CheckCircle2, Clock, ChevronLeft, ChevronRight, Check, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { admin } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

function EmptyRow({ colSpan, message }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-24 text-center text-muted-foreground">
        <div className="flex flex-col items-center">
          <ArrowUpRight className="size-12 opacity-20 mb-4" />
          <p>{message}</p>
        </div>
      </td>
    </tr>
  );
}

export default function AdminTransactions() {
  const { accountType } = useAuth();
  
  // Tabs: "ledger", "withdrawals", "disputes"
  const [activeTab, setActiveTab] = useState("ledger");
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [busyId, setBusyId] = useState(null);

  function load() {
    setLoading(true);
    let promise;
    
    if (activeTab === "ledger") {
      promise = admin.getTransactions({ search, page });
    } else if (activeTab === "withdrawals") {
      promise = admin.getWithdrawals({ page }); // omitting search for brevity
    } else if (activeTab === "disputes") {
      promise = admin.getDisputes({ page });
    }

    promise
      .then((data) => {
        if (activeTab === "ledger") {
          setItems(data.transactions || []);
        } else if (activeTab === "withdrawals") {
          setItems(data.withdrawals || []);
        } else if (activeTab === "disputes") {
          setItems(data.disputes || []);
        }
        setTotalPages(data.totalPages || 1);
        setTotalItems(data.total || 0);
      })
      .catch((err) => {
        toast.error("Failed to load data.");
        console.error(err);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (accountType === "admin") {
      const timer = setTimeout(load, 300);
      return () => clearTimeout(timer);
    }
  }, [accountType, search, page, activeTab]);

  useEffect(() => {
    setPage(1);
  }, [search, activeTab]);

  if (accountType !== "admin") return null;

  async function handleWithdrawalAction(id, status) {
    setBusyId(id);
    try {
      await admin.updateWithdrawalStatus(id, { status });
      toast.success(`Withdrawal marked as ${status}`);
      load();
    } catch(err) {
      toast.error("Failed to update withdrawal.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDisputeAction(id, status) {
    setBusyId(id);
    try {
      await admin.updateDisputeStatus(id, { status });
      toast.success(`Dispute marked as ${status}`);
      load();
    } catch(err) {
      toast.error("Failed to update dispute.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8 pb-32">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">Financials & Admin Tools</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage ledger, influencer withdrawals, and campaign disputes.
          </p>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          {activeTab === "ledger" && (
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by brand name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-card"
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-4 border-b border-border/50 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("ledger")}
          className={`px-4 py-2 font-semibold text-sm transition-colors rounded-t-lg border-b-2 ${
            activeTab === "ledger" ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Transaction Ledger
        </button>
        <button
          onClick={() => setActiveTab("withdrawals")}
          className={`px-4 py-2 font-semibold text-sm transition-colors rounded-t-lg border-b-2 ${
            activeTab === "withdrawals" ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Withdrawal Requests
        </button>
        <button
          onClick={() => setActiveTab("disputes")}
          className={`px-4 py-2 font-semibold text-sm transition-colors rounded-t-lg border-b-2 ${
            activeTab === "disputes" ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Disputes
        </button>
      </div>

      <div className="surface-panel overflow-hidden border border-border/50 shadow-sm relative">
        <div className="absolute inset-0 bg-gradient-to-b from-card/50 to-transparent pointer-events-none" />
        <div className="overflow-x-auto min-h-[400px] relative z-10">
          <table className="w-full text-left text-sm">
            
            {/* LEDGER HEADER */}
            {activeTab === "ledger" && (
              <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground sticky top-0 backdrop-blur-md">
                <tr>
                  <th className="px-6 py-4">Transaction ID</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Brand</th>
                  <th className="px-6 py-4">Item Details</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
            )}

            {/* WITHDRAWALS HEADER */}
            {activeTab === "withdrawals" && (
              <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground sticky top-0 backdrop-blur-md">
                <tr>
                  <th className="px-6 py-4">Request ID</th>
                  <th className="px-6 py-4">Influencer</th>
                  <th className="px-6 py-4">Payment Details</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
            )}

            {/* DISPUTES HEADER */}
            {activeTab === "disputes" && (
              <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground sticky top-0 backdrop-blur-md">
                <tr>
                  <th className="px-6 py-4">Dispute ID</th>
                  <th className="px-6 py-4">Campaign</th>
                  <th className="px-6 py-4">Parties</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Resolution</th>
                </tr>
              </thead>
            )}

            <tbody className="divide-y divide-border/60 bg-card/50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-24 text-center text-muted-foreground">
                    <Loader2 className="mx-auto size-6 animate-spin mb-4 opacity-50" />
                    <p>Loading...</p>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <EmptyRow colSpan={6} message="No records found." />
              ) : (
                items.map((item) => (
                  <tr key={item._id} className="transition-colors hover:bg-muted/50 group align-top">
                    
                    {/* LEDGER ROW */}
                    {activeTab === "ledger" && (
                      <>
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs text-muted-foreground">{item._id}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium">{new Date(item.createdAt).toLocaleDateString()}</p>
                          <p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleTimeString()}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {item.brandId?.logoUrl ? (
                              <img src={item.brandId.logoUrl} alt="" className="size-6 rounded-full object-cover" />
                            ) : (
                              <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">
                                {(item.brandId?.companyName || "B").charAt(0).toUpperCase()}
                              </div>
                            )}
                            <p className="font-semibold text-sm">{item.brandId?.companyName || "Unknown"}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground">
                            {item.title || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-base text-foreground">₹{item.amount}</span>
                        </td>
                        <td className="px-6 py-4">
                          {item.status === 'cleared' ? (
                            <span className="inline-flex items-center gap-1.5 text-green-500 font-semibold text-sm">
                              <CheckCircle2 className="size-4" /> Cleared
                            </span>
                          ) : item.status === 'withdrawn' ? (
                            <span className="inline-flex items-center gap-1.5 text-blue-500 font-semibold text-sm">
                              <CheckCircle2 className="size-4" /> Withdrawn
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-yellow-500 font-semibold text-sm capitalize">
                              <Clock className="size-4" /> {item.status}
                            </span>
                          )}
                        </td>
                      </>
                    )}

                    {/* WITHDRAWALS ROW */}
                    {activeTab === "withdrawals" && (
                      <>
                        <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{item._id}</td>
                        <td className="px-6 py-4 font-medium">{item.influencerId?.name}</td>
                        <td className="px-6 py-4">
                          <pre className="text-xs text-muted-foreground bg-muted p-2 rounded max-w-[200px] overflow-hidden">
                            {JSON.stringify(item.paymentMethodDetails, null, 2)}
                          </pre>
                        </td>
                        <td className="px-6 py-4 font-bold text-primary">₹{item.amount}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            item.status === "pending" ? "bg-yellow-500/10 text-yellow-500" :
                            item.status === "processed" ? "bg-green-500/10 text-green-500" :
                            "bg-red-500/10 text-red-500"
                          }`}>
                            {item.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {item.status === "pending" && (
                            <div className="flex gap-2 justify-end">
                              <Button size="sm" variant="hero" disabled={busyId === item._id} onClick={() => handleWithdrawalAction(item._id, "processed")}>
                                Mark Processed
                              </Button>
                              <Button size="sm" variant="destructive" disabled={busyId === item._id} onClick={() => handleWithdrawalAction(item._id, "rejected")}>
                                Reject
                              </Button>
                            </div>
                          )}
                        </td>
                      </>
                    )}

                    {/* DISPUTES ROW */}
                    {activeTab === "disputes" && (
                      <>
                        <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{item._id}</td>
                        <td className="px-6 py-4 font-medium">{item.campaignId?.title}</td>
                        <td className="px-6 py-4">
                          <div className="text-xs">
                            <span className="font-semibold">Brand:</span> {item.brandId?.companyName}<br/>
                            <span className="font-semibold">Influencer:</span> {item.influencerId?.name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-block px-2 py-1 bg-red-500/10 text-red-500 rounded text-xs font-semibold mb-1">
                            Opened by {item.openedBy}
                          </span>
                          <p className="text-xs mt-1 text-muted-foreground max-w-[250px] whitespace-normal">
                            {item.reason}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            item.status === "open" ? "bg-red-500/10 text-red-500" :
                            item.status === "under_review" ? "bg-yellow-500/10 text-yellow-500" :
                            "bg-green-500/10 text-green-500"
                          }`}>
                            {item.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {item.status !== "resolved_brand" && item.status !== "resolved_influencer" && item.status !== "cancelled" && (
                            <div className="flex flex-col gap-2 items-end">
                              {item.status === "open" && (
                                <Button size="sm" variant="outline" disabled={busyId === item._id} onClick={() => handleDisputeAction(item._id, "under_review")}>
                                  Start Review
                                </Button>
                              )}
                              <Button size="sm" variant="hero" className="bg-green-600 w-full" disabled={busyId === item._id} onClick={() => handleDisputeAction(item._id, "resolved_influencer")}>
                                Favor Influencer
                              </Button>
                              <Button size="sm" variant="hero" className="bg-blue-600 w-full" disabled={busyId === item._id} onClick={() => handleDisputeAction(item._id, "resolved_brand")}>
                                Favor Brand
                              </Button>
                            </div>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            Showing page {page} of {totalPages} <span className="hidden sm:inline">({totalItems} total items)</span>
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="gap-1"
            >
              <ChevronLeft className="size-4" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="gap-1"
            >
              Next <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
