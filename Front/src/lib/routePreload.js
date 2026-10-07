// Пешбори саҳифаҳо: App.jsx барои ҳар масир функсияи бор карданро сабт мекунад; панели поён
// ҳангоми ламс (пеш аз раҳо кардани ангушт) ва браузер дар вақти холӣ онро даъват мекунанд —
// саҳифа фавран мекушояд, на баъди боршавӣ аз интернет. Модули алоҳида — то App ↔ Layout давр нашавад.
const loaders = [];

export function registerPreload(test, load) {
    loaders.push({ test, load });
}

export function preloadPath(pathname) {
    const found = loaders.find(({ test }) => test.test(pathname));
    return found ? found.load().catch(() => { }) : Promise.resolve();
}

// Баъди боршавӣ, дар вақти холӣ — саҳифаҳои асосӣ (на дар реҷаи «сарфаи трафик» ё 2G).
export function preloadMainRoutes(paths) {
    const connection = navigator.connection;
    if (connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || "")) return;
    const run = () => paths.reduce((chain, path) => chain.then(() => preloadPath(path)), Promise.resolve());
    if (window.requestIdleCallback) window.requestIdleCallback(run, { timeout: 4000 });
    else window.setTimeout(run, 2500);
}
