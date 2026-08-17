import { useState, useEffect } from "react";
import { IndianRupee, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, TrendingUp, Wallet, Banknote, BarChart3, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { transactions as transactionsApi } from "@/lib/api";

function StatCard({ title, value, icon: Icon, trend, trendLabel, gradient }) {
  return (
    <div className="surface-panel surface-panel-hover flex flex-col p-6">
      <div className="flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-lg" style={{ background: gradient }}>
          <Icon className="size-6" />
        </div>
        {trend !== null && trend !== undefined && trend !== 0 && (
          <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
            trend > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
          }`}>
            {trend > 0 ? <TrendingUp className="size-3" /> : <ArrowDownRight className="size-3" />}
            {trend > 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h3 className="font-display text-3xl font-bold">₹{(value || 0).toLocaleString('en-IN')}</h3>
      </div>
      {trendLabel && (
        <p className="mt-2 text-xs text-muted-foreground">{trendLabel}</p>
      )}
    </div>
  );
}

export default function DashEarnings() {
  const [withdrawing, setWithdrawing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({ available: 0, pending: 0, lifetime: 0, monthlyGrowth: 0 });
  const [monthlyChart, setMonthlyChart] = useState({ labels: [], data: [] });
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetchEarnings();
  }, []);

  async function fetchEarnings() {
    try {
      setLoading(true);
      const data = await transactionsApi.me();
      setMetrics(data.metrics);
      setMonthlyChart(data.monthlyChart || { labels: [], data: [] });
      setTransactions(data.transactions);
    } catch (err) {
      toast.error("Failed to load earnings data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleWithdraw = async () => {
    setWithdrawing(true);
    try {
      await transactionsApi.withdraw();
      toast.success("Withdrawal requested! Funds will appear in your bank account in 2-3 business days.");
      fetchEarnings();
    } catch (err) {
      toast.error(err.message || "Failed to process withdrawal");
    } finally {
      setWithdrawing(false);
    }
  };

  const maxEarning = Math.max(...monthlyChart.data, 1);
  const hasChartData = monthlyChart.data.some(v => v > 0);

  if (loading) {
    return <div className="py-12 text-center text-sm text-muted-foreground animate-pulse">Loading financial data...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">My Earnings</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your income, pending payouts, and financial health.</p>
        </div>
        <Button variant="hero" size="lg" onClick={handleWithdraw} disabled={withdrawing || metrics.available === 0}>
          <Wallet className="mr-2 size-4" />
          {withdrawing ? "Processing..." : `Withdraw ₹${metrics.available.toLocaleString('en-IN')}`}
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-6 sm:grid-cols-3">
        <StatCard 
          title="Available for Withdrawal" 
          value={metrics.available} 
          icon={Banknote} 
          gradient="var(--gradient-emerald)"
          trendLabel="Ready to transfer to bank"
        />
        <StatCard 
          title="Pending Clearance" 
          value={metrics.pending} 
          icon={Clock} 
          gradient="var(--gradient-sunset)"
          trendLabel="Expected to clear in 3-5 days"
        />
        <StatCard 
          title="Lifetime Earnings" 
          value={metrics.lifetime} 
          icon={IndianRupee} 
          trend={metrics.monthlyGrowth}
          gradient="var(--gradient-amethyst)"
          trendLabel="vs last month"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Earnings Chart — Recharts integration */}
        <div className="surface-panel lg:col-span-2 p-6 flex flex-col rounded-3xl border border-border/50">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-display text-lg font-bold flex items-center gap-2">
              <Activity className="size-5 text-primary" />
              Earnings Overview (Last 6 Months)
            </h3>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <span className="flex items-center gap-1"><div className="size-2 rounded-full bg-primary" /> Earnings</span>
            </div>
          </div>
          {hasChartData ? (
            <div className="flex-1 w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChart.labels.map((label, i) => ({ name: label, amount: monthlyChart.data[i] }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickFormatter={(value) => `₹${value}`}
                    width={60}
                  />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted)/0.4)' }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-card border border-border shadow-xl rounded-xl p-3">
                            <p className="font-semibold text-xs text-muted-foreground mb-1 uppercase">{label}</p>
                            <p className="font-display font-bold text-lg text-primary">₹{payload[0].value.toLocaleString('en-IN')}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={50}>
                    {
                      monthlyChart.data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`url(#colorGradient)`} />
                      ))
                    }
                  </Bar>
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <BarChart3 className="size-10 opacity-20 mb-3" />
              <p className="text-sm">No earnings data yet. Your chart will populate as you complete collaborations.</p>
            </div>
          )}
        </div>

        {/* Transaction History */}
        <div className="surface-panel flex flex-col overflow-hidden">
          <div className="border-b border-border p-5 bg-muted/20 flex items-center justify-between">
            <h3 className="font-display font-semibold">Recent Transactions</h3>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[400px]">
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No transactions yet. Start collaborating!
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {transactions.map((tx) => (
                  <div key={tx._id} className="flex items-start justify-between p-4 transition-colors hover:bg-muted/30">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full ${tx.status === 'cleared' || tx.status === 'withdrawn' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                        {tx.status === 'cleared' || tx.status === 'withdrawn' ? <ArrowUpRight className="size-4" /> : <Clock className="size-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{tx.title}</p>
                        <p className="text-xs text-muted-foreground">{tx.brandId?.companyName || "Unknown Brand"} • {new Date(tx.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">₹{tx.amount.toLocaleString('en-IN')}</p>
                      <p className={`text-[10px] font-semibold uppercase tracking-wider ${tx.status === 'cleared' || tx.status === 'withdrawn' ? 'text-green-500' : 'text-yellow-500'}`}>
                        {tx.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

