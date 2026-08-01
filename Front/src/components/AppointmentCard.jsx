import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Calendar, Brain, Users, Clock, MapPin, X, AlertCircle } from 'lucide-react';
import { Link } from 'react-router';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { API } from '../lib/config';
import { useAuthStore } from '../store/authStore';

const labels = {
    tj: {
        title: "Интихоби Ихтисос",
        subtitle: "Қайси намуди машварат?",
        select: "Интихобро кун...",
        withAI: "Бо AI",
        withSpecialists: "Бо Мутахасисон",
        online: "Online",
        offline: "Offline",
        start: "Оғоз",
        queuePosition: "Навбат #",
        registeredAt: "Сабтшуда:",
        selectTime: "Вақт интихоб кун",
        cancel: "Бекор кард",
        estimated: "Вақти интизор:",
        minutes: "дақиқа",
        selectDateTime: "Санаи вақт интихоб кун",
        location: "Ҷойгиркунӣ",
        error: "Хатогӣ",
        success: "Муваффақ",
        changingQueue: "Ивезкунанда...",
    },
    ru: {
        title: "Выбор специальности",
        subtitle: "Какой тип консультации?",
        select: "Выбери...",
        withAI: "С ИИ",
        withSpecialists: "Со специалистом",
        online: "Онлайн",
        offline: "Офлайн",
        start: "Начать",
        queuePosition: "Очередь #",
        registeredAt: "Записано:",
        selectTime: "Выберите время",
        cancel: "Отменить",
        estimated: "Ожид. время:",
        minutes: "мин",
        selectDateTime: "Выберите дату и время",
        location: "Место",
        error: "Ошибка",
        success: "Успех",
        changingQueue: "Изменение...",
    },
    en: {
        title: "Career Selection",
        subtitle: "Which consultation type?",
        select: "Choose...",
        withAI: "With AI",
        withSpecialists: "With Specialist",
        online: "Online",
        offline: "Offline",
        start: "Start",
        queuePosition: "Queue #",
        registeredAt: "Registered:",
        selectTime: "Select time",
        cancel: "Cancel",
        estimated: "Est. wait:",
        minutes: "min",
        selectDateTime: "Select date & time",
        location: "Location",
        error: "Error",
        success: "Success",
        changingQueue: "Changing...",
    },
};

