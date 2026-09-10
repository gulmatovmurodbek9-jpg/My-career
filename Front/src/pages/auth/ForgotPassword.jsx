import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, KeyRound, Lock, ArrowRight, ArrowLeft, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router";
import axios from "axios";
import { API } from "../../lib/config";

const MIN_LENGTH = 6;

/*
 * Барқарорсозӣ дар як саҳифа, ду қадам: имейл → код + пароли нав.
 * Пеш пайванд ба почта мерафт, вале дар телефон гузаштан аз нома ба браузер
 * ва бозгашт нороҳат буд — коди 6-рақамаро оддӣ нусха кардан мумкин аст.
 */
const ForgotPassword = () => {
    const navigate = useNavigate();

    const [step, setStep] = useState("email");
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [done, setDone] = useState(false);

    const sendCode = async (e) => {
        e?.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await axios.post(`${API}/auth/forgot-password`, { email });
            setStep("code");
        } catch (err) {
            setError(err.response?.data?.message || "Дархост нашуд. Дертар боз кӯшиш кунед.");
        } finally {
            setLoading(false);
        }
    };

    const submitNewPassword = async (e) => {
        e.preventDefault();

        if (!/^\d{6}$/.test(code.trim())) {
            setError("Код бояд 6 рақам бошад");
            return;
        }
        if (password.length < MIN_LENGTH) {
            setError(`Парол бояд на кам аз ${MIN_LENGTH} аломат бошад`);
            return;
        }
        if (password !== confirm) {
            setError("Паролҳо мувофиқат намекунанд");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await axios.post(`${API}/auth/reset-password`, { email, code: code.trim(), password });
            setDone(true);
            setTimeout(() => navigate("/login"), 2500);
        } catch (err) {
            setError(err.response?.data?.message || "Код нодуруст ё кӯҳна шудааст");
        } finally {
            setLoading(false);
        }
    };

    const inputClass =
        "w-full bg-muted/20 border border-border/50 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-primary/50 focus:bg-muted/30 transition-all text-foreground";

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-hero py-12 px-4">
            <div className="pointer-events-none absolute top-1/4 -left-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
            <div className="pointer-events-none absolute bottom-1/4 -right-20 w-80 h-80 bg-secondary/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "2s" }} />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="glass-card p-6 sm:p-10 shadow-2xl">
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent-blue mb-4 shadow-lg shadow-primary/20"
                        >
                            <KeyRound className="w-8 h-8 text-primary-foreground" />
                        </motion.div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                            {step === "email" ? "Паролро фаромӯш кардед?" : "Коди тасдиқ"}
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            {step === "email"
                                ? "Имейли худро нависед — мо коди 6-рақама мефиристем"
                                : "Кодро аз нома нависед ва пароли навро гузоред"}
                        </p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive text-sm"
                        >
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            {error}
                        </motion.div>
                    )}

                    {done ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-6 text-center"
                        >
                            <div className="flex justify-center">
                                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
                                    <CheckCircle2 className="h-7 w-7" />
                                </span>
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-lg font-bold text-foreground">Парол иваз шуд</h2>
                                <p className="text-sm text-muted-foreground">
                                    Ба саҳифаи вуруд бурда мешавед…
                                </p>
                            </div>
                            <Link to="/login" className="text-sm font-bold text-primary hover:underline">
                                Ҳозир ворид шудан
                            </Link>
                        </motion.div>
                    ) : step === "email" ? (
                        <form onSubmit={sendCode} className="space-y-6">
                            <div className="space-y-2">
                                <label htmlFor="fp-email" className="text-sm font-medium text-muted-foreground ml-1">
                                    Имейл
                                </label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        id="fp-email"
                                        type="email"
                                        required
                                        autoComplete="email"
                                        placeholder="nom@tjk.com"
                                        className={inputClass}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                disabled={loading}
                                type="submit"
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-accent-blue text-primary-foreground font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                    <>
                                        Фиристодани код
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </motion.button>
                        </form>
                    ) : (
                        <form onSubmit={submitNewPassword} className="space-y-6">
                            <p className="text-center text-xs text-muted-foreground">
                                Код ба <span className="font-semibold text-foreground break-all">{email}</span> фиристода
                                шуд. 15 дақиқа эътибор дорад.
                            </p>

                            <div className="space-y-2">
                                <label htmlFor="fp-code" className="text-sm font-medium text-muted-foreground ml-1">
                                    Коди 6-рақама
                                </label>
                                <input
                                    id="fp-code"
                                    type="text"
                                    required
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    maxLength={6}
                                    placeholder="000000"
                                    className="w-full bg-muted/20 border border-border/50 rounded-xl py-3.5 px-4 text-center text-2xl font-bold tracking-[0.5em] focus:outline-none focus:border-primary/50 focus:bg-muted/30 transition-all text-foreground"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="fp-password" className="text-sm font-medium text-muted-foreground ml-1">
                                    Пароли нав
                                </label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        id="fp-password"
                                        type={show ? "text" : "password"}
                                        required
                                        minLength={MIN_LENGTH}
                                        autoComplete="new-password"
                                        placeholder="••••••••"
                                        className={`${inputClass} pr-12`}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShow((v) => !v)}
                                        aria-label={show ? "Пинҳон кардани парол" : "Нишон додани парол"}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="fp-confirm" className="text-sm font-medium text-muted-foreground ml-1">
                                    Такрори парол
                                </label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        id="fp-confirm"
                                        type={show ? "text" : "password"}
                                        required
                                        minLength={MIN_LENGTH}
                                        autoComplete="new-password"
                                        placeholder="••••••••"
                                        className={inputClass}
                                        value={confirm}
                                        onChange={(e) => setConfirm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                disabled={loading}
                                type="submit"
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-accent-blue text-primary-foreground font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                    <>
                                        Иваз кардани парол
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </motion.button>

                            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs">
                                <button
                                    type="button"
                                    onClick={sendCode}
                                    disabled={loading}
                                    className="font-bold text-primary hover:underline disabled:opacity-50"
                                >
                                    Кодро дубора фиристед
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setStep("email"); setError(null); setCode(""); }}
                                    className="font-bold text-muted-foreground hover:text-foreground"
                                >
                                    Имейлро иваз кунед
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="mt-8 text-center border-t border-border/50 pt-8">
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Бозгашт ба вуруд
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
