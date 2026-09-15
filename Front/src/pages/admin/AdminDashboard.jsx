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
  Radio,
  Clock,
  ClipboardCheck,
  UserPlus,
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

const CHART_COLORS = ["#1d4ed8", "#3b82f6", "#60a5fa", "#f59e0b", "#10b981", "#f43f5e", "#0ea5e9"];

/* Номи ихтисосҳои тоҷикӣ дароз аст — «Автоматикунонии раванди технологӣ ва
   истеҳсоли саноати химиявӣ». Дар диаграммаи амудӣ ҷой намешуд, барои ҳамин
   `tick={false}` гузошта шуда буд ва сутунҳо бе ном мемонданд. Ҳоло диаграмма
   уфуқӣ аст: ном дар тарафи чап пурра ҷой мегирад. */
const LABEL_WIDTH = 260;
const MAX_LABEL_CHARS = 34;

const shortLabel = (name = "") =>
  name.length > MAX_LABEL_CHARS ? name.slice(0, MAX_LABEL_CHARS - 1) + "…" : name;

const EmptyChart = ({ title, hint }) => (
  <div className="h-full flex flex-col items-center justify-center text-center px-6">
    <Inbox className="w-8 h-8 text-muted-foreground/50 mb-3" />
    <p className="text-[15px] font-semibold text-muted-foreground">{title}</p>
    <p className="text-[13px] text-muted-foreground/70 mt-1 max-w-xs leading-relaxed">{hint}</p>
  </div>
);

const ActivityStat = ({ icon: Icon, label, value, tone, bg, live = false }) => (
  <div className="flex items-center gap-3 rounded-xl bg-muted/40 border border-border px-4 py-3">
    <div className={`relative p-2 rounded-lg ${bg} ${tone}`}>
      <Icon className="w-4 h-4" />
      {live && (
        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
      )}
    </div>
    <div className="min-w-0">
      <div className="text-xl font-extrabold text-foreground leading-none">{value ?? 0}</div>
      <div className="text-[13px] text-muted-foreground mt-1 truncate">{label}</div>
    </div>
  </div>
);

/* «5 дақиқа пеш» аз санаи хом хеле хонотар аст — админ мехоҳад зуд бифаҳмад,
   кӣ ҳозир ҳаст, на санаро ҳисоб кунад. */
