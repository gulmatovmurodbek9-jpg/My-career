import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft, Loader2, MailCheck, RotateCw } from "lucide-react";
import axios from "axios";
import { API } from "../../lib/config";

const LENGTH = 6;
const RESEND_SECONDS = 60;

// Қадами тасдиқи почта: 6 рақам аз нома. Рақами охирин ворид шуд — худкор мефиристем.
export default function EmailCodeStep({ email, onVerified, onBack }) {
    const [digits, setDigits] = useState(Array(LENGTH).fill(""));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [notice, setNotice] = useState(null);
    const [wait, setWait] = useState(RESEND_SECONDS);
    const inputs = useRef([]);

    useEffect(() => {
        inputs.current[0]?.focus();
    }, []);

    useEffect(() => {
        if (wait <= 0) return undefined;
        const timer = setTimeout(() => setWait((value) => value - 1), 1000);
        return () => clearTimeout(timer);
    }, [wait]);

    const submit = async (code) => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await axios.post(`${API}/auth/verify-email`, { email, code });
            onVerified(data);
        } catch (err) {
            setError(err.response?.data?.message || "Код санҷида нашуд. Бори дигар кӯшиш кунед.");
            setDigits(Array(LENGTH).fill(""));
            inputs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const fill = (start, text) => {
        const clean = text.replace(/\D/g, "").slice(0, LENGTH - start).split("");
        if (!clean.length) return;
        const next = [...digits];
        clean.forEach((digit, offset) => { next[start + offset] = digit; });
        setDigits(next);
        const focusAt = Math.min(start + clean.length, LENGTH - 1);
        inputs.current[focusAt]?.focus();
        if (next.every(Boolean)) submit(next.join(""));
    };

    const onKeyDown = (index, event) => {
        if (event.key === "Backspace" && !digits[index] && index > 0) {
            const next = [...digits];
            next[index - 1] = "";
            setDigits(next);
            inputs.current[index - 1]?.focus();
            event.preventDefault();
        }
        if (event.key === "ArrowLeft" && index > 0) inputs.current[index - 1]?.focus();
        if (event.key === "ArrowRight" && index < LENGTH - 1) inputs.current[index + 1]?.focus();
    };

    const resend = async () => {
        setError(null);
        setNotice(null);
        try {
            const { data } = await axios.post(`${API}/auth/resend-code`, { email });
            setWait(data?.waitSeconds || RESEND_SECONDS);
            setNotice(data?.waitSeconds ? null : "Коди нав фиристода шуд.");
        } catch (err) {
            setError(err.response?.data?.message || "Коди нав фиристода нашуд.");
        }
    };

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="text-center">
                <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-blue to-primary shadow-lg shadow-secondary/20">
                    <MailCheck className="h-8 w-8 text-primary-foreground" />
                </div>
                <h1 className="mb-2 text-2xl font-bold text-foreground">Почтаро тасдиқ кунед</h1>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    Ба <b className="text-foreground">{email}</b> коди 6-рақама фиристодем.
                    <br />Агар дар «Входящие» набошад, «Спам»-ро санҷед.
                </p>
            </div>

            {error && (
                <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-sm text-destructive">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    {error}
                </div>
            )}
            {notice && !error && (
                <p className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-center text-sm text-primary">{notice}</p>
            )}

            <div className="flex justify-center gap-2 sm:gap-2.5" onPaste={(event) => {
                event.preventDefault();
                fill(0, event.clipboardData.getData("text"));
            }}>
                {digits.map((digit, index) => (
                    <input
                        key={index}
                        ref={(node) => { inputs.current[index] = node; }}
                        value={digit}
                        inputMode="numeric"
                        autoComplete={index === 0 ? "one-time-code" : "off"}
                        maxLength={LENGTH}
                        disabled={loading}
                        aria-label={`Рақами ${index + 1}`}
                        onChange={(event) => {
                            const value = event.target.value;
                            if (!value) {
                                const next = [...digits];
                                next[index] = "";
                                setDigits(next);
                                return;
                            }
                            fill(index, value);
                        }}
                        onKeyDown={(event) => onKeyDown(index, event)}
                        onFocus={(event) => event.target.select()}
                        className="h-14 w-11 rounded-xl border border-border/60 bg-muted/20 text-center font-mono text-2xl font-bold text-foreground outline-none transition focus:border-primary focus:bg-muted/30 sm:w-12"
                    />
                ))}
            </div>

            <button
                type="button"
                disabled={loading || digits.some((digit) => !digit)}
                onClick={() => submit(digits.join(""))}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-blue to-primary py-4 font-bold text-primary-foreground shadow-lg shadow-secondary/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Тасдиқ кардан"}
            </button>

            <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" /> Почтаи дигар
                </button>
                <button
                    type="button"
                    onClick={resend}
                    disabled={wait > 0}
                    className="inline-flex items-center gap-1.5 font-semibold text-primary disabled:text-muted-foreground"
                >
                    <RotateCw className="h-4 w-4" />
                    {wait > 0 ? `Коди нав баъд аз ${wait} с` : "Коди навро фиристед"}
                </button>
            </div>
        </motion.div>
    );
}
