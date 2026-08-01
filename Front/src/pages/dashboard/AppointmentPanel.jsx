import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  Star,
  UserRoundCheck,
  Wifi,
  Building2,
  XCircle,
} from "lucide-react";
import axios from "axios";
import { API } from "../../lib/config";
import { useAuthStore } from "../../store/authStore";

const statusLabels = {
  PENDING: "Интизор",
  IN_PROGRESS: "Дар раванд",
  CONFIRMED: "Тасдиқ шуд",
  COMPLETED: "Анҷом ёфт",
  CANCELLED: "Бекор",
};

const statusClass = {
  PENDING: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  IN_PROGRESS: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  CONFIRMED: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
  COMPLETED: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  CANCELLED: "bg-red-500/10 text-red-300 border-red-500/20",
};

export default function AppointmentPanel() {
  const { user, token } = useAuthStore();
  const isSpecialist = user?.role === "specialist";

  if (isSpecialist) {
    return <SpecialistSchedule token={token} />;
  }

  return <UserBooking user={user} token={token} />;
}

function UserBooking({ user, token }) {
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const [specialists, setSpecialists] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedSpecialist, setSelectedSpecialist] = useState(null);
  const [selectedType, setSelectedType] = useState("OFFLINE");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [form, setForm] = useState({
    email: user?.email || "",
    phoneNumber: "",
    contactMethod: "telegram",
    notes: "",
  });
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [specialistsError, setSpecialistsError] = useState("");

  const selected = specialists.find((item) => item.id === selectedSpecialist);

  const fetchInitial = async () => {
    setLoading(true);
    setSpecialistsError("");
    try {
      const specialistRes = await axios.get(`${API}/users/specialists`);
      setSpecialists(specialistRes.data || []);
      setSelectedSpecialist((current) => {
        if (current && specialistRes.data?.some((item) => item.id === current)) return current;
        return specialistRes.data?.[0]?.id || null;
      });

      try {
        const appointmentRes = await axios.get(`${API}/appointments/my`, { headers });
        setAppointments(appointmentRes.data || []);
      } catch {
        setAppointments([]);
      }
    } catch {
      setSpecialists([]);
      setSelectedSpecialist(null);
      setSpecialistsError("Мутахассисон бор нашуданд. Backend ё пайвастшавиро санҷед.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitial();
  }, [token]);

  useEffect(() => {
    if (!selectedSpecialist || !selectedDate) return;
    const fetchSlots = async () => {
      setSlotsLoading(true);
      setSelectedTime("");
      try {
        const { data } = await axios.get(`${API}/appointments/availability/${selectedSpecialist}`, {
          params: { date: selectedDate },
        });
        setSlots(data.slots || []);
      } catch {
        setSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    };
    fetchSlots();
  }, [selectedSpecialist, selectedDate]);

  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setMessage(null);
    if (!selectedSpecialist) return setMessage({ type: "error", text: "Мутахассисро интихоб кунед" });
    if (!selectedTime) return setMessage({ type: "error", text: "Вақти озодро интихоб кунед" });
    if (!form.email || !form.phoneNumber) return setMessage({ type: "error", text: "Email ва телефон зарур аст" });

    setSubmitting(true);
    try {
      const payload = {
        type: selectedType,
        specialistId: selectedSpecialist,
        email: form.email,
        phoneNumber: form.phoneNumber,
        contactMethod: selectedType === "ONLINE" ? form.contactMethod : undefined,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        location: selectedType === "OFFLINE" ? selected?.meetingLocation || "Маркази машваратӣ" : undefined,
        notes: form.notes,
      };
      await axios.post(`${API}/appointments`, payload, { headers });
      setMessage({ type: "success", text: "Дархост қабул шуд. Мутахассис дар вақти интихобшуда ба шумо кӯмак мекунад." });
      setForm((prev) => ({ ...prev, notes: "" }));
      setSlots((prev) => prev.map((slot) => (slot.time === selectedTime ? { ...slot, available: false } : slot)));
      setSelectedTime("");
      await fetchInitial();
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Хато ҳангоми фиристодани дархост" });
    } finally {
      setSubmitting(false);
    }
  };

  const rateAppointment = async (appointment, rating) => {
    try {
      await axios.post(`${API}/appointments/${appointment.id}/rating`, { rating }, { headers });
      await fetchInitial();
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Рейтинг сабт нашуд" });
    }
  };

  const cancelAppointment = async (appointmentId) => {
    try {
      await axios.delete(`${API}/appointments/${appointmentId}`, { headers });
      await fetchInitial();
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Дархост бекор нашуд" });
    }
  };

  if (loading) {
    return <CenteredLoader />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      <header className="max-w-3xl">
        <h1 className="text-2xl md:text-3xl font-black leading-tight text-foreground">Машварати офлайн ва онлайн</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Мутахассисро интихоб кунед, вақти озоди ӯро бинед ва барои машварат брон кунед.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 xl:gap-6 lg:grid-cols-[minmax(280px,0.9fr)_minmax(420px,1.1fr)]">
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
            <UserRoundCheck className="h-4 w-4" />
            Мутахассисон
          </div>
          <div className="grid gap-3">
            {specialists.map((specialist) => (
              <button
                key={specialist.id}
                onClick={() => setSelectedSpecialist(specialist.id)}
                className={`rounded-2xl border p-4 text-left transition ${
                  selectedSpecialist === specialist.id
                    ? "border-primary/40 bg-primary/10"
                    : "border-white/10 bg-card/60 hover:border-primary/20"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-foreground">{specialist.name || specialist.email}</h3>
                    <p className="mt-1 text-xs font-bold text-primary">{specialist.specialization || "Мушовири касбӣ"}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-400">
                    <Star className="h-3 w-3 fill-current" />
                    {Number(specialist.ratingAverage || 0).toFixed(1)}
                  </span>
                </div>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{specialist.bio || "Маълумоти мутахассис ҳоло пурра нашудааст."}</p>
                {specialist.meetingLocation && (
                  <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {specialist.meetingLocation}
                  </p>
                )}
              </button>
            ))}
            {specialistsError && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-sm leading-6 text-red-300">
                {specialistsError}
              </div>
            )}
            {!specialistsError && specialists.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/10 bg-card/50 p-5 text-sm leading-6 text-muted-foreground">
                Мутахассиси дастрас ҳоло нест.
              </div>
            )}
          </div>
        </section>

        <motion.form onSubmit={submit} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/10 bg-card/70 p-5 md:p-6 shadow-xl">
          <div className="mb-5 flex flex-wrap gap-2">
            <ModeButton active={selectedType === "OFFLINE"} onClick={() => setSelectedType("OFFLINE")} icon={Building2} label="Офлайн" />
            <ModeButton active={selectedType === "ONLINE"} onClick={() => setSelectedType("ONLINE")} icon={Wifi} label="Онлайн" />
          </div>

          {message && (
            <div className={`mb-4 flex gap-2 rounded-xl border p-3 text-sm ${message.type === "success" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-red-500/30 bg-red-500/10 text-red-300"}`}>
              {message.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field icon={Mail} label="Email" type="email" value={form.email} onChange={(value) => updateForm("email", value)} />
            <Field icon={Phone} label="Телефон" value={form.phoneNumber} onChange={(value) => updateForm("phoneNumber", value)} placeholder="+992..." />
            <Field icon={Calendar} label="Сана" type="date" value={selectedDate} onChange={setSelectedDate} />
            {selectedType === "ONLINE" && (
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <MessageCircle className="h-4 w-4" />
                  Тарзи тамос
                </span>
                <select value={form.contactMethod} onChange={(event) => updateForm("contactMethod", event.target.value)} className="w-full rounded-xl border border-white/10 bg-background px-4 py-3 text-sm text-foreground outline-none">
                  <option value="telegram">Telegram</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="viber">Viber</option>
                </select>
              </label>
            )}
          </div>

          <div className="mt-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Clock className="h-4 w-4" />
              Вақтҳои озод
            </div>
            {slotsLoading ? (
              <div className="flex h-24 items-center justify-center rounded-xl border border-white/10">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : slots.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 p-5 text-center text-sm text-muted-foreground">
                Барои ин сана вақти озод нест.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => setSelectedTime(slot.time)}
                    className={`rounded-xl border px-3 py-2 text-sm font-bold transition ${
                      selectedTime === slot.time
                        ? "border-primary bg-primary text-primary-foreground"
                        : slot.available
                        ? "border-white/10 bg-white/5 text-foreground hover:border-primary/30"
                        : "cursor-not-allowed border-white/5 bg-white/[0.02] text-muted-foreground/30"
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedType === "OFFLINE" && selected?.meetingLocation && (
            <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
              <MapPin className="mr-2 inline h-4 w-4 text-primary" />
              {selected.meetingLocation}
            </div>
          )}

          <label className="mt-5 block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Эзоҳ</span>
            <textarea
              value={form.notes}
              onChange={(event) => updateForm("notes", event.target.value)}
              rows={4}
              className="w-full rounded-xl border border-white/10 bg-background px-4 py-3 text-sm text-foreground outline-none"
              placeholder="Масалан: мехоҳам дар интихоби ихтисоси тиббӣ кӯмак гирам..."
            />
          </label>

          <button disabled={submitting} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-black text-primary-foreground hover:opacity-90 disabled:opacity-60">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Брон кардан
          </button>
        </motion.form>
      </div>

      <section className="rounded-2xl border border-white/10 bg-card/60 p-5 md:p-6">
        <h2 className="mb-4 font-black text-foreground">Дархостҳои ман</h2>
        {appointments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ҳоло дархост нест.</p>
        ) : (
          <div className="grid gap-3">
            {appointments.map((appointment) => (
              <article key={appointment.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-foreground">{appointment.specialist?.name || "AI / Мутахассис"}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {appointment.type} · {appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString() : ""} {appointment.appointmentTime || ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass[appointment.status] || "border-white/10 text-muted-foreground"}`}>
                      {statusLabels[appointment.status] || appointment.status}
                    </span>
                    {["PENDING", "IN_PROGRESS", "CONFIRMED"].includes(appointment.status) && (
                      <button
                        type="button"
                        onClick={() => cancelAppointment(appointment.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-300 hover:bg-red-500/20"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Бекор
                      </button>
                    )}
                  </div>
                </div>
                {appointment.status === "COMPLETED" && appointment.specialistId && !appointment.rating && (
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground">Рейтинг:</span>
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button key={rating} onClick={() => rateAppointment(appointment, rating)} className="text-amber-400 hover:scale-110">
                        <Star className="h-5 w-5 fill-current" />
                      </button>
                    ))}
                  </div>
                )}
                {appointment.rating && (
                  <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    {appointment.rating}/5
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SpecialistSchedule({ token }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/appointments/specialist/my`, { headers });
      setAppointments(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [token]);

  const updateStatus = async (id, status) => {
    await axios.patch(`${API}/appointments/${id}/status`, { status }, { headers });
    fetchAppointments();
  };

  if (loading) return <CenteredLoader />;

  return (
    <div className="space-y-6 pb-16">
      <header>
        <h1 className="text-2xl font-black text-foreground">Ҷадвали машваратҳои ман</h1>
        <p className="mt-2 text-sm text-muted-foreground">Дархостҳои корбаронро бинед ва ҳолаташонро нав кунед.</p>
      </header>
      <div className="grid gap-4">
        {appointments.map((appointment) => (
          <article key={appointment.id} className="rounded-2xl border border-white/10 bg-card/70 p-5">
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <h3 className="font-black text-foreground">{appointment.user?.name || appointment.user?.email}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {appointment.type} · {appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString() : ""} {appointment.appointmentTime}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{appointment.phoneNumber} · {appointment.email}</p>
                {appointment.notes && <p className="mt-3 text-sm text-muted-foreground">{appointment.notes}</p>}
              </div>
              <span className={`h-fit rounded-full border px-3 py-1 text-xs font-bold ${statusClass[appointment.status] || "border-white/10 text-muted-foreground"}`}>
                {statusLabels[appointment.status] || appointment.status}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {["CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((status) => (
                <button key={status} onClick={() => updateStatus(appointment.id, status)} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-muted-foreground hover:border-primary/30 hover:text-primary">
                  {statusLabels[status]}
                </button>
              ))}
            </div>
          </article>
        ))}
        {appointments.length === 0 && <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-muted-foreground">Ҳоло дархост нест.</p>}
      </div>
    </div>
  );
}

function ModeButton({ active, onClick, icon: Icon, label }) {
  return (
    <button type="button" onClick={onClick} className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold ${active ? "border-primary bg-primary text-primary-foreground" : "border-white/10 bg-white/5 text-muted-foreground"}`}>
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function Field({ icon: Icon, label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary/40"
      />
    </label>
  );
}

function CenteredLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
