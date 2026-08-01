import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight, LogIn, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useAuthStore } from "../../store/authStore";
import axios from "axios";
import { API } from "../../lib/config";
import { googleClientId, loadGoogleIdentity, loginWithGoogleToken } from "../../lib/googleAuth";

const Register = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState(null);
    const googleButtonRef = useRef(null);

    const setAuth = useAuthStore((state) => state.setAuth);
    const navigate = useNavigate();

    useEffect(() => {
        if (!googleClientId || !googleButtonRef.current) return;

        loadGoogleIdentity()
            .then((google) => {
                google.accounts.id.initialize({
                    client_id: googleClientId,
                    callback: async (response) => {
                        setGoogleLoading(true);
                        setError(null);
                        try {
                            await loginWithGoogleToken({
                                credential: response.credential,
                                axios,
                                API,
                                setAuth,
                                navigate,
                                redirectTo: "/quiz",
                            });
                        } catch (err) {
                            setError(err.response?.data?.message || err.message || "Google login failed");
                        } finally {
                            setGoogleLoading(false);
                        }
                    },
                });
                google.accounts.id.renderButton(googleButtonRef.current, {
                    theme: "outline",
                    size: "large",
                    type: "standard",
                    shape: "rectangular",
                    width: 320,
                    text: "signup_with",
                });
            })
            .catch((err) => console.warn("Google auth unavailable:", err.message));
    }, [navigate, setAuth]);

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data } = await axios.post(`${API}/auth/register`, { name, email, password });
            setAuth(data.user, data.access_token);
            navigate("/quiz"); // Go to quiz after registration as per project vision
        } catch (err) {
            setError(err.response?.data?.message || "Хатогӣ ҳангоми бақайдгирӣ. Имейл шояд аллакай истифода шуда бошад.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-hero py-12 px-4">
            {/* Decorative Blur Blobs */}
            <div className="absolute top-1/4 -right-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-secondary/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "2s" }} />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="glass-card p-8 sm:p-10 border border-white/10 shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-primary mb-4 shadow-lg shadow-secondary/20"
                        >
                            <ShieldCheck className="w-8 h-8 text-primary-foreground" />
                        </motion.div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">Бақайдгирӣ</h1>
                        <p className="text-muted-foreground">Барои оғози кашфиёт ҳисоби нав созед</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-5">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive text-sm"
                            >
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                {error}
                            </motion.div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground ml-1">Ному насаб</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    required
                                    placeholder="Мурод Исмоилов"
                                    className="w-full bg-muted/20 border border-border/50 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-primary/50 focus:bg-muted/30 transition-all text-foreground"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground ml-1">Имейл</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="email"
                                    required
                                    placeholder="nom@tjk.com"
                                    className="w-full bg-muted/20 border border-border/50 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-primary/50 focus:bg-muted/30 transition-all text-foreground"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground ml-1">Парол</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    className="w-full bg-muted/20 border border-border/50 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-primary/50 focus:bg-muted/30 transition-all text-foreground"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={loading}
                            type="submit"
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-secondary to-primary text-primary-foreground font-bold shadow-lg shadow-secondary/20 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Ҳисоб сохтан
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    {googleClientId && (
                        <div className="mt-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-px flex-1 bg-border/60" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Google</span>
                                <div className="h-px flex-1 bg-border/60" />
                            </div>
                            <div className="flex justify-center min-h-[44px]">
                                {googleLoading ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <div ref={googleButtonRef} />}
                            </div>
                        </div>
                    )}

                    <div className="mt-8 text-center border-t border-border/50 pt-8">
                        <p className="text-muted-foreground text-sm">
                            Аллакай ҳисоб доред?{" "}
                            <Link to="/login" className="text-primary font-bold hover:underline inline-flex items-center gap-1">
                                Ворид шудан <LogIn className="w-4 h-4" />
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
