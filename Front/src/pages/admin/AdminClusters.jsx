import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Loader2,
  FolderKanban,
  Edit,
  Briefcase,
} from "lucide-react";
import axios from "axios";
import { API } from "../../lib/config";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "../../components/toast/ToastProvider";
import { useTranslation } from "react-i18next";
import ClusterForm from "../../components/admin/ClusterForm";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import LucideIconRenderer from "../../components/admin/LucideIconRenderer";

const AdminClusters = () => {
  const { token } = useAuthStore();
  const toast = useToast();
  const { t } = useTranslation();

  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCluster, setEditingCluster] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const fetchClusters = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/clusters`);
      setClusters(data || []);
    } catch (err) {
      toast.error(t("admin.clusters.not_found"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClusters(); }, [fetchClusters]);

  const handleSubmit = async (formData) => {
    setFormLoading(true);
    try {
      if (editingCluster) {
        await axios.put(`${API}/clusters/${editingCluster.id}`, formData, authHeaders);
        toast.success(t("admin.clusters.updated_ok"));
      } else {
        await axios.post(`${API}/clusters`, formData, authHeaders);
        toast.success(t("admin.clusters.created_ok"));
      }
      setFormOpen(false);
      setEditingCluster(null);
      fetchClusters();
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
      await axios.delete(`${API}/clusters/${deleteTarget.id}`, authHeaders);
      toast.success(t("admin.clusters.deleted_ok", { name: deleteTarget.clusterName }));
      setDeleteTarget(null);
      fetchClusters();
    } catch (err) {
      toast.error("Error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const RIASEC_COLORS = {
    R: { text: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", label: "Realistic" },
    I: { text: "text-green-600 dark:text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", label: "Investigative" },
    A: { text: "text-accent-blue", bg: "bg-accent-blue/10", border: "border-accent-blue/20", label: "Artistic" },
    S: { text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "Social" },
    E: { text: "text-red-600 dark:text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", label: "Enterprising" },
    C: { text: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", label: "Conventional" },
  };

  const getGradientByRiasec = (type) => {
    const gradients = {
      R: "from-blue-500/20 to-blue-600/5",
      I: "from-green-500/20 to-green-600/5",
      A: "from-accent-blue/15 to-accent-blue/5",
      S: "from-amber-500/20 to-amber-600/5",
      E: "from-red-500/20 to-red-600/5",
      C: "from-cyan-500/20 to-cyan-600/5",
    };
    return gradients[type] || "from-primary/15 to-primary/5";
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">{t("admin.clusters.title")}</h1>
          <p className="text-[15px] text-muted-foreground mt-1">{t("admin.clusters.count", { count: clusters.length })}</p>
        </div>
        <button
          onClick={() => { setEditingCluster(null); setFormOpen(true); }}
          className="px-4 py-2.5 rounded-xl bg-primary/15 hover:bg-primary/20 text-primary text-[15px] font-bold border border-primary/20 transition-all cursor-pointer flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t("admin.clusters.create")}
        </button>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : clusters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <FolderKanban className="w-8 h-8 mb-3" />
          <p className="text-[15px]">{t("admin.clusters.not_found")}</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {clusters.map((cluster, i) => {
              const riasec = RIASEC_COLORS[cluster.riasecPrimary];
              const gradient = getGradientByRiasec(cluster.riasecPrimary);
              return (
                <motion.div
                  key={cluster.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="group relative bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-300"
                >
                  <div className={`h-2 bg-gradient-to-r ${gradient}`} />

                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl ${riasec?.bg || 'bg-primary/10'} flex items-center justify-center ${riasec?.text || 'text-primary'}`}>
                          <LucideIconRenderer name={cluster.clusterIcon} className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground text-[17px] leading-tight">{cluster.clusterName}</h3>
                          {riasec && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold mt-1 ${riasec.bg} ${riasec.text} border ${riasec.border}`}>
                              {cluster.riasecPrimary}: {riasec.label}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 opacity-60 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => { setEditingCluster(cluster); setFormOpen(true); }}
                          className="p-1.5 rounded-lg hover:bg-primary/10 text-primary/50 hover:text-primary transition-all cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(cluster)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-600/40 dark:text-red-400/40 hover:text-red-600 dark:hover:text-red-400 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {cluster.description && (
                      <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-2 mb-4">{cluster.description}</p>
                    )}

                    <div className="flex items-center gap-2 pt-3 border-t border-border">
                      <Briefcase className="w-3.5 h-3.5 text-muted-foreground/80" />
                      <span className="text-[13px] text-muted-foreground">{t("admin.clusters.careers_count")}:</span>
                      <span className="text-[13px] font-bold text-muted-foreground">{cluster.careerCount ?? cluster.careers?.length ?? 0}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      <ClusterForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingCluster(null); }}
        onSubmit={handleSubmit}
        cluster={editingCluster}
        loading={formLoading}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t("admin.clusters.delete_title")}
        message={t("admin.clusters.delete_msg", { name: deleteTarget?.clusterName })}
        confirmText={t("admin.form.delete")}
        loading={deleteLoading}
      />
    </div>
  );
};

export default AdminClusters;