const timeAgo = (iso, t) => {
  if (!iso) return t("admin.activity.never");
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return t("admin.activity.just_now");
  if (minutes < 60) return t("admin.activity.minutes_ago", { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("admin.activity.hours_ago", { count: hours });
  return t("admin.activity.days_ago", { count: Math.floor(hours / 24) });
};

const PersonRow = ({ person, online = false, t }) => {
  const name = person.name?.trim() || person.email?.split("@")[0] || "—";
  return (
    <div className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2">
      <div className="relative w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <span className="text-[12px] font-bold text-primary">{name.charAt(0).toUpperCase()}</span>
        {online && (
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-card" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-semibold text-foreground truncate">{name}</div>
        <div className="text-[12px] text-muted-foreground/80 truncate">{person.email}</div>
      </div>
      <span className="text-[12px] text-muted-foreground/80 whitespace-nowrap">{timeAgo(person.lastSeenAt, t)}</span>
    </div>
  );
};

const AdminDashboard = () => {
  const { token } = useAuthStore();
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activity, setActivity] = useState(null);

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

    /* Фаъолият алоҳида бор мешавад: агар ин дархост ноком шавад (масалан
       сутуни lastSeenAt ҳанӯз дар база нест), диаграммаҳо бояд ҳамон тавр
       нишон дода шаванд. */
    axios
      .get(`${API}/users/admin/activity`, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => setActivity(data))
      .catch(() => setActivity(null));
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400 mx-auto mb-3" />
          <p className="text-muted-foreground">{error}</p>
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
      <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-2xl max-w-xs">
        <p className="text-[13px] font-semibold text-foreground mb-1 leading-snug">{row.name}</p>
        <p className="text-[15px] font-bold text-primary">{payload[0]?.value}</p>
      </div>
    );
  };

  /* Меҳвари рақамӣ: холҳо ҳамеша бутунанд, вале recharts бо қимати 1
     «0.25 / 0.5 / 0.75» мекашид ва диаграмма вайрон менамуд. */
  const numberAxis = {
    type: "number",
    allowDecimals: false,
    stroke: "hsl(var(--muted-foreground))",
    fontSize: 13,
    tickLine: false,
    axisLine: false,
  };

  const categoryAxis = {
    type: "category",
    dataKey: "label",
    width: LABEL_WIDTH,
    stroke: "hsl(var(--foreground))",
    fontSize: 14,
    tickLine: false,
    axisLine: false,
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
          {t("admin.dashboard.title")}
        </h1>
        <p className="text-[15px] text-muted-foreground mt-1">{t("admin.dashboard.subtitle")}</p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={Users}
          label={t("admin.dashboard.users")}
          value={stats?.totalUsers ?? 0}
          color="text-blue-600 dark:text-blue-400"
          bg="bg-blue-500/10"
          delay={0}
        />
        <StatsCard
          icon={Briefcase}
          label={t("admin.dashboard.careers")}
          value={stats?.totalCareers ?? 0}
          color="text-primary"
          bg="bg-primary/10"
          delay={0.05}
        />
        <StatsCard
          icon={FolderKanban}
          label={t("admin.dashboard.clusters")}
          value={stats?.totalClusters ?? 0}
          color="text-accent-blue"
          bg="bg-accent-blue/10"
          delay={0.1}
        />
        <StatsCard
          icon={Heart}
          label={t("admin.dashboard.likes")}
          value={stats?.totalLikes ?? 0}
          color="text-rose-600 dark:text-rose-400"
          bg="bg-rose-500/10"
          delay={0.15}
        />
      </div>

      {/* Фаъолият — кӣ ҳозир дар сайт аст ва чанд нафар истифода мебарад.
          Агар сутуни lastSeenAt ҳанӯз дар база набошад, дархост ноком мешавад
          ва тамоми блок нонамоён мемонад — боқии саҳифа кор мекунад. */}
      {activity && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {t("admin.activity.title")}
            </h3>
            <span className="text-[13px] text-muted-foreground/80">
              {t("admin.activity.window_hint", { minutes: activity.onlineWindowMinutes })}
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <ActivityStat
              icon={Radio}
              label={t("admin.activity.online")}
              value={activity.online}
              tone="text-emerald-600 dark:text-emerald-400"
              bg="bg-emerald-500/10"
              live={activity.online > 0}
            />
            <ActivityStat
              icon={Clock}
              label={t("admin.activity.today")}
              value={activity.today}
              tone="text-blue-600 dark:text-blue-400"
              bg="bg-blue-500/10"
            />
            <ActivityStat
              icon={ClipboardCheck}
              label={t("admin.activity.with_quiz")}
              value={activity.withQuiz}
              tone="text-primary"
              bg="bg-primary/10"
            />
            <ActivityStat
              icon={UserPlus}
              label={t("admin.activity.new_week")}
              value={activity.newThisWeek}
              tone="text-amber-600 dark:text-amber-400"
              bg="bg-amber-500/10"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <p className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                {t("admin.activity.online_now")}
              </p>
              {activity.onlineUsers?.length ? (
                <div className="space-y-1.5">
                  {activity.onlineUsers.map((u) => (
                    <PersonRow key={u.id} person={u} online t={t} />
                  ))}
                </div>
              ) : (
                <p className="text-[14px] text-muted-foreground/70 py-4">{t("admin.activity.nobody_online")}</p>
              )}
            </div>
            <div>
              <p className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                {t("admin.activity.recent")}
              </p>
              <div className="space-y-1.5">
                {activity.recentUsers?.map((u) => (
                  <PersonRow key={u.id} person={u} t={t} />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Liked */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <h3 className="font-bold text-[15px] text-foreground flex items-center gap-2 mb-6">
            <BarChart3 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
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
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis {...numberAxis} />
                  <YAxis {...categoryAxis} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.6)" }} />
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
          className="bg-card border border-border rounded-2xl p-6"
        >
          <h3 className="font-bold text-[15px] text-foreground flex items-center gap-2 mb-6">
            <Bookmark className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
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
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis {...numberAxis} />
                  <YAxis {...categoryAxis} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.6)" }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} fill="hsl(var(--primary))" />
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
          className="bg-card border border-border rounded-2xl p-6 lg:col-span-2"
        >
          <h3 className="font-bold text-[15px] text-foreground flex items-center gap-2 mb-6">
            <Heart className="w-4 h-4 text-pink-600 dark:text-pink-400" />
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
                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/40"
                    title={item.name}
                  >
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.fill }} />
                    <span className="text-[14px] text-foreground/80 truncate flex-1">{item.name}</span>
                    <span className="text-[14px] font-bold text-foreground">{item.value}</span>
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
        className="bg-card border border-border rounded-2xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-bold text-[15px] text-foreground">{t("admin.dashboard.popular_list")}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[15px]">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-[13px] uppercase tracking-wider">
                <th className="px-6 py-3 w-12">#</th>
                <th className="px-6 py-3">{t("admin.dashboard.career_name")}</th>
                <th className="px-6 py-3 w-24">Likes</th>
                <th className="px-6 py-3 w-24">{t("admin.dashboard.saves")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(stats?.topLiked || []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-[15px] text-muted-foreground">
                    {noData}
                  </td>
                </tr>
              ) : (
                (stats?.topLiked || []).map((career, i) => (
                  <tr key={career.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-3 text-muted-foreground font-mono text-[13px]">{i + 1}</td>
                    <td className="px-6 py-3 font-semibold text-foreground">{career.name}</td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 text-[13px] font-bold">
                        <Heart className="w-3 h-3" /> {career.likesCount}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">
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
