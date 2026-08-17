import { useEffect, useState } from "react";
import { Users, Building2, UserCircle2, Target, CreditCard, Activity } from "lucide-react";
import { admin } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';

function StatCard({ title, value, icon: Icon, colorClass, gradientClass }) {
  return (
    <div className="surface-panel-hover p-6 rounded-2xl flex flex-col justify-between h-40 bg-card border border-border transition-all hover:shadow-lg">
      <div className="flex justify-between items-start">
        <div className={`p-3 rounded-xl ${colorClass}`}>
          <Icon className="size-6" />
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
        <p className={`font-display text-4xl font-bold mt-1 bg-clip-text text-transparent ${gradientClass}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { accountType } = useAuth();
  const [stats, setStats] = useState(null);
  const [historical, setHistorical] = useState(null);
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (accountType === "admin") {
      Promise.all([
        admin.getStats(),
        admin.getHistoricalStats(),
        admin.getActivity()
      ])
        .then(([sData, hData, aData]) => {
          setStats(sData);
          setHistorical(hData);
          setActivity(aData);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [accountType]);

  if (accountType !== "admin") {
    return (
      <div className="surface-panel p-12 text-center">
        <p className="font-display text-lg">Admins only</p>
      </div>
    );
  }

  // Format historical data for charts, filling in missing days with 0
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split('T')[0];
  });

  const userMap = new Map(historical?.userGrowth?.map(i => [i._id, i.count]) || []);
  const revMap = new Map(historical?.revenueGrowth?.map(i => [i._id, i.revenue]) || []);

  const userGrowthData = last30Days.map(date => {
    const d = new Date(date);
    return {
      date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      Users: userMap.get(date) || 0
    };
  });

  const revenueGrowthData = last30Days.map(date => {
    const d = new Date(date);
    return {
      date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      Revenue: revMap.get(date) || 0
    };
  });

  const userDistributionData = stats ? [
    { name: 'Influencers', value: stats.totalInfluencers, color: '#f97316' },
    { name: 'Brands', value: stats.totalBrands, color: '#3b82f6' }
  ] : [];

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h2 className="font-display text-3xl font-bold tracking-tight">Platform Overview</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Real-time metrics and health of the InfluBrand platform.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 rounded-2xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard 
              title="Total Users" 
              value={stats.totalUsers} 
              icon={Users} 
              colorClass="bg-primary/20 text-primary"
              gradientClass="bg-gradient-to-r from-primary to-primary/80"
            />
            <StatCard 
              title="Active Campaigns" 
              value={stats.activeCampaigns} 
              icon={Target} 
              colorClass="bg-amber-500/20 text-amber-500"
              gradientClass="bg-gradient-to-r from-amber-500 to-amber-400"
            />
            <StatCard 
              title="Campaign Volume" 
              value={`₹${stats.totalCampaignVolume?.toLocaleString() || 0}`} 
              icon={Target} 
              colorClass="bg-purple-500/20 text-purple-500"
              gradientClass="bg-gradient-to-r from-purple-500 to-purple-400"
            />
            <StatCard 
              title="Package Purchase Rev" 
              value={`₹${stats.totalPackageRevenue?.toLocaleString() || 0}`} 
              icon={CreditCard} 
              colorClass="bg-green-500/20 text-green-500"
              gradientClass="bg-gradient-to-r from-green-500 to-green-400"
            />
            <StatCard 
              title="Total Brands" 
              value={stats.totalBrands} 
              icon={Building2} 
              colorClass="bg-blue-500/20 text-blue-500"
              gradientClass="bg-gradient-to-r from-blue-500 to-blue-400"
            />
            <StatCard 
              title="Total Influencers" 
              value={stats.totalInfluencers} 
              icon={UserCircle2} 
              colorClass="bg-orange-500/20 text-orange-500"
              gradientClass="bg-gradient-to-r from-orange-500 to-orange-400"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            {/* User Growth Chart */}
            <div className="surface-panel p-6 rounded-2xl border border-border shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold">User Growth</h3>
                  <p className="text-sm text-muted-foreground">New signups over 30 days.</p>
                </div>
                <div className="p-2 bg-primary/10 text-primary rounded-lg"><Users className="size-5" /></div>
              </div>
              <div className="h-[300px] w-full">
                {userGrowthData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={userGrowthData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                      <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} dy={10} minTickGap={20} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                        cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 2, strokeDasharray: '4 4' }}
                      />
                      <Area type="natural" dataKey="Users" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" activeDot={{ r: 6, strokeWidth: 0, fill: 'hsl(var(--primary))' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl">
                    Not enough data
                  </div>
                )}
              </div>
            </div>

            {/* Revenue Chart */}
            <div className="surface-panel p-6 rounded-2xl border border-border shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold">Revenue Growth</h3>
                  <p className="text-sm text-muted-foreground">Connects purchased over 30 days.</p>
                </div>
                <div className="p-2 bg-green-500/10 text-green-500 rounded-lg"><CreditCard className="size-5" /></div>
              </div>
              <div className="h-[300px] w-full">
                {revenueGrowthData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueGrowthData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} dy={10} minTickGap={20} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} dx={-10} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                        cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 2, strokeDasharray: '4 4' }}
                      />
                      <Area type="natural" dataKey="Revenue" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" activeDot={{ r: 6, strokeWidth: 0, fill: '#22c55e' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl">
                    Not enough data
                  </div>
                )}
              </div>
            </div>

            {/* User Distribution Chart */}
            <div className="surface-panel p-6 rounded-2xl border border-border shadow-sm lg:col-span-2">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold">User Distribution</h3>
                  <p className="text-sm text-muted-foreground">Breakdown of account types on InfluBrand.</p>
                </div>
              </div>
              <div className="h-[300px] w-full flex items-center justify-center">
                {userDistributionData.length > 0 && (stats.totalInfluencers > 0 || stats.totalBrands > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={userDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={90}
                        outerRadius={120}
                        paddingAngle={8}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={12}
                      >
                        {userDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        align="center" 
                        layout="horizontal" 
                        iconType="circle"
                        wrapperStyle={{ paddingTop: '20px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl">
                    No users yet
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Activity Feed Section */}
          <div className="mt-8 surface-panel p-6 rounded-2xl border border-border">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold">Recent Activity</h3>
                <p className="text-sm text-muted-foreground">Live feed of what's happening across InfluBrand.</p>
              </div>
              <Activity className="size-5 text-muted-foreground" />
            </div>
            
            <div className="space-y-4">
              {!activity || activity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No recent activity to display.</p>
              ) : (
                activity.map((item, index) => {
                  let Icon = Activity;
                  let color = "text-muted-foreground bg-muted/50";
                  let title = "";
                  let description = "";

                  if (item.type === "user_signup") {
                    Icon = Users;
                    color = "text-blue-500 bg-blue-500/10 border-blue-500/20";
                    title = "New User Signup";
                    description = `${item.data.fullName || item.data.email} joined as a ${item.data.accountType}`;
                  } else if (item.type === "campaign_created") {
                    Icon = Target;
                    color = "text-purple-500 bg-purple-500/10 border-purple-500/20";
                    title = "New Campaign Created";
                    description = `${item.data.brandId?.companyName || item.data.brandName || 'A brand'} created campaign: "${item.data.title}"`;
                  } else if (item.type === "transaction") {
                    Icon = CreditCard;
                    color = "text-green-500 bg-green-500/10 border-green-500/20";
                    title = "New Transaction";
                    description = `${item.data.brandId?.companyName || 'A brand'} purchased ₹${item.data.amount || item.data.amountInr || 0}`;
                  }

                  return (
                    <div key={index} className="flex items-start gap-4 p-4 rounded-xl hover:bg-muted/30 transition-colors border border-transparent hover:border-border">
                      <div className={`p-2.5 rounded-full border ${color} shrink-0`}>
                        <Icon className="size-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{title}</p>
                        <p className="text-sm text-muted-foreground truncate">{description}</p>
                      </div>
                      <p className="text-xs text-muted-foreground shrink-0 mt-0.5 whitespace-nowrap">
                        {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center text-muted-foreground p-12 surface-panel">
          Failed to load stats.
        </div>
      )}
    </div>
  );
}
