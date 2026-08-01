import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { useTranslation } from "react-i18next";

const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  loading = false,
}) => {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} transition={{ type: "spring", damping: 25, stiffness: 400 }} onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl p-6 z-10">
            <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-red-500/10 mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-red-400" />
            </div>

            <h3 className="text-lg font-bold text-white text-center mb-2">{title || t("admin.form.confirm")}</h3>
            <p className="text-sm text-white/50 text-center mb-6 leading-relaxed">{message}</p>

            <div className="flex gap-3">
              <button onClick={onClose} disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-sm font-semibold border border-white/10 transition-all disabled:opacity-50 cursor-pointer">
                {t("admin.form.cancel")}
              </button>
              <button onClick={onConfirm} disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-bold border border-red-500/20 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2">
                {loading ? <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" /> : null}
                {confirmText || t("admin.form.delete")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;
