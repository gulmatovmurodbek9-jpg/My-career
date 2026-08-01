import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Trash,
  Heart,
  Filter,
} from "lucide-react";
import axios from "axios";
import { API } from "../../lib/config";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "../../components/toast/ToastProvider";
import { useTranslation } from "react-i18next";
import CareerForm from "../../components/admin/CareerForm";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import LucideIconRenderer from "../../components/admin/LucideIconRenderer";
import CustomSelect from "../../components/admin/CustomSelect";

const AdminCareers = () => {
  const { token } = useAuthStore();
  const toast = useToast();
  const { t } = useTranslation();

  const [careers, setCareers] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, lastPage: 1 });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedCluster, setSelectedCluster] = useState("");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCareer, setEditingCareer] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const fetchCareers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (selectedCluster) params.clusterId = selectedCluster;
      const { data } = await axios.get(`${API}/careers`, { params, ...authHeaders });
      setCareers(data.data || []);
      setMeta(data.meta || { total: 0, page: 1, limit: 10, lastPage: 1 });
    } catch (err) {
      toast.error(t("admin.careers.not_found"));
    } finally {
      setLoading(false);
    }
  }, [token, page, search, selectedCluster]);

  const fetchClusters = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/clusters`);
      setClusters(data || []);
    } catch (err) {
      console.error("Failed to fetch clusters:", err);
    }
  }, []);

  useEffect(() => { fetchClusters(); }, []);
  useEffect(() => { fetchCareers(); }, [fetchCareers]);
  useEffect(() => { setPage(1); }, [search, selectedCluster]);

  const handleSubmit = async (formData) => {
    setFormLoading(true);
    try {
      if (editingCareer) {
        await axios.put(`${API}/careers/${editingCareer.id}`, formData, authHeaders);
        toast.success(t("admin.careers.updated_ok"));
      } else {
        await axios.post(`${API}/careers`, formData, authHeaders);
        toast.success(t("admin.careers.created_ok"));
      }
      setFormOpen(false);
      setEditingCareer(null);
      fetchCareers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await axios.delete(`${API}/careers/${deleteTarget.id}`, authHeaders);
      toast.success(t("admin.careers.deleted_ok", { name: deleteTarget.name }));
      setDeleteTarget(null);
      fetchCareers();
    } catch (err) {
      toast.error("Error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!deleteAllConfirm) {
      setDeleteAllConfirm(true);
      return;
    }
    setDeleteLoading(true);
    try {
      await axios.delete(`${API}/careers`, authHeaders);
      toast.success(t("admin.careers.deleted_all_ok"));
      setDeleteAllOpen(false);
      setDeleteAllConfirm(false);
      fetchCareers();
    } catch (err) {
      toast.error("Error");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">{t("admin.careers.title")}</h1>
          <p className="text-sm text-white/30 mt-1">{t("admin.careers.count", { count: meta.total })}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setEditingCareer(null); setFormOpen(true); }}
            className="px-4 py-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 text-sm font-bold border border-indigo-500/20 transition-all cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t("admin.careers.create")}
          </button>
          <button
            onClick={() => { setDeleteAllOpen(true); setDeleteAllConfirm(false); }}
            className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400/70 text-sm font-semibold border border-red-500/10 transition-all cursor-pointer flex items-center gap-2"
          >
            <Trash className="w-4 h-4" />
            {t("admin.careers.delete_all")}
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin.careers.search")}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-indigo-500/50 transition-all"
          />
        </div>
        <CustomSelect
          value={selectedCluster}
          onChange={(val) => setSelectedCluster(val)}
          placeholder={t("admin.careers.all_clusters")}
          icon={Filter}
          clearable
          options={clusters.map((c) => ({
            value: c.id,
            label: c.clusterName,
          }))}
          className="min-w-[220px]"
        />
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#0f172a]/60 border border-white/[0.06] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          </div>
        ) : careers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/30">
            <AlertCircle className="w-8 h-8 mb-3" />
            <p className="text-sm">{t("admin.careers.not_found")}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.04] text-white/30 text-xs uppercase tracking-wider">
                    <th className="px-6 py-3 w-12">#</th>
                    <th className="px-6 py-3">{t("admin.careers.name")}</th>
                    <th className="px-6 py-3">{t("admin.careers.cluster")}</th>
                    <th className="px-6 py-3 text-center">Likes</th>
                    <th className="px-6 py-3 text-right">{t("admin.careers.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  <AnimatePresence>
                    {careers.map((career, i) => (
                      <motion.tr
                        key={career.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="hover:bg-white/[0.02] transition-colors group"
                      >
                        <td className="px-6 py-3.5 text-white/20 font-mono text-xs">
                          {(meta.page - 1) * meta.limit + i + 1}
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="font-semibold text-white text-sm">{career.name}</div>
                          {career.description && (
                            <div className="text-xs text-white/30 mt-0.5 truncate max-w-[300px]">{career.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-3.5">
                          {career.cluster ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-semibold">
                              {career.cluster.clusterIcon && <LucideIconRenderer name={career.cluster.clusterIcon} className="w-3.5 h-3.5" />}
                              {career.cluster.clusterName}
                            </span>
                          ) : (
                            <span className="text-white/20 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <span className="inline-flex items-center gap-1 text-rose-400/70 text-xs font-bold">
                            <Heart className="w-3 h-3" /> {career.likesCount || 0}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => { setEditingCareer(career); setFormOpen(true); }}
                              className="p-2 rounded-lg hover:bg-indigo-500/10 text-indigo-400/60 hover:text-indigo-400 transition-all cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(career)}
                              className="p-2 rounded-lg hover:bg-red-500/10 text-red-400/60 hover:text-red-400 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.04]">
              <p className="text-xs text-white/30">
                {t("admin.careers.page_info", { page: meta.page, lastPage: meta.lastPage, total: meta.total })}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded-lg hover:bg-white/5 text-white/30 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, meta.lastPage) }, (_, i) => {
                  let pageNum;
                  if (meta.lastPage <= 5) pageNum = i + 1;
                  else if (page <= 3) pageNum = i + 1;
                  else if (page >= meta.lastPage - 2) pageNum = meta.lastPage - 4 + i;
                  else pageNum = page - 2 + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        page === pageNum
                          ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/20"
                          : "text-white/30 hover:text-white/60 hover:bg-white/5"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(meta.lastPage, p + 1))}
                  disabled={page >= meta.lastPage}
                  className="p-2 rounded-lg hover:bg-white/5 text-white/30 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* Career Form Modal */}
      <CareerForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingCareer(null); }}
        onSubmit={handleSubmit}
        career={editingCareer}
        clusters={clusters}
        loading={formLoading}
      />

      {/* Delete Single */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t("admin.careers.delete_title")}
        message={t("admin.careers.delete_msg", { name: deleteTarget?.name })}
        confirmText={t("admin.form.delete")}
        loading={deleteLoading}
      />

      {/* Delete All */}
      <ConfirmDialog
        open={deleteAllOpen}
        onClose={() => { setDeleteAllOpen(false); setDeleteAllConfirm(false); }}
        onConfirm={handleDeleteAll}
        title={deleteAllConfirm ? t("admin.careers.delete_all_final") : t("admin.careers.delete_all_title")}
        message={deleteAllConfirm ? t("admin.careers.delete_all_final_msg") : t("admin.careers.delete_all_msg", { count: meta.total })}
        confirmText={deleteAllConfirm ? t("admin.form.delete") + "!" : t("admin.form.confirm")}
        loading={deleteLoading}
      />
    </div>
  );
};

export default AdminCareers;
