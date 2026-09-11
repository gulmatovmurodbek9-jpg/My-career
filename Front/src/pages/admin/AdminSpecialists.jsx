import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Loader2,
  Save,
  Star,
  UserRoundCheck,
  X,
  Edit,
  CalendarClock,
} from "lucide-react";
import axios from "axios";
import { API } from "../../lib/config";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "../../components/toast/ToastProvider";
import { useTranslation } from "react-i18next";

const DEFAULT_AVAILABILITY = {
  monday: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
  tuesday: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
  wednesday: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
  thursday: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
  friday: ["09:00", "10:00", "11:00", "14:00", "15:00"],
};

const emptyForm = {
  name: "",
  email: "",
  password: "",
  phoneNumber: "",
  specialization: "",
  bio: "",
  meetingLocation: "",
  avatarUrl: "",
  isActive: true,
  weeklyAvailabilityText: JSON.stringify(DEFAULT_AVAILABILITY, null, 2),
};

export default function AdminSpecialists() {
  const { token } = useAuthStore();
  const toast = useToast();
  const { t } = useTranslation();
  const [specialists, setSpecialists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const authHeaders = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  const fetchSpecialists = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/users/admin/specialists`, authHeaders);
      setSpecialists(data || []);
    } catch (error) {
      toast.error(t("admin.specialists.load_error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecialists();
  }, [token]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (specialist) => {
    setEditing(specialist);
    setForm({
      name: specialist.name || "",
      email: specialist.email || "",
      password: "",
      phoneNumber: specialist.phoneNumber || "",
      specialization: specialist.specialization || "",
      bio: specialist.bio || "",
      meetingLocation: specialist.meetingLocation || "",
      avatarUrl: specialist.avatarUrl || "",
      isActive: specialist.isActive !== false,
      weeklyAvailabilityText: JSON.stringify(specialist.weeklyAvailability || DEFAULT_AVAILABILITY, null, 2),
    });
    setFormOpen(true);
  };

  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      let weeklyAvailability;
      try {
        weeklyAvailability = JSON.parse(form.weeklyAvailabilityText || "{}");
      } catch {
        toast.error(t("admin.specialists.json_error"));
        return;
      }

      const payload = {
        name: form.name,
        email: form.email,
        phoneNumber: form.phoneNumber,
        specialization: form.specialization,
        bio: form.bio,
        meetingLocation: form.meetingLocation,
        avatarUrl: form.avatarUrl,
        isActive: form.isActive,
        weeklyAvailability,
      };
      if (form.password) payload.password = form.password;

      if (editing) {
        await axios.patch(`${API}/users/admin/specialists/${editing.id}`, payload, authHeaders);
        toast.success(t("admin.specialists.updated_ok"));
      } else {
        await axios.post(`${API}/users/admin/specialists`, { ...payload, password: form.password }, authHeaders);
        toast.success(t("admin.specialists.created_ok"));
      }

      setFormOpen(false);
      fetchSpecialists();
    } catch (error) {
      toast.error(error.response?.data?.message || t("admin.specialists.save_error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white">{t("admin.specialists.title")}</h1>
          <p className="mt-1 text-[15px] text-white/45">{t("admin.specialists.subtitle")}</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/20 px-4 py-2.5 text-[15px] font-bold text-indigo-300 hover:bg-indigo-500/30"
        >
          <Plus className="h-4 w-4" />
          {t("admin.specialists.add")}
        </button>
      </div>

      {formOpen && (
        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={submit}
          className="rounded-2xl border border-white/10 bg-[#0f172a]/80 p-5"
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-bold text-white">{editing ? t("admin.specialists.edit_title") : t("admin.specialists.create_title")}</h2>
            <button type="button" onClick={() => setFormOpen(false)} className="rounded-lg p-2 text-white/55 hover:bg-white/5 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label={t("admin.specialists.name")} value={form.name} onChange={(value) => updateForm("name", value)} required />
            <Field label={t("admin.specialists.login_email")} type="email" value={form.email} onChange={(value) => updateForm("email", value)} required />
            <Field label={editing ? t("admin.specialists.password_new") : t("admin.specialists.password")} type="password" value={form.password} onChange={(value) => updateForm("password", value)} required={!editing} />
            <Field label={t("admin.specialists.phone")} value={form.phoneNumber} onChange={(value) => updateForm("phoneNumber", value)} />
            <Field label={t("admin.specialists.field")} value={form.specialization} onChange={(value) => updateForm("specialization", value)} />
            <Field label={t("admin.specialists.meeting_place")} value={form.meetingLocation} onChange={(value) => updateForm("meetingLocation", value)} />
            <Field label="Avatar URL" value={form.avatarUrl} onChange={(value) => updateForm("avatarUrl", value)} />
            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[15px] font-bold text-white">
              <input type="checkbox" checked={form.isActive} onChange={(event) => updateForm("isActive", event.target.checked)} />
              {t("admin.specialists.is_active")}
            </label>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <label className="mb-2 block text-[13px] font-bold uppercase tracking-wider text-white/55">{t("admin.specialists.bio")}</label>
              <textarea
                value={form.bio}
                onChange={(event) => updateForm("bio", event.target.value)}
                rows={8}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[15px] text-white outline-none focus:border-indigo-500/50"
              />
            </div>
            <div>
              <label className="mb-2 flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-white/55">
                <CalendarClock className="h-4 w-4" />
                {t("admin.specialists.availability")}
              </label>
              <textarea
                value={form.weeklyAvailabilityText}
                onChange={(event) => updateForm("weeklyAvailabilityText", event.target.value)}
                rows={8}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-[13px] text-white outline-none focus:border-indigo-500/50"
              />
            </div>
          </div>

          <button
            disabled={saving}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-[15px] font-bold text-white hover:bg-indigo-400 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {t("admin.specialists.save")}
          </button>
        </motion.form>
      )}

      <div className="rounded-2xl border border-white/[0.06] bg-[#0f172a]/60">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
          </div>
        ) : specialists.length === 0 ? (
          <div className="py-20 text-center text-white/55">{t("admin.specialists.empty")}</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-2">
            {specialists.map((specialist) => (
              <article key={specialist.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300">
                      <UserRoundCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{specialist.name || specialist.email}</h3>
                      <p className="text-[15px] text-white/55">{specialist.specialization || t("admin.specialists.no_field")}</p>
                      <p className="mt-1 text-[13px] text-white/45">{specialist.email}</p>
                    </div>
                  </div>
                  <button onClick={() => openEdit(specialist)} className="rounded-lg p-2 text-indigo-300 hover:bg-indigo-500/10">
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-4 line-clamp-3 text-[15px] leading-6 text-white/50">{specialist.bio || t("admin.specialists.no_bio")}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-[13px]">
                  <span className="rounded-full bg-white/5 px-3 py-1 text-white/50">{specialist.phoneNumber || t("admin.specialists.no_phone")}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-amber-300">
                    <Star className="h-3 w-3 fill-current" />
                    {Number(specialist.ratingAverage || 0).toFixed(1)} ({specialist.ratingCount || 0})
                  </span>
                  <span className={`rounded-full px-3 py-1 ${specialist.isActive ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"}`}>
                    {specialist.isActive ? t("admin.specialists.active") : t("admin.specialists.inactive")}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-bold uppercase tracking-wider text-white/55">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[15px] text-white outline-none focus:border-indigo-500/50"
      />
    </label>
  );
}
