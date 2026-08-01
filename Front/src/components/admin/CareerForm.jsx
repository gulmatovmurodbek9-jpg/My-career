import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Loader2, FolderKanban } from "lucide-react";
import { useTranslation } from "react-i18next";
import CustomSelect from "./CustomSelect";



const emptyForm = {
  name: "", description: "", purpose: "",
  skills: { technical: [], soft: [] },
  technologies: [], roadmap: [], certification: [], universities: [],
  careerOpportunities: [], relatedSpecializations: [], projectsExamples: [],
  learningResources: { books: [], courses: [], blogs: [] },
  salaryAndMarket: { junior: "", mid: "", senior: "" },
  advice: "",
  clusterId: "",
  tuitionFee: "",
};

const CareerForm = ({ open, onClose, onSubmit, career = null, clusters = [], loading = false }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState(emptyForm);
  const [activeTab, setActiveTab] = useState("basic");

  const [tempInputs, setTempInputs] = useState({
    technical: "", soft: "", technologies: "", roadmap: "",
    certification: "", universities: "", careerOpportunities: "",
    relatedSpecializations: "", projectsExamples: "",
    books: "", courses: "", blogs: "",
  });

  useEffect(() => {
    if (career) {
      setForm({
        name: career.name || "", description: career.description || "", purpose: career.purpose || "",
        skills: career.skills || { technical: [], soft: [] },
        technologies: career.technologies || [], roadmap: career.roadmap || [],
        certification: career.certification || [], universities: career.universities || [],
        careerOpportunities: career.careerOpportunities || [],
        relatedSpecializations: career.relatedSpecializations || [],
        projectsExamples: career.projectsExamples || [],
        learningResources: career.learningResources || { books: [], courses: [], blogs: [] },
        salaryAndMarket: career.salaryAndMarket || { junior: "", mid: "", senior: "" },
        advice: career.advice || "",
        clusterId: career.clusterId || "",
        tuitionFee: career.tuitionFee || "",
      });
      setTempInputs({
        technical: (career.skills?.technical || []).join(", "),
        soft: (career.skills?.soft || []).join(", "),
        technologies: (career.technologies || []).join(", "),
        roadmap: (career.roadmap || []).join(", "),
        certification: (career.certification || []).join(", "),
        universities: (career.universities || []).join(", "),
        careerOpportunities: (career.careerOpportunities || []).join(", "),
        relatedSpecializations: (career.relatedSpecializations || []).join(", "),
        projectsExamples: (career.projectsExamples || []).join(", "),
        books: (career.learningResources?.books || []).join(", "),
        courses: (career.learningResources?.courses || []).join(", "),
        blogs: (career.learningResources?.blogs || []).join(", "),
      });
    } else {
      setForm(emptyForm);
      setTempInputs({
        technical: "", soft: "", technologies: "", roadmap: "",
        certification: "", universities: "", careerOpportunities: "",
        relatedSpecializations: "", projectsExamples: "",
        books: "", courses: "", blogs: "",
      });
    }
    setActiveTab("basic");
  }, [career, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsed = {
      ...form,
      tuitionFee: form.tuitionFee ? parseInt(form.tuitionFee) : null,
      skills: {
        technical: tempInputs.technical.split(",").map((s) => s.trim()).filter(Boolean),
        soft: tempInputs.soft.split(",").map((s) => s.trim()).filter(Boolean),
      },
      technologies: tempInputs.technologies.split(",").map((s) => s.trim()).filter(Boolean),
      roadmap: tempInputs.roadmap.split(",").map((s) => s.trim()).filter(Boolean),
      certification: tempInputs.certification.split(",").map((s) => s.trim()).filter(Boolean),
      universities: tempInputs.universities.split(",").map((s) => s.trim()).filter(Boolean),
      careerOpportunities: tempInputs.careerOpportunities.split(",").map((s) => s.trim()).filter(Boolean),
      relatedSpecializations: tempInputs.relatedSpecializations.split(",").map((s) => s.trim()).filter(Boolean),
      projectsExamples: tempInputs.projectsExamples.split(",").map((s) => s.trim()).filter(Boolean),
      learningResources: {
        books: tempInputs.books.split(",").map((s) => s.trim()).filter(Boolean),
        courses: tempInputs.courses.split(",").map((s) => s.trim()).filter(Boolean),
        blogs: tempInputs.blogs.split(",").map((s) => s.trim()).filter(Boolean),
      },
    };
    onSubmit(parsed);
  };

  const tabs = [
    { id: "basic", label: t("admin.form.tab_basic") },
    { id: "skills", label: t("admin.form.tab_skills") },
    { id: "career", label: t("admin.form.tab_career") },
  ];

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all";
  const labelClass = "block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider";

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: "spring", damping: 25, stiffness: 400 }} onClick={(e) => e.stopPropagation()} className="relative w-full max-w-2xl bg-[#0c1222] border border-white/10 rounded-2xl shadow-2xl z-10 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-lg font-bold text-white">
                {career ? t("admin.careers.edit_title") : t("admin.careers.create_title")}
              </h2>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-6 pt-4">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === tab.id ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/20" : "bg-white/5 text-white/40 hover:text-white/60 border border-transparent"}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {activeTab === "basic" && (
                <>
                  <div>
                    <label className={labelClass}>{t("admin.form.career_name")} *</label>
                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="Frontend Developer" required />
                  </div>
                  <div>
                    <label className={labelClass}>{t("admin.form.description")}</label>
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputClass} min-h-[80px] resize-none`} />
                  </div>
                  <div>
                    <label className={labelClass}>{t("admin.form.purpose")}</label>
                    <textarea value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} className={`${inputClass} min-h-[60px] resize-none`} />
                  </div>
                  <div>
                    <label className={labelClass}>{t("admin.form.cluster")}</label>
                    <CustomSelect
                      value={form.clusterId}
                      onChange={(val) => setForm({ ...form, clusterId: val })}
                      placeholder={t("admin.form.select_cluster")}
                      icon={FolderKanban}
                      searchable
                      options={clusters.map((c) => ({
                        value: c.id,
                        label: c.clusterName,
                      }))}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{t("admin.form.advice")}</label>
                    <textarea value={form.advice} onChange={(e) => setForm({ ...form, advice: e.target.value })} className={`${inputClass} min-h-[60px] resize-none`} />
                  </div>
                </>
              )}

              {activeTab === "skills" && (
                <>
                  <div>
                    <label className={labelClass}>{t("admin.form.technical_skills")}</label>
                    <input type="text" value={tempInputs.technical} onChange={(e) => setTempInputs({ ...tempInputs, technical: e.target.value })} className={inputClass} placeholder="React, JavaScript..." />
                  </div>
                  <div>
                    <label className={labelClass}>{t("admin.form.soft_skills")}</label>
                    <input type="text" value={tempInputs.soft} onChange={(e) => setTempInputs({ ...tempInputs, soft: e.target.value })} className={inputClass} placeholder="Teamwork, Communication..." />
                  </div>
                  <div>
                    <label className={labelClass}>{t("admin.form.technologies")}</label>
                    <input type="text" value={tempInputs.technologies} onChange={(e) => setTempInputs({ ...tempInputs, technologies: e.target.value })} className={inputClass} placeholder="React, Node.js, Docker..." />
                  </div>
                  <div>
                    <label className={labelClass}>{t("admin.form.certifications")}</label>
                    <input type="text" value={tempInputs.certification} onChange={(e) => setTempInputs({ ...tempInputs, certification: e.target.value })} className={inputClass} placeholder="AWS Certified..." />
                  </div>
                  <div>
                    <label className={labelClass}>{t("admin.form.universities")}</label>
                    <input type="text" value={tempInputs.universities} onChange={(e) => setTempInputs({ ...tempInputs, universities: e.target.value })} className={inputClass} placeholder="ДМТ, ДТТ..." />
                  </div>
                </>
              )}

              {activeTab === "career" && (
                <>
                  <div>
                    <label className={labelClass}>{t("admin.form.roadmap")}</label>
                    <input type="text" value={tempInputs.roadmap} onChange={(e) => setTempInputs({ ...tempInputs, roadmap: e.target.value })} className={inputClass} placeholder="HTML → CSS → JavaScript..." />
                  </div>
                  <div>
                    <label className={labelClass}>{t("admin.form.opportunities")}</label>
                    <input type="text" value={tempInputs.careerOpportunities} onChange={(e) => setTempInputs({ ...tempInputs, careerOpportunities: e.target.value })} className={inputClass} placeholder="Team Lead, CTO..." />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className={labelClass}>{t("admin.form.salary_junior")}</label>
                      <input type="text" value={form.salaryAndMarket.junior} onChange={(e) => setForm({ ...form, salaryAndMarket: { ...form.salaryAndMarket, junior: e.target.value } })} className={inputClass} placeholder="$500-800" />
                    </div>
                    <div>
                      <label className={labelClass}>{t("admin.form.salary_mid")}</label>
                      <input type="text" value={form.salaryAndMarket.mid} onChange={(e) => setForm({ ...form, salaryAndMarket: { ...form.salaryAndMarket, mid: e.target.value } })} className={inputClass} placeholder="$1000-2000" />
                    </div>
                    <div>
                      <label className={labelClass}>{t("admin.form.salary_senior")}</label>
                      <input type="text" value={form.salaryAndMarket.senior} onChange={(e) => setForm({ ...form, salaryAndMarket: { ...form.salaryAndMarket, senior: e.target.value } })} className={inputClass} placeholder="$3000-5000" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>{t("admin.form.tuitionFee", "Нархи Шартнома (солона)")}</label>
                    <input type="number" value={form.tuitionFee} onChange={(e) => setForm({ ...form, tuitionFee: e.target.value })} className={inputClass} placeholder="5000" />
                  </div>
                  <div>
                    <label className={labelClass}>{t("admin.form.related")}</label>
                    <input type="text" value={tempInputs.relatedSpecializations} onChange={(e) => setTempInputs({ ...tempInputs, relatedSpecializations: e.target.value })} className={inputClass} placeholder="Backend Developer..." />
                  </div>
                  <div>
                    <label className={labelClass}>{t("admin.form.projects")}</label>
                    <input type="text" value={tempInputs.projectsExamples} onChange={(e) => setTempInputs({ ...tempInputs, projectsExamples: e.target.value })} className={inputClass} placeholder="Portfolio site..." />
                  </div>
                </>
              )}


            </form>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-white/5">
              <button type="button" onClick={onClose} disabled={loading} className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-sm font-semibold border border-white/10 transition-all cursor-pointer">
                {t("admin.form.cancel")}
              </button>
              <button onClick={handleSubmit} disabled={loading || !form.name.trim()} className="px-5 py-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 text-sm font-bold border border-indigo-500/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-40">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {career ? t("admin.form.save") : t("admin.form.create")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CareerForm;
