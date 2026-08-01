import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Briefcase,
  FolderKanban,
  Heart,
  Loader2,
  AlertCircle,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
} from "recharts";
import axios from "axios";
import { API } from "../../lib/config";
import { useAuthStore } from "../../store/authStore";
import { useTranslation } from "react-i18next";
import StatsCard from "../../components/admin/StatsCard";

const CHART_COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c084fc", "#e879f9", "#f472b6", "#fb923c"];

const AdminDashboard = () => {
  const { token } = useAuthStore();
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await axios.get(`${API}/careers/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(data);
      } catch (err) {
        setError(t("admin.dashboard.loading_error"));
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-white/50">{error}</p>
        </div>
      </div>
    );
  }

  // Pie chart data from topLiked
  const pieData = stats?.topLiked?.map((c, i) => ({
    name: c.name?.length > 18 ? c.name.substring(0, 18) + "…" : c.name,
    value: c.likesCount || 0,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  })) || [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
        <p className="text-xs font-semibold text-white mb-1">{payload[0]?.payload?.name || label}</p>
        <p className="text-sm font-bold text-indigo-400">{payload[0]?.value}</p>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          {t("admin.dashboard.title")}
        </h1>
        <p className="text-sm text-white/30 mt-1">{t("admin.dashboard.subtitle")}</p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={Users}
          label={t("admin.dashboard.users")}
          value={stats?.totalUsers ?? 0}
          color="text-blue-400"
          bg="bg-blue-500/10"
          delay={0}
        />
        <StatsCard
          icon={Briefcase}
          label={t("admin.dashboard.careers")}
          value={stats?.totalCareers ?? 0}
          color="text-indigo-400"
          bg="bg-indigo-500/10"
          delay={0.05}
        />
        <StatsCard
          icon={FolderKanban}
          label={t("admin.dashboard.clusters")}
          value={stats?.totalClusters ?? 0}
          color="text-purple-400"
          bg="bg-purple-500/10"
          delay={0.1}
        />
        <StatsCard
          icon={Heart}
          label={t("admin.dashboard.likes")}
          value={stats?.totalLikes ?? 0}
          color="text-rose-400"
          bg="bg-rose-500/10"
          delay={0.15}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Liked — Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#0f172a]/60 border border-white/[0.06] rounded-2xl p-6"
        >
          <h3 className="font-bold text-sm text-white flex items-center gap-2 mb-6">
            <BarChart3 className="w-4 h-4 text-rose-400" />
            {t("admin.dashboard.top_liked")}
          </h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.topLiked || []} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" tick={false} axisLine={{ stroke: "rgba(255,255,255,0.06)" }} />
                <YAxis stroke="rgba(255,255,255,0.15)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                <Bar dataKey="likesCount" radius={[8, 8, 0, 0]}>
                  {(stats?.topLiked || []).map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Saved — Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-[#0f172a]/60 border border-white/[0.06] rounded-2xl p-6"
        >
          <h3 className="font-bold text-sm text-white flex items-center gap-2 mb-6">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            {t("admin.dashboard.top_saved")}
          </h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.topSaved || []}>
                <defs>
                  <linearGradient id="savedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" tick={false} axisLine={{ stroke: "rgba(255,255,255,0.06)" }} />
                <YAxis stroke="rgba(255,255,255,0.15)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="savedCount" stroke="#06b6d4" strokeWidth={2} fill="url(#savedGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Likes Distribution — Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0f172a]/60 border border-white/[0.06] rounded-2xl p-6 lg:col-span-2"
        >
          <h3 className="font-bold text-sm text-white flex items-center gap-2 mb-6">
            <Heart className="w-4 h-4 text-pink-400" />
            {t("admin.dashboard.likes_distribution")}
          </h3>
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="h-[250px] w-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {pieData.map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02]">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.fill }} />
                  <span className="text-xs text-white/60 truncate flex-1">{item.name}</span>
                  <span className="text-xs font-bold text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Popular Careers Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-[#0f172a]/60 border border-white/[0.06] rounded-2xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-white/[0.04]">
          <h3 className="font-bold text-sm text-white">{t("admin.dashboard.popular_list")}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.04] text-white/30 text-xs uppercase tracking-wider">
                <th className="px-6 py-3">#</th>
                <th className="px-6 py-3">{t("admin.dashboard.career_name")}</th>
                <th className="px-6 py-3">Likes</th>
                <th className="px-6 py-3">{t("admin.dashboard.saves")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {(stats?.topLiked || []).map((career, i) => (
                <tr key={career.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-3 text-white/30 font-mono text-xs">{i + 1}</td>
                  <td className="px-6 py-3 font-semibold text-white">{career.name}</td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center gap-1 text-rose-400 text-xs font-bold">
                      <Heart className="w-3 h-3" /> {career.likesCount}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-white/50">
                    {stats?.topSaved?.find((s) => s.id === career.id)?.savedCount || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