export default function AppointmentCard() {
    const { i18n } = useTranslation();
    const lang = i18n.language || 'tj';
    const t = labels[lang] || labels.tj;
    const token = useAuthStore((s) => s.token);
    
    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState(null);
    const [subType, setSubType] = useState(null);
    const [appointment, setAppointment] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showTimeModal, setShowTimeModal] = useState(false);
    const [selectedDateTime, setSelectedDateTime] = useState({ date: '', time: '', location: '' });

    const options = [
        { id: 'ai', label: t.withAI, icon: Brain, hasSubType: false },
        { id: 'specialist', label: t.withSpecialists, icon: Users, hasSubType: true, subOptions: ['ONLINE', 'OFFLINE'] },
    ];

    const handleSelect = async (option) => {
        if (option.hasSubType) {
            setSelected(option);
            setIsOpen(false);
        } else {
            await createAppointment('AI');
        }
    };

    const handleSubTypeSelect = async (subType) => {
        setSubType(subType);
        setShowTimeModal(true);
    };

    const createAppointment = async (type) => {
        setLoading(true);
        setError(null);

        try {
            const appointmentData = {
                type,
                email: '',
                phoneNumber: selectedDateTime.phone || null,
                appointmentDate: selectedDateTime.date || null,
                appointmentTime: selectedDateTime.time || null,
                location: selectedDateTime.location || null,
            };

            const { data } = await axios.post(`${API}/appointments`, appointmentData, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setAppointment(data);
            setSelected(null);
            setSubType(null);
            setShowTimeModal(false);
            setSelectedDateTime({ date: '', time: '', location: '' });

            setTimeout(() => setAppointment(null), 5000);
        } catch (err) {
            setError(err.response?.data?.message || t.error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelAppointment = async () => {
        if (!appointment || !appointment.id) return;
        
        setLoading(true);
        try {
            await axios.delete(`${API}/appointments/${appointment.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAppointment(null);
        } catch (err) {
            setError(err.response?.data?.message || t.error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="col-span-12 lg:col-span-4">
            <div className="glass-card p-6 h-full flex flex-col justify-between group">
                {/* State: No appointment yet */}
                {!appointment ? (
                    <>
                        <div className="space-y-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 p-0.5 shadow-lg group-hover:rotate-3 transition-transform duration-500">
                                <div className="w-full h-full rounded-[0.6rem] bg-card flex items-center justify-center">
                                    <Calendar className="w-6 h-6 text-cyan-400" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-foreground">{t.title}</h3>
                                <p className="text-muted-foreground font-bold text-xs opacity-60">{t.subtitle}</p>
                            </div>
                        </div>

                        {error && (
                            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-200 text-xs">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="mt-6 relative">
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="w-full px-4 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-foreground font-bold text-sm flex items-center justify-between hover:border-cyan-400 transition-all"
                            >
                                <span className="text-cyan-300">
                                    {selected ? selected.label : t.select}
                                </span>
                                <ChevronDown
                                    className={`w-4 h-4 text-cyan-300 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                />
                            </button>

                            <AnimatePresence>
                                {isOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                        className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-20 overflow-hidden"
                                    >
                                        {options.map((option) => {
                                            const Icon = option.icon;
                                            return (
                                                <button
                                                    key={option.id}
                                                    onClick={() => handleSelect(option)}
                                                    className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-cyan-500/10 border-b border-slate-700/50 last:border-b-0 transition-all text-sm font-bold text-foreground"
                                                >
                                                    <Icon className="w-4 h-4 text-cyan-400" />
                                                    {option.label}
                                                </button>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Sub-type selector for Specialists */}
                        {selected?.hasSubType && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 space-y-2"
                            >
                                {selected.subOptions.map((subOpt) => (
                                    <button
                                        key={subOpt}
                                        onClick={() => handleSubTypeSelect(subOpt)}
                                        disabled={loading}
                                        className="w-full px-3 py-2 text-xs font-bold rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:border-blue-400 transition-all disabled:opacity-50"
                                    >
                                        {subOpt === 'ONLINE' ? t.online : t.offline}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </>
                ) : (
                    /* State: Appointment confirmed */
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-4"
                    >
                        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                            <div className="text-green-300 font-black text-lg mb-2">✓ {t.success}</div>
                            <div className="text-xs text-green-200 opacity-70">Дархостҳои шумо қабул шуд</div>
                        </div>

                        <div className="space-y-3 bg-slate-700/30 rounded-lg p-3">
                            <div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-300 opacity-70 mb-1">{t.queuePosition}</div>
                                <div className="text-2xl font-black text-cyan-300">#{appointment.queuePosition}</div>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-300">
                                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                                <span>{t.registeredAt} {new Date(appointment.createdAt).toLocaleString(lang === 'tj' ? 'fa' : lang)}</span>
                            </div>

                            {appointment.appointmentDate && (
                                <div className="flex items-center gap-2 text-xs text-slate-300">
                                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                                    <span>{new Date(appointment.appointmentDate).toLocaleDateString()}</span>
                                    {appointment.appointmentTime && <span>@ {appointment.appointmentTime}</span>}
                                </div>
                            )}

                            {appointment.location && (
                                <div className="flex items-center gap-2 text-xs text-slate-300">
                                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                                    <span>{appointment.location}</span>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleCancelAppointment}
                            disabled={loading}
                            className="w-full px-3 py-2 text-xs font-bold rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 hover:border-red-400 transition-all disabled:opacity-50"
                        >
                            {loading ? t.changingQueue : `✕ ${t.cancel}`}
                        </button>
                    </motion.div>
                )}
            </div>

            {/* DateTime Modal for Specialists */}
            <AnimatePresence>
                {showTimeModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                        onClick={() => setShowTimeModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full space-y-4"
                        >
                            <h3 className="text-xl font-black text-white">{t.selectDateTime}</h3>

                            <input
                                type="date"
                                value={selectedDateTime.date}
                                onChange={(e) => setSelectedDateTime((prev) => ({ ...prev, date: e.target.value }))}
                                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white outline-none focus:border-cyan-400"
                            />

                            <input
                                type="time"
                                value={selectedDateTime.time}
                                onChange={(e) => setSelectedDateTime((prev) => ({ ...prev, time: e.target.value }))}
                                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white outline-none focus:border-cyan-400"
                            />

                            {subType === 'OFFLINE' && (
                                <input
                                    type="text"
                                    placeholder={t.location}
                                    value={selectedDateTime.location}
                                    onChange={(e) => setSelectedDateTime((prev) => ({ ...prev, location: e.target.value }))}
                                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white outline-none focus:border-cyan-400 placeholder-slate-400"
                                />
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowTimeModal(false)}
                                    className="flex-1 px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white font-bold text-sm hover:bg-slate-600 transition-all"
                                >
                                    {t.cancel}
                                </button>
                                <button
                                    onClick={() => createAppointment(subType)}
                                    disabled={loading || !selectedDateTime.date || !selectedDateTime.time}
                                    className="flex-1 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white font-bold text-sm transition-all"
                                >
                                    {loading ? '...' : t.start}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
