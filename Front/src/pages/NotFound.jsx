import React from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { Compass, ArrowLeft, Search, GraduationCap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { usePageMeta } from "../lib/usePageMeta";

const NotFound = () => {
    const { t } = useTranslation();

    usePageMeta({
        title: t("not_found.title", "Саҳифа ёфт нашуд"),
        noIndex: true,
    });

    const links = [
        { to: "/careers", icon: Search, label: t("nav.careers", "Ихтисосҳо") },
        { to: "/universities", icon: GraduationCap, label: t("nav.universities", "Донишгоҳҳо") },
    ];

    return (
        <div className="flex min-h-screen items-center justify-center px-6 py-24">
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg rounded-[2rem] border border-border bg-card p-10 text-center shadow-lg"
            >
                <span className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <Compass className="h-8 w-8 text-primary" />
                </span>

                <p className="text-5xl font-black tracking-tighter text-primary">404</p>
                <h1 className="mt-3 text-xl font-bold text-foreground">
                    {t("not_found.title", "Саҳифа ёфт нашуд")}
                </h1>
                <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
                    {t(
                        "not_found.text",
                        "Чунин саҳифа вуҷуд надорад ё кӯчонида шудааст. Аз ин ҷо давом диҳед:",
                    )}
                </p>

                <div className="mt-7 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
                    <Link
                        to="/"
                        className="btn-primary inline-flex w-full !rounded-xl !px-5 !py-3 !text-sm sm:w-auto"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {t("nav.home", "Асосӣ")}
                    </Link>
                    {links.map((link) => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-border px-5 py-3 text-sm font-bold text-foreground transition-colors hover:bg-muted sm:w-auto"
                        >
                            <link.icon className="h-4 w-4" />
                            {link.label}
                        </Link>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default NotFound;
