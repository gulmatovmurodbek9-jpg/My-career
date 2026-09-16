import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";



const ClusterForm = ({ open, onClose, onSubmit, cluster = null, loading = false }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({ clusterName: "", clusterIcon: "", description: "", purpose: "" });

  useEffect(() => {
    if (cluster) {
      setForm({
        clusterName: cluster.clusterName || "",
        clusterIcon: cluster.clusterIcon || "",
        description: cluster.description || "",
        purpose: cluster.purpose || "",
      });
    } else {
      setForm({ clusterName: "", clusterIcon: "", description: "", purpose: "" });
    }
  }, [cluster, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  const inputClass = "w-full bg-muted/60 border border-border rounded-xl px-4 py-2.5 text-[15px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-all";
  const labelClass = "block text-[13px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider";

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: "spring", damping: 25, stiffness: 400 }} onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl z-10">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">
                {cluster ? t("admin.clusters.edit_title") : t("admin.clusters.create_title")}
              </h2>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className={labelClass}>{t("admin.form.cluster_name")} *</label>
                <input type="text" value={form.clusterName} onChange={(e) => setForm({ ...form, clusterName: e.target.value })} className={inputClass} placeholder="IT ва Технология" required />
              </div>
              <div>
                <label className={labelClass}>{t("admin.form.cluster_icon")} 🎨</label>
                <input type="text" value={form.clusterIcon} onChange={(e) => setForm({ ...form, clusterIcon: e.target.value })} className={inputClass} placeholder="💻" required />
              </div>
              <div>
                <label className={labelClass}>{t("admin.form.description")}</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputClass} min-h-[80px] resize-none`} />
              </div>
              <div>
                <label className={labelClass}>{t("admin.form.purpose", "Барои чӣ?")}</label>
                <textarea value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} className={`${inputClass} min-h-[80px] resize-none`} placeholder={t("admin.form.cluster_purpose_hint", "Мақсади ин кластер дар чист?")} />
              </div>
            </form>

            <div className="flex justify-end gap-3 p-6 border-t border-border">
              <button type="button" onClick={onClose} disabled={loading} className="px-5 py-2.5 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground text-[15px] font-semibold border border-border transition-all cursor-pointer">
                {t("admin.form.cancel")}
              </button>
              <button onClick={handleSubmit} disabled={loading || !form.clusterName.trim()} className="px-5 py-2.5 rounded-xl bg-primary/15 hover:bg-primary/20 text-primary text-[15px] font-bold border border-primary/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-40">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {cluster ? t("admin.form.save") : t("admin.form.create")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ClusterForm;
