import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import { API } from "../lib/config";
import { fillText, langCode, trialText } from "../lib/trialText";

// Тугмаи «Як рӯз дар ихтисос» дар саҳифаи ҳар ихтисос: сенарияи гурӯҳи ҳамин ихтисос
// ё, агар он ҳанӯз навишта нашуда бошад, наздиктарин аз ҳамон самти ММТ (ростқавлона гуфта мешавад).
export default function TrialCta({ career }) {
    const { i18n } = useTranslation();
    const lang = langCode(i18n.language);
    const text = trialText(lang);
    const [match, setMatch] = useState(null);

    useEffect(() => {
        if (!career?.id) return undefined;
        let alive = true;
        axios.get(`${API}/trial/resolve`, { params: { code: career.code || "", cluster: career.mmtCluster || "", lang } })
            .then((res) => alive && setMatch(res.data))
            .catch(() => alive && setMatch(null));
        return () => { alive = false; };
    }, [career?.id, career?.code, career?.mmtCluster, lang]);

    if (!match?.family) return null;

    return (
        <div className="rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/10 to-indigo-500/5 p-5 sm:p-6">
            <div className="flex items-start gap-4">
                <span className="text-4xl" aria-hidden>{match.icon}</span>
                <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-black text-foreground">{text.ctaTitle}</h2>
                    <p className="mt-1 text-[15px] text-muted-foreground">{fillText(text.ctaText, { role: match.role })}</p>
                    {!match.exact && match.ownName && (
                        <p className="mt-2 text-xs text-muted-foreground">{fillText(text.ctaNearest, { own: match.ownName })}</p>
                    )}
                </div>
            </div>
            <Link
                to={`/trial/${match.family}?career=${career.id}`}
                state={{ careerName: career.nameTranslated || career.name }}
                className="btn-primary mt-4 w-full !py-3.5 sm:w-auto"
            >
                {text.ctaButton} <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
        </div>
    );
}
