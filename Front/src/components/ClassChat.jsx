import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { Loader2, MessageCircle, Send } from "lucide-react";

// Фидбеки омӯзгор ↔ хонанда: як риштаи паёмҳо дар доираи синф. Ҳамон як компонент барои
// ҳарду тараф; `me` — «teacher» ё «student». Ҳар 20 сония нав мешавад.
export default function ClassChat({ url, me, headers, text, otherLabel, emptyText, placeholder, onRead }) {
    const [messages, setMessages] = useState(null);
    const [draft, setDraft] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const listRef = useRef(null);

    const load = useCallback(() => {
        axios.get(url, { headers })
            .then(({ data }) => { setMessages(Array.isArray(data) ? data : []); onRead?.(); })
            .catch(() => setMessages((old) => old || []));
    }, [url, headers, onRead]);

    useEffect(() => {
        load();
        const timer = setInterval(load, 20000);
        return () => clearInterval(timer);
    }, [load]);

    useEffect(() => {
        const list = listRef.current;
        if (list) list.scrollTop = list.scrollHeight;
    }, [messages]);

    const send = async (event) => {
        event.preventDefault();
        const body = draft.trim();
        if (!body || busy) return;
        setBusy(true);
        setError("");
        try {
            const { data } = await axios.post(url, { body }, { headers });
            setMessages((old) => [...(old || []), data]);
            setDraft("");
        } catch (err) {
            setError(err.response?.data?.message || text.error);
        } finally {
            setBusy(false);
        }
    };

    const time = (value) => new Date(value).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

    return (
        <div className="flex flex-col gap-3" data-class-chat>
            <div ref={listRef} className="max-h-80 space-y-2 overflow-y-auto pr-1">
                {messages === null && <div className="h-16 animate-pulse rounded-2xl bg-muted/50" />}
                {messages?.length === 0 && (
                    <p className="flex items-start gap-2 rounded-2xl bg-muted/40 p-3 text-[14px] text-muted-foreground">
                        <MessageCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {emptyText}
                    </p>
                )}
                {messages?.map((message) => {
                    const mine = message.author === me;
                    return (
                        <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md border border-border bg-muted/50 text-foreground"}`}>
                                <div className={`mb-0.5 text-[11px] font-bold ${mine ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                                    {mine ? text.you : otherLabel} · {time(message.createdAt)}
                                </div>
                                <p className="whitespace-pre-wrap break-words text-[14.5px] leading-relaxed">{message.body}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
            <form onSubmit={send} className="flex items-end gap-2">
                <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) send(event); }}
                    placeholder={placeholder}
                    maxLength={1000}
                    rows={2}
                    className="min-h-[3rem] flex-1 resize-none rounded-2xl border border-border bg-background px-3.5 py-2.5 text-[15px] text-foreground placeholder:text-muted-foreground focus-ring"
                />
                <button type="submit" disabled={busy || !draft.trim()} aria-label={text.sendMessage} className="btn-primary !h-12 !w-12 !p-0 disabled:opacity-50">
                    {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Send className="h-5 w-5" aria-hidden />}
                </button>
            </form>
            {error && <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</p>}
        </div>
    );
}
