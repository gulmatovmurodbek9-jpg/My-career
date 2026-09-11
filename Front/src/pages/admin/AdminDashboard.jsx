import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Briefcase,
  FolderKanban,
  Heart,
  Loader2,
  AlertCircle,
  Bookmark,
  BarChart3,
  Inbox,
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
} from "recharts";
import axios from "axios";
import { API } from "../../lib/config";
import { useAuthStore } from "../../store/authStore";
import { useTranslation } from "react-i18next";
import StatsCard from "../../components/admin/StatsCard";

const CHART_COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c084fc", "#e879f9", "#f472b6", "#fb923c"];

/* Номи ихтисосҳои тоҷикӣ дароз аст — «Автоматикунонии раванди технологӣ ва
   истеҳсоли саноати химиявӣ». Дар диаграммаи амудӣ ҷой намешуд, барои ҳамин
   `tick={false}` гузошта шуда буд ва сутунҳо бе ном мемонданд. Ҳоло диаграмма
   уфуқӣ аст: ном дар тарафи чап пурра ҷой мегирад. */
const LABEL_WIDTH = 250;
const MAX_LABEL_CHARS = 34;

const shortLabel = (name = "") =>
  name.length > MAX_LABEL_CHARS ? name.slice(0, MAX_LABEL_CHARS - 1) + "…" : name;

const EmptyChart = ({ title, hint }) => (
  <div className="h-full flex flex-col items-center justify-center text-center px-6">
    <Inbox className="w-8 h-8 text-white/15 mb-3" />
    <p className="text-sm font-semibold text-white/40">{title}</p>
    <p className="text-xs text-white/25 mt-1 max-w-xs leading-relaxed">{hint}</p>
  </div>
);

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

  /* Ихтисосе, ки 0 лайк дорад, дар диаграмма сутуни нонамоён месозад ва дар
     легенда сатри «0» — фақат шавшув. Танҳо онҳое, ки воқеан хол доранд. */
  const likedData = (stats?.topLiked || [])
    .filter((c) => (c.likesCount || 0) > 0)
    .map((c, i) => ({
      name: c.name,
      label: shortLabel(c.name),
      value: c.likesCount || 0,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }));

  const savedData = (stats?.topSaved || [])
    .filter((c) => (c.savedCount || 0) > 0)
    .map((c) => ({
      name: c.name,
      label: shortLabel(c.name),
      value: c.savedCount || 0,
    }));

  const noData = t("admin.dashboard.no_data");
  const noDataHint = t("admin.dashboard.no_data_hint");

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const row = payload[0]?.payload || {};
    return (
      <div className="bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 shadow-2xl max-w-xs">
        <p className="text-xs font-semibold text-white mb-1 leading-snug">{row.name}</p>
        <p className="text-sm font-bold text-indigo-400">{payload[0]?.value}</p>
      </div>
    );
  };

  /* Меҳвари рақамӣ: холҳо ҳамеша бутунанд, вале recharts бо қимати 1
     «0.25 / 0.5 / 0.75» мекашид ва диаграмма вайрон менамуд. */
  const numberAxis = {
    type: "number",
    allowDecimals: false,
    stroke: "rgba(255,255,255,0.3)",
    fontSize: 12,
    tickLine: false,
    axisLine: false,
  };

  const categoryAxis = {
    type: "category",
    dataKey: "label",
    width: LABEL_WIDTH,
    stroke: "rgba(255,255,255,0.65)",
    fontSize: 13,
    tickLine: false,
    axisLine: false,
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
        {/* Top Liked */}
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
            {likedData.length === 0 ? (
              <EmptyChart title={noData} hint={noDataHint} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={likedData}
                  layout="vertical"
                  barSize={18}
                  margin={{ top: 4, right: 24, bottom: 4, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis {...numberAxis} />
                  <YAxis {...categoryAxis} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {likedData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Top Saved — ҳамон шакл, то ки ду диаграмма ҳамоҳанг бошанд.
            Пештар AreaChart буд: он хатти вақтро нишон медиҳад, вале ин ҷо
            рӯйхати ихтисосҳост, на вақт — бо як қимат он як росткунҷаи
            холӣ мекашид. */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-[#0f172a]/60 border border-white/[0.06] rounded-2xl p-6"
        >
          <h3 className="font-bold text-sm text-white flex items-center gap-2 mb-6">
            <Bookmark className="w-4 h-4 text-cyan-400" />
            {t("admin.dashboard.top_saved")}
          </h3>
          <div className="h-[280px]">
            {savedData.length === 0 ? (
              <EmptyChart title={noData} hint={noDataHint} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={savedData}
                  layout="vertical"
                  barSize={18}
                  margin={{ top: 4, right: 24, bottom: 4, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis {...numberAxis} />
                  <YAxis {...categoryAxis} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} fill="#06b6d4" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Likes Distribution */}
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
          {likedData.length === 0 ? (
            <div className="h-[160px]">
              <EmptyChart title={noData} hint={noDataHint} />
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="h-[250px] w-[250px] flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={likedData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {likedData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-2">
                {likedData.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02]"
                    title={item.name}
                  >
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.fill }} />
                    <span className="text-[13px] text-white/70 truncate flex-1">{item.name}</span>
                    <span className="text-[13px] font-bold text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
                <th className="px-6 py-3 w-12">#</th>
                <th className="px-6 py-3">{t("admin.dashboard.career_name")}</th>
                <th className="px-6 py-3 w-24">Likes</th>
                <th className="px-6 py-3 w-24">{t("admin.dashboard.saves")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {(stats?.topLiked || []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-white/30">
                    {noData}
                  </td>
                </tr>
              ) : (
                (stats?.topLiked || []).map((career, i) => (
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
