import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Trash2,
  Loader2,
  Users as UsersIcon,
  Shield,
  ShieldOff,
  User as UserIcon,
  BadgeCheck,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import axios from "axios";
import { API } from "../../lib/config";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "../../components/toast/ToastProvider";
import { useTranslation } from "react-i18next";
import ConfirmDialog from "../../components/admin/ConfirmDialog";

/* 20 сатр: ҷадвал дар экрани ноутбук бе скролли дароз ҷой мегирад. */
const PAGE_SIZE = 20;

/* Ранги аватар аз email: ҳар корбар ранги худро дорад ва он ҳамеша ҳамон
   мемонад. Ранг ҳам дар мавзӯи равшан ва ҳам дар торик хонда мешавад. */
const AVATAR_TONES = [
  "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
  "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  "bg-teal-500/15 text-teal-700 dark:text-teal-300",
];
const avatarTone = (seed = "") => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length];
};

/* Ҳамон равзана, ки дошборд барои «Ҳозир дар сайт» истифода мебарад. */
const ONLINE_MINUTES = 5;

const AdminUsers = () => {
  const { token, user: currentUser } = useAuthStore();
  const toast = useToast();
  const { t } = useTranslation();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [roleLoading, setRoleLoading] = useState(null);

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/users`, authHeaders);
      setUsers(data || []);
    } catch (err) {
      toast.error(t("admin.users.not_found"));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await axios.delete(`${API}/users/${deleteTarget.id}`, authHeaders);
      toast.success(t("admin.users.deleted_ok", { name: deleteTarget.name || deleteTarget.email }));
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      toast.error("Error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRoleChange = async (user) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    setRoleLoading(user.id);
    try {
      await axios.patch(`${API}/users/${user.id}/role`, { role: newRole }, authHeaders);
      toast.success(t("admin.users.role_changed", { name: user.name || user.email, role: newRole }));
      fetchUsers();
    } catch (err) {
      toast.error("Error");
    } finally {
      setRoleLoading(null);
    }
  };

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q);
  });

  /* Саҳифабандӣ пас аз ҷустуҷӯ: ҷустуҷӯ дар ҳамаи корбарон меравад, на танҳо
     дар саҳифаи ҷорӣ. Агар пас аз нест кардан саҳифаи охир холӣ шавад,
     currentPage ба саҳифаи охирини мавҷуда меафтад. */
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageUsers = filtered.slice(pageStart, pageStart + PAGE_SIZE);
  const pageNumbers = [];
  for (let p = 1; p <= pageCount; p++) {
    if (p === 1 || p === pageCount || Math.abs(p - currentPage) <= 1) pageNumbers.push(p);
    else if (pageNumbers[pageNumbers.length - 1] !== "…") pageNumbers.push("…");
  }

  const lastSeen = (iso) => {
    if (!iso) return { online: false, label: t("admin.activity.never") };
    const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (minutes < ONLINE_MINUTES) return { online: true, label: t("admin.activity.just_now") };
    if (minutes < 60) return { online: false, label: t("admin.activity.minutes_ago", { count: minutes }) };
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return { online: false, label: t("admin.activity.hours_ago", { count: hours }) };
    return { online: false, label: t("admin.activity.days_ago", { count: Math.floor(hours / 24) }) };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">{t("admin.users.title")}</h1>
          <p className="text-[15px] text-muted-foreground mt-1">{t("admin.users.count", { count: users.length })}</p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/80" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={t("admin.users.search")}
            className="w-full bg-muted/60 border border-border rounded-xl pl-10 pr-4 py-2.5 text-[15px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60 transition-all"
          />
        </div>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <UsersIcon className="w-8 h-8 mb-3" />
            <p className="text-[15px]">{t("admin.users.not_found")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[15px]">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-[13px] uppercase tracking-wider">
                  <th className="px-6 py-3 w-12">#</th>
                  <th className="px-6 py-3">{t("admin.users.user")}</th>
                  <th className="px-6 py-3 text-center">{t("admin.users.role")}</th>
                  <th className="px-6 py-3">{t("admin.users.quiz", "Санҷиш")}</th>
                  <th className="px-6 py-3">{t("admin.users.date")}</th>
                  <th className="px-6 py-3 text-right">{t("admin.users.last_seen", "Охирин фаъолият")}</th>
                  <th className="px-6 py-3 text-right">{t("admin.users.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <AnimatePresence>
                  {pageUsers.map((user, i) => {
                    const isSelf = user.id === currentUser?.id;

                    /* Ҳисоби бо Google сохташуда ё сабти кӯҳна ном надорад.
                       «—» ҷадвалро пур аз хат мекард ва админ намедонист бо
                       кӣ кор дорад; қисми имейл ҳадди ақал шиносост. */
                    const displayName = user.name?.trim() || user.email?.split("@")[0] || "—";
                    return (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        /* Бе маҳдудият сатри 100-ум 2 сония дер мебаромад —
                           ҷадвал «суст» менамуд. Пас аз 0.3 сония ҳама якҷо. */
                        transition={{ delay: Math.min(i * 0.02, 0.3) }}
                        className="hover:bg-muted/50 transition-colors group"
                      >
                        <td className="px-6 py-3.5 text-muted-foreground/80 font-mono text-[13px]">{pageStart + i + 1}</td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-[14px] font-bold ${avatarTone(user.email || displayName)}`}>
                              {displayName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 font-semibold text-foreground text-[15px]">
                                <span className="truncate">{displayName}</span>
                                {isSelf && (
                                  <span className="shrink-0 text-[11px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-md font-bold">
                                    {t("admin.users.you")}
                                  </span>
                                )}
                              </div>
                              <div className="truncate text-[13px] text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          {/* Се нақш ҳаст, на ду. Пештар танҳо `admin` ҷудо
                              мешуд, ва мутахассисон ҳамчун «User» нишон дода
                              мешуданд — админ онҳоро аз довталабон фарқ карда
                              наметавонист. */}
                          {user.role === "admin" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[13px] font-bold">
                              <Shield className="w-3 h-3" /> Admin
                            </span>
                          ) : user.role === "specialist" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[13px] font-bold">
                              <BadgeCheck className="w-3 h-3" /> {t("admin.users.specialist", "Мутахассис")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted/60 text-muted-foreground text-[13px] font-semibold">
                              <UserIcon className="w-3 h-3" /> {t("admin.users.role_user", "Корбар")}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3.5">
                          {user.quizResults ? (
                            <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-primary/10 px-2.5 py-1 text-[13px] font-semibold text-primary">
                              <ClipboardCheck className="w-3 h-3" /> {t("admin.users.quiz_done", "Супорида")}
                            </span>
                          ) : (
                            <span className="text-[13px] text-muted-foreground/70">{t("admin.users.quiz_none", "Не")}</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-muted-foreground text-[13px] tabular-nums">{formatDate(user.createdAt)}</td>
                        <td className="px-6 py-3.5 text-right">
                          {(() => {
                            const seen = lastSeen(user.lastSeenAt);
                            return (
                              <span className={`inline-flex items-center justify-end gap-1.5 whitespace-nowrap text-[13px] ${seen.online ? "font-semibold text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                                {seen.online && <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />}
                                {seen.label}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          {/* Пештар `opacity-0 group-hover:opacity-100` буд:
                              сутуни «Амалҳо» холӣ менамуд, ва дар экрани
                              ламсӣ, ки hover надорад, тугмаҳо ҳеҷ гоҳ
                              намебаромаданд. Ҳоло онҳо ҳамеша дида мешаванд
                              ва ҳангоми hover равшантар. */}
                          <div className="flex items-center justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                            <button
                              onClick={() => handleRoleChange(user)}
                              disabled={isSelf || roleLoading === user.id}
                              className={`p-2 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[13px] font-semibold ${
                                isSelf
                                  ? "opacity-20 cursor-not-allowed"
                                  : user.role === "admin"
                                  ? "hover:bg-amber-500/10 text-amber-600/60 dark:text-amber-400/60 hover:text-amber-600 dark:hover:text-amber-400"
                                  : "hover:bg-primary/10 text-primary/70 hover:text-primary"
                              }`}
                              title={user.role === "admin" ? t("admin.users.make_user") : t("admin.users.make_admin")}
                            >
                              {roleLoading === user.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : user.role === "admin" ? (
                                <ShieldOff className="w-3.5 h-3.5" />
                              ) : (
                                <Shield className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => setDeleteTarget(user)}
                              disabled={isSelf}
                              className={`p-2 rounded-lg transition-all cursor-pointer ${
                                isSelf ? "opacity-20 cursor-not-allowed" : "hover:bg-red-500/10 text-red-600/60 dark:text-red-400/60 hover:text-red-600 dark:hover:text-red-400"
                              }`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Саҳифабандӣ — танҳо вақте ки корбарон аз як саҳифа зиёданд. */}
      {!loading && filtered.length > PAGE_SIZE && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-[14px] text-muted-foreground tabular-nums">
            {t("admin.users.page_range", {
              from: pageStart + 1,
              to: Math.min(pageStart + PAGE_SIZE, filtered.length),
              total: filtered.length,
              defaultValue: "{{from}}–{{to}} аз {{total}}",
            })}
          </p>
          <nav className="flex items-center gap-1" aria-label={t("admin.users.pagination", "Саҳифаҳо")}>
            <button
              type="button"
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label={t("admin.users.prev_page", "Саҳифаи пешина")}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {pageNumbers.map((p, idx) =>
              p === "…" ? (
                <span key={`gap-${idx}`} className="px-2 text-muted-foreground">…</span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  aria-current={p === currentPage ? "page" : undefined}
                  className={`h-9 min-w-9 rounded-lg px-3 text-[14px] font-semibold tabular-nums cursor-pointer ${
                    p === currentPage
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              type="button"
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage === pageCount}
              aria-label={t("admin.users.next_page", "Саҳифаи навбатӣ")}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t("admin.users.delete_title")}
        message={t("admin.users.delete_msg", { name: deleteTarget?.name || deleteTarget?.email })}
        confirmText={t("admin.form.delete")}
        loading={deleteLoading}
      />
    </div>
  );
};

export default AdminUsers;
