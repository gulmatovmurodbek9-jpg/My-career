import React, { Suspense, lazy, useEffect, useState } from "react";
import { Mic } from "lucide-react";
import { useTranslation } from "react-i18next";

// Ёвари овозӣ (~60 KB код + 3D) дар бандли асосӣ набошад: аввал танҳо тугма,
// худи ёвар баъди боршавии саҳифа (дар вақти холӣ) ё бо пахши тугма бор мешавад.
const VoiceAssistant = lazy(() => import("./VoiceAssistant"));

export default function LazyVoiceAssistant() {
    const { t } = useTranslation();
    const [load, setLoad] = useState(false);

    // Тугмаи мобайнии панели поён (телефон): то бор шудани ёвар — дархости кушодан.
    useEffect(() => {
        if (load) return undefined;
        const open = () => {
            window.__voiceOpenRequested = true;
            setLoad(true);
        };
        window.addEventListener("voice:toggle", open);
        return () => window.removeEventListener("voice:toggle", open);
    }, [load]);

    useEffect(() => {
        const start = () => setLoad(true);
        const idle = window.requestIdleCallback
            ? window.requestIdleCallback(start, { timeout: 4000 })
            : window.setTimeout(start, 2500);
        return () => (window.cancelIdleCallback ? window.cancelIdleCallback(idle) : window.clearTimeout(idle));
    }, []);

    const button = (
        <button
            type="button"
            onClick={() => {
                window.__voiceOpenRequested = true;
                setLoad(true);
            }}
            aria-label={t("assistant.title", "Ёвари овозӣ")}
            data-voice-panel
            className="no-print fixed bottom-6 right-5 z-[60] hidden md:flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_30px_-8px_rgba(15,23,42,0.5)] focus-ring"
        >
            <Mic className="h-6 w-6" aria-hidden />
        </button>
    );

    if (!load) return button;
    return (
        <Suspense fallback={button}>
            <VoiceAssistant />
        </Suspense>
    );
}
