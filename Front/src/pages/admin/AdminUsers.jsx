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
} from "lucide-react";
import axios from "axios";
import { API } from "../../lib/config";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "../../components/toast/ToastProvider";
import { useTranslation } from "react-i18next";
import ConfirmDialog from "../../components/admin/ConfirmDialog";

const AdminUsers = () => {
  const { token, user: currentUser } = useAuthStore();
  const toast = useToast();
  const { t } = useTranslation();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">{t("admin.users.title")}</h1>
          <p className="text-sm text-white/30 mt-1">{t("admin.users.count", { count: users.length })}</p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin.users.search")}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-indigo-500/50 transition-all"
          />
        </div>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#0f172a]/60 border border-white/[0.06] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/30">
            <UsersIcon className="w-8 h-8 mb-3" />
            <p className="text-sm">{t("admin.users.not_found")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.04] text-white/30 text-xs uppercase tracking-wider">
                  <th className="px-6 py-3 w-12">#</th>
                  <th className="px-6 py-3">{t("admin.users.user")}</th>
                  <th className="px-6 py-3">{t("admin.users.email")}</th>
                  <th className="px-6 py-3 text-center">{t("admin.users.role")}</th>
                  <th className="px-6 py-3">{t("admin.users.date")}</th>
                  <th className="px-6 py-3 text-right">{t("admin.users.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                <AnimatePresence>
                  {filtered.map((user, i) => {
                    const isSelf = user.id === currentUser?.id;
                    return (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="hover:bg-white/[0.02] transition-colors group"
                      >
                        <td className="px-6 py-3.5 text-white/20 font-mono text-xs">{i + 1}</td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center border border-indigo-500/10">
                              <span className="text-xs font-bold text-indigo-400">
                                {user.name?.charAt(0)?.toUpperCase() || "?"}
                              </span>
                            </div>
                            <div>
                              <div className="font-semibold text-white text-sm">
                                {user.name || "—"}
                                {isSelf && (
                                  <span className="ml-2 text-[10px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-md font-bold">
                                    {t("admin.users.you")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-white/40 text-xs">{user.email}</td>
                        <td className="px-6 py-3.5 text-center">
                          {user.role === "admin" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-bold">
                              <Shield className="w-3 h-3" /> Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 text-white/40 text-xs font-semibold">
                              <UserIcon className="w-3 h-3" /> User
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-white/30 text-xs">{formatDate(user.createdAt)}</td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleRoleChange(user)}
                              disabled={isSelf || roleLoading === user.id}
                              className={`p-2 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold ${
                                isSelf
                                  ? "opacity-20 cursor-not-allowed"
                                  : user.role === "admin"
                                  ? "hover:bg-amber-500/10 text-amber-400/60 hover:text-amber-400"
                                  : "hover:bg-indigo-500/10 text-indigo-400/60 hover:text-indigo-400"
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
                                isSelf ? "opacity-20 cursor-not-allowed" : "hover:bg-red-500/10 text-red-400/60 hover:text-red-400"
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
