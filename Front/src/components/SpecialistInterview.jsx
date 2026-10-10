import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { Loader2, MessageCircleQuestion, Send, Square, Volume2 } from "lucide-react";
import { API } from "../lib/config";

// «Мусоҳиба бо мутахассис»: мутахассиси виртуалии ҳамин ихтисос (AI) аз номи худ ҷавоб медиҳад.
const TEXT = {
    tj: { title: "Мусоҳиба бо мутахассис", sub: "Аз мутахассиси ҳамин касб бипурсед — ӯ аз таҷрибаи худ ростқавлона ҷавоб медиҳад.", years: "{{n}} сол таҷриба", placeholder: "Саволи худро нависед…", ai: "Мутахассиси виртуалӣ (AI) — аз рӯи маълумоти ҳамин ихтисос. Барои қарори ниҳоӣ бо мутахассиси воқеӣ ҳам гап занед.", error: "Ҷавоб наомад. Боз кӯшиш кунед.", listen: "Гӯш кардан", stop: "Бас" },
    ru: { title: "Интервью со специалистом", sub: "Спросите специалиста этой профессии — он честно ответит из своего опыта.", years: "опыт {{n}} лет", placeholder: "Напишите свой вопрос…", ai: "Виртуальный специалист (AI) — на основе данных этой специальности. Для окончательного решения поговорите и с настоящим специалистом.", error: "Ответ не пришёл. Попробуйте ещё раз.", listen: "Слушать", stop: "Стоп" },
    en: { title: "Interview a specialist", sub: "Ask a specialist in this career — they answer honestly from their experience.", years: "{{n}} years of experience", placeholder: "Type your question…", ai: "A virtual specialist (AI) based on this specialty’s data. Before deciding, also talk to a real specialist.", error: "No answer came. Try again.", listen: "Listen", stop: "Stop" },
};
const fill = (s, v) => String(s).replace(/\{\{(\w+)\}\}/g, (_, k) => v?.[k] ?? "");

export default function SpecialistInterview({ careerId }) {
    const { i18n } = useTranslation();
    const lang = (i18n.language || "tj").slice(0, 2);
    const text = TEXT[lang] || TEXT.tj;
    const [info, setInfo] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(false);
    const [speaking, setSpeaking] = useState(null);
    const audioRef = useRef(null);
    const boxRef = useRef(null);

    useEffect(() => {
        let alive = true;
        setMessages([]);
        axios.get(`${API}/interview/${careerId}`, { params: { lang } })
            .then(({ data }) => alive && setInfo(data))
            .catch(() => alive && setInfo(null));
        return () => { alive = false; audioRef.current?.pause(); };
    }, [careerId, lang]);

    useEffect(() => {
        const box = boxRef.current;
        if (box) box.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
    }, [messages, busy]);

    const ask = async (question) => {
        const q = String(question || "").trim();
        if (!q || busy) return;
        const next = [...messages, { role: "user", text: q }];
        setMessages(next);
        setInput("");
        setBusy(true);
        setError(false);
        try {
            const { data } = await axios.post(`${API}/interview/${careerId}`, { lang, messages: next }, { timeout: 60000 });
            setMessages([...next, { role: "specialist", text: data.answer }]);
        } catch {
            setError(true);
        } finally {
            setBusy(false);
        }
    };

    const listen = async (index, value) => {
        if (speaking === index) { audioRef.current?.pause(); setSpeaking(null); return; }
        audioRef.current?.pause();
        setSpeaking(index);
        try {
            const res = await fetch(`${API}/voice/speak`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: value.slice(0, 900), lang }) });
            if (!res.ok) throw new Error("tts");
            const audio = new Audio(URL.createObjectURL(await res.blob()));
            audioRef.current = audio;
            audio.onended = () => setSpeaking(null);
            await audio.play();
        } catch {
            setSpeaking(null);
        }
    };

    if (!info) return null;
    const p = info.persona;
    const initials = p.name.split(" ").map((x) => x[0]).join("").slice(0, 2);
    const asked = new Set(messages.filter((m) => m.role === "user").map((m) => m.text));

    return (
        <section className="overflow-hidden rounded-3xl border border-border bg-card">
            <div className="flex items-center gap-4 border-b border-border bg-gradient-to-br from-violet-500/10 via-transparent to-transparent p-5">
                <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-black text-white shadow-md ${p.female ? "bg-gradient-to-br from-rose-400 to-violet-500" : "bg-gradient-to-br from-sky-500 to-indigo-600"}`}>{initials}</span>
                <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-violet-600 dark:text-violet-300"><MessageCircleQuestion className="h-4 w-4" aria-hidden /> {text.title}</div>
                    <div className="truncate text-lg font-black text-foreground">{p.name}</div>
                    <div className="truncate text-[13px] text-muted-foreground">{p.title} · {p.city} · {fill(text.years, { n: p.years })}</div>
                </div>
            </div>

            <div ref={boxRef} className="max-h-[420px] space-y-3 overflow-y-auto p-5">
                <div className="flex gap-2">
                    <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-muted/60 px-4 py-3 text-[15px] leading-relaxed text-foreground">{info.greeting}</div>
                </div>
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${m.role === "user" ? "rounded-tr-sm bg-primary text-primary-foreground" : "rounded-tl-sm bg-muted/60 text-foreground"}`}>
                            {m.text}
                            {m.role === "specialist" && (
                                <button type="button" onClick={() => listen(i, m.text)} className="mt-2 flex items-center gap-1 text-[12px] font-bold text-violet-600 dark:text-violet-300 cursor-pointer">
                                    {speaking === i ? <Square className="h-3.5 w-3.5" aria-hidden /> : <Volume2 className="h-3.5 w-3.5" aria-hidden />} {speaking === i ? text.stop : text.listen}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {busy && <div className="flex items-center gap-2 text-[13px] text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> {p.name}…</div>}
                {error && <p className="text-[13px] font-semibold text-rose-600">{text.error}</p>}
            </div>

            <div className="space-y-3 border-t border-border p-4">
                <div className="flex flex-wrap gap-2">
                    {info.suggestions.filter((s) => !asked.has(s)).slice(0, 3).map((s) => (
                        <button key={s} type="button" onClick={() => ask(s)} disabled={busy} className="rounded-full border border-violet-500/30 bg-violet-500/5 px-3 py-1.5 text-[13px] font-semibold text-foreground hover:border-violet-500 disabled:opacity-50 cursor-pointer">{s}</button>
                    ))}
                </div>
                <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="flex gap-2">
                    <input value={input} onChange={(e) => setInput(e.target.value.slice(0, 500))} placeholder={text.placeholder} aria-label={text.placeholder}
                        className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3.5 py-3 text-base text-foreground placeholder:text-muted-foreground focus-ring" />
                    <button type="submit" disabled={busy || !input.trim()} aria-label={text.placeholder} className="btn-primary !px-4 !py-3 disabled:opacity-50"><Send className="h-5 w-5" aria-hidden /></button>
                </form>
                <p className="text-[12px] text-muted-foreground">{text.ai}</p>
            </div>
        </section>
    );
}
