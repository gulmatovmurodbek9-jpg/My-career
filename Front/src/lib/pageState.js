import { useEffect, useState } from "react";

// Ҳолати саҳифа барои ҳар қадами таърихи браузер (тугмаи «Ба қафо»): саҳифа, ҷустуҷӯ,
// филтрҳо ва scroll. Калид — history.state.idx-и React Router: дар «replace» (масалан
// иваз кардани филтр) ҳамон мемонад, дар «push» нав мешавад. Ҳамааш дар sessionStorage —
// дар ҷадвали дигар ё баъди пӯшидани браузер холӣ сар мешавад.
const PREFIX = "page-state:";

export const entryId = () => {
    try {
        return window.history.state?.idx ?? 0;
    } catch {
        return 0;
    }
};

function read(id) {
    try {
        return JSON.parse(window.sessionStorage.getItem(PREFIX + id)) || {};
    } catch {
        return {};
    }
}

function write(id, data) {
    try {
        window.sessionStorage.setItem(PREFIX + id, JSON.stringify(data));
    } catch {
        /* хотира пур ё баста — танҳо ҳолат нигоҳ дошта намешавад */
    }
}

export function readEntry() {
    if (typeof window === "undefined") return {};
    return read(entryId());
}

export function saveEntry(patch) {
    if (typeof window === "undefined") return;
    const id = entryId();
    write(id, { ...read(id), ...patch });
}

export function clearEntry() {
    try {
        window.sessionStorage.removeItem(PREFIX + entryId());
    } catch {
        /* холӣ */
    }
}

// Мисли useState, вале баъди «Ба қафо» қимати пештараро бармегардонад.
export function usePageState(name, initial) {
    const [value, setValue] = useState(() => {
        const saved = readEntry()[name];
        if (saved !== undefined) return saved;
        return typeof initial === "function" ? initial() : initial;
    });
    useEffect(() => {
        saveEntry({ [name]: value });
    }, [name, value]);
    return [value, setValue];
}
