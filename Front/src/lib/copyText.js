// Нусха ба буфер бе равзанаи «prompt»: аввал Clipboard API, агар браузер иҷозат надиҳад
// (http, варақа дар фокус нест, Safari-и кӯҳна) — textarea-и пинҳон ва execCommand("copy").
export async function copyText(value) {
    const text = String(value ?? "");
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch { /* роҳи дуюм */ }
    try {
        const area = document.createElement("textarea");
        area.value = text;
        area.setAttribute("readonly", "");
        Object.assign(area.style, { position: "fixed", top: "0", left: "0", opacity: "0", pointerEvents: "none" });
        document.body.appendChild(area);
        area.focus();
        area.select();
        area.setSelectionRange(0, text.length);
        const ok = document.execCommand("copy");
        area.remove();
        return ok;
    } catch {
        return false;
    }
}
