import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";


// «Хуҷанд» ва «Худжанд» ба як шакл оварда мешаванд, то ҷустуҷӯ ҳардуро ёбад.
const fold = (text) =>
    String(text || "")
        .toLowerCase()
        .replace(/ӣ/g, "и")
        .replace(/ӯ/g, "у")
        .replace(/ҳ/g, "х")
        .replace(/қ/g, "к")
        .replace(/ғ/g, "г")
        .replace(/ҷ/g, "ч")
        .replace(/ё/g, "е");

export default function FilterSelect({
    value,
    onChange,
    options,
    searchable = false,
    searchPlaceholder = "",
    emptyText = "",
    ariaLabel,
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [active, setActive] = useState(0);
    const rootRef = useRef(null);
    const searchRef = useRef(null);
    const listRef = useRef(null);
    const listId = useId();

    const selected = options.find((option) => option.value === value) || options[0];
    const filtered = useMemo(() => {
        const needle = fold(query.trim());
        return needle ? options.filter((option) => fold(option.label).includes(needle)) : options;
    }, [options, query]);

    useEffect(() => {
        if (!open) return undefined;
        const onPointerDown = (event) => {
            if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
        };
        document.addEventListener("mousedown", onPointerDown);
        return () => document.removeEventListener("mousedown", onPointerDown);
    }, [open]);

    useEffect(() => {
        if (!open) {
            setQuery("");
            return;
        }
        setActive(Math.max(0, options.findIndex((option) => option.value === value)));
        if (searchable) searchRef.current?.focus();
    }, [open]);

    useEffect(() => {
        setActive(0);
    }, [query]);

    useEffect(() => {
        if (!open) return;
        listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
    }, [active, open]);

    const choose = (option) => {
        onChange(option.value);
        setOpen(false);
    };

    const onKeyDown = (event) => {
        if (!open) {
            if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setOpen(true);
            }
            return;
        }
        if (event.key === "Escape") {
            event.preventDefault();
            setOpen(false);
        } else if (event.key === "ArrowDown") {
            event.preventDefault();
            setActive((index) => Math.min(index + 1, filtered.length - 1));
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((index) => Math.max(index - 1, 0));
        } else if (event.key === "Enter") {
            event.preventDefault();
            if (filtered[active]) choose(filtered[active]);
        }
    };

    return (
        <div ref={rootRef} className="relative" onKeyDown={onKeyDown}>
            <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={listId}
                aria-label={ariaLabel}
                onClick={() => setOpen((isOpen) => !isOpen)}
                className={`flex w-full items-center justify-between gap-2 rounded-[0.75rem] border bg-background px-3.5 py-2.5 text-left text-[15px] font-medium text-foreground focus-ring ${
                    open ? "border-primary" : "border-border"
                }`}
            >
                <span className="min-w-0 truncate">{selected?.label}</span>
                <span className="flex shrink-0 items-center gap-2">
                    {selected?.count != null && (
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
                            {selected.count}
                        </span>
                    )}
                    <ChevronDown
                        className={`h-4 w-4 text-muted-foreground ${open ? "rotate-180" : ""}`}
                        aria-hidden
                    />
                </span>
            </button>

            {open && (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-[0.875rem] border border-border bg-card shadow-xl">
                    {searchable && (
                        <div className="border-b border-border p-2">
                            <div className="relative">
                                <Search
                                    className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                                    aria-hidden
                                />
                                <input
                                    ref={searchRef}
                                    type="text"
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    placeholder={searchPlaceholder}
                                    aria-label={searchPlaceholder}
                                    className="w-full rounded-[0.5rem] border border-border bg-background py-2 pl-8 pr-2.5 text-[14px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
                                />
                            </div>
                        </div>
                    )}

                    <ul
                        ref={listRef}
                        id={listId}
                        role="listbox"
                        className="max-h-[12.25rem] overflow-y-auto overscroll-contain p-1"
                    >
                        {filtered.length === 0 ? (
                            <li className="px-3 py-4 text-center text-[14px] text-muted-foreground">{emptyText}</li>
                        ) : (
                            filtered.map((option, index) => {
                                const isSelected = option.value === value;
                                return (
                                    <li
                                        key={option.value}
                                        role="option"
                                        aria-selected={isSelected}
                                        data-index={index}
                                        onMouseDown={(event) => event.preventDefault()}
                                        onClick={() => choose(option)}
                                        onMouseMove={() => setActive(index)}
                                        className={`flex cursor-pointer items-center justify-between gap-2 rounded-[0.5rem] px-3 py-2 text-[14px] ${
                                            index === active ? "bg-muted" : ""
                                        } ${isSelected ? "font-semibold text-primary" : "text-foreground"}`}
                                    >
                                        <span className="min-w-0 truncate">{option.label}</span>
                                        <span className="flex shrink-0 items-center gap-1.5">
                                            {option.count != null && (
                                                <span className="text-xs tabular-nums text-muted-foreground">
                                                    {option.count}
                                                </span>
                                            )}
                                            {isSelected && <Check className="h-4 w-4" aria-hidden />}
                                        </span>
                                    </li>
                                );
                            })
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
