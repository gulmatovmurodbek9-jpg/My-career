import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, KeyRound, Lock, ArrowRight, ArrowLeft, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router";
import axios from "axios";
import { API } from "../../lib/config";
import { useTranslation } from "react-i18next";

const MIN_LENGTH = 6;

const ForgotPassword = () => {
    const { t } = useTranslation();
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
            setError(err.response?.data?.message || t("auth.fp_error_request"));
        } finally {
            setLoading(false);
        }
    };

    const submitNewPassword = async (e) => {
        e.preventDefault();

        if (!/^\d{6}$/.test(code.trim())) {
            setError(t("auth.fp_error_code_len"));
            return;
        }
        if (password.length < MIN_LENGTH) {
            setError(t("auth.fp_error_short", { min: MIN_LENGTH }));
            return;
        }
        if (password !== confirm) {
            setError(t("auth.fp_error_mismatch"));
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await axios.post(`${API}/auth/reset-password`, { email, code: code.trim(), password });
            setDone(true);
            setTimeout(() => navigate("/login"), 2500);
        } catch (err) {
            setError(err.response?.data?.message || t("auth.fp_error_code"));
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
                            {step === "email" ? t("auth.fp_title") : t("auth.fp_code_title")}
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            {step === "email"
                                ? t("auth.fp_sub")
                                : t("auth.fp_code_sub")}
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
                                <h2 className="text-lg font-bold text-foreground">{t("auth.fp_done_title")}</h2>
                                <p className="text-sm text-muted-foreground">
                                    {t("auth.fp_done_sub")}
                                </p>
                            </div>
                            <Link to="/login" className="text-sm font-bold text-primary hover:underline">
                                {t("auth.fp_done_now")}
                            </Link>
                        </motion.div>
                    ) : step === "email" ? (
                        <form onSubmit={sendCode} className="space-y-6">
                            <div className="space-y-2">
                                <label htmlFor="fp-email" className="text-sm font-medium text-muted-foreground ml-1">
                                    {t("auth.email")}
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
                                        {t("auth.fp_send")}
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </motion.button>
                        </form>
                    ) : (
                        <form onSubmit={submitNewPassword} className="space-y-6">
                            <p className="text-center text-xs text-muted-foreground">
                                {t("auth.fp_sent", { email })}
                            </p>

                            <div className="space-y-2">
                                <label htmlFor="fp-code" className="text-sm font-medium text-muted-foreground ml-1">
                                    {t("auth.fp_code_label")}
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
                                    {t("auth.fp_new_password")}
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
                                        aria-label={show ? t("auth.hide_password") : t("auth.show_password")}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="fp-confirm" className="text-sm font-medium text-muted-foreground ml-1">
                                    {t("auth.fp_repeat_password")}
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
                                        {t("auth.fp_submit")}
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
                                    {t("auth.fp_resend")}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setStep("email"); setError(null); setCode(""); }}
                                    className="font-bold text-muted-foreground hover:text-foreground"
                                >
                                    {t("auth.fp_change_email")}
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
                            {t("auth.fp_back")}
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
