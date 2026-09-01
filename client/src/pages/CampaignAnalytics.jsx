import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import api from "../lib/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Users, Eye, Heart, Share2, Award, TrendingUp, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function CampaignAnalytics() {
  const { campaignId } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [sortMetric, setSortMetric] = useState('views');

  useEffect(() => {
    fetchData();
  }, [campaignId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // In a real app we would have a dedicated endpoint for campaign analytics:
      // const res = await api.get(`/campaigns/${campaignId}/analytics`);
      // For now, we'll mock the data fetch or use existing endpoints if they exist.
      const campaignRes = await api.get(`/campaigns/${campaignId}`);
      const partRes = await api.get(`/participants/campaign/${campaignId}`);
      const analyticsRes = await api.get(`/campaigns/${campaignId}/analytics`);
      
      setCampaign(campaignRes.data.campaign || campaignRes.data);
      setParticipants(partRes.data.participants || partRes.data);
      setChartData(analyticsRes.data.chartData || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      toast.info("Syncing Instagram data...");
      await api.post(`/instagram/sync-campaign/${campaignId}`);
      toast.success("Metrics synced successfully");
      fetchData(); // reload
    } catch (err) {
      console.error(err);
      toast.error("Failed to sync metrics");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading Analytics...</div>;
  if (!campaign) return <div className="p-8 text-center text-red-500">Campaign not found</div>;

  // Aggregate metrics
  let totalViews = 0;
  let totalReach = 0;
  let totalEngagement = 0;
  
  participants.forEach(p => {
    if (p.performanceMetrics) {
      totalViews += p.performanceMetrics.views || 0;
      totalReach += p.performanceMetrics.reach || 0;
      totalEngagement += p.performanceMetrics.engagement || 0;
    }
  });

  const avgEngagementRate = totalReach > 0 ? ((totalEngagement / totalReach) * 100).toFixed(2) : 0;

  // Using real chartData from state now

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{campaign.title}</h1>
          <p className="text-gray-500 mt-1">Campaign Analytics Dashboard</p>
        </div>
        <div className="flex space-x-4">
          <button 
            onClick={handleSync} 
            disabled={syncing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 font-medium rounded-lg hover:bg-blue-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync Instagram Metrics'}</span>
          </button>
          <Link to="/dashboard/campaigns" className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition">
            Back to Campaign
          </Link>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full"><Eye className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Views</p>
            <p className="text-2xl font-bold text-gray-900">{totalViews.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-full"><Users className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Reach</p>
            <p className="text-2xl font-bold text-gray-900">{totalReach.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-pink-100 text-pink-600 rounded-full"><Heart className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Engagement</p>
            <p className="text-2xl font-bold text-gray-900">{totalEngagement.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full"><TrendingUp className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Avg Engagement Rate</p>
            <p className="text-2xl font-bold text-gray-900">{avgEngagementRate}%</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Performance Over Time</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} tickFormatter={(val) => `${val/1000}k`} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
              <Legend />
              <Line type="monotone" dataKey="views" stroke="#6366F1" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} name="Total Views" />
              <Line type="monotone" dataKey="reach" stroke="#EC4899" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} name="Total Reach" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Influencer Leaderboard */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Influencer Performance Ranking</h2>
          <select
            value={sortMetric}
            onChange={(e) => setSortMetric(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          >
            <option value="views">Sort by Views</option>
            <option value="reach">Sort by Reach</option>
            <option value="engagement">Sort by Engagement</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-sm font-medium">
              <tr>
                <th className="px-6 py-3 w-20">Rank</th>
                <th className="px-6 py-3">Influencer</th>
                <th className="px-6 py-3">Followers</th>
                <th className="px-6 py-3">Views</th>
                <th className="px-6 py-3">Reach</th>
                <th className="px-6 py-3">Engagement</th>
                <th className="px-6 py-3">Eng. Rate</th>
                <th className="px-6 py-3">Score</th>
                <th className="px-6 py-3">Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {[...participants].sort((a, b) => (b.performanceMetrics?.[sortMetric] || 0) - (a.performanceMetrics?.[sortMetric] || 0)).map((p, idx) => {
                const inf = p.influencerId;
                const metrics = p.performanceMetrics || {};
                const eRate = metrics.reach > 0 ? ((metrics.engagement / metrics.reach) * 100).toFixed(1) : 0;
                
                let rankNum = idx + 1;
                let suffix = "th";
                if (rankNum % 10 === 1 && rankNum % 100 !== 11) suffix = "st";
                else if (rankNum % 10 === 2 && rankNum % 100 !== 12) suffix = "nd";
                else if (rankNum % 10 === 3 && rankNum % 100 !== 13) suffix = "rd";
                
                let rankDisplay = `${rankNum}${suffix}`;
                let rankColor = "text-gray-600";
                
                if (idx === 0) { rankDisplay = "🥇 " + rankDisplay; rankColor = "text-yellow-600"; }
                else if (idx === 1) { rankDisplay = "🥈 " + rankDisplay; rankColor = "text-gray-400"; }
                else if (idx === 2) { rankDisplay = "🥉 " + rankDisplay; rankColor = "text-amber-700"; }
                
                return (
                  <tr key={p._id} className="hover:bg-gray-50 transition">
                    <td className={`px-6 py-4 font-bold ${rankColor} text-base whitespace-nowrap`}>{rankDisplay}</td>
                    <td className="px-6 py-4 flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                        {inf?.avatarUrl ? <img src={inf.avatarUrl} alt="" className="w-full h-full object-cover"/> : <div className="w-full h-full bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold">{inf?.name?.charAt(0)}</div>}
                      </div>
                      <div className="font-medium text-gray-900">{inf?.name}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{inf?.followers?.toLocaleString() || '-'}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{metrics.views?.toLocaleString() || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{metrics.reach?.toLocaleString() || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{metrics.engagement?.toLocaleString() || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{eRate}%</td>
                    <td className="px-6 py-4 font-bold text-indigo-600">{inf?.performanceScore || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        inf?.classification === 'Top Performer' ? 'bg-green-100 text-green-700' :
                        inf?.classification === 'High Performer' ? 'bg-blue-100 text-blue-700' :
                        inf?.classification === 'Average Performer' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {inf?.classification || 'Unclassified'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
