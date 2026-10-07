// Пешсозии саҳифаҳо (SSR) барои Google: ҳамон масирҳо ва компонентҳои сайт (AppRoutes),
// танҳо бо StaticRouter ва маълумоти пешакӣ (globalThis.__SSR_DATA__). prerender интизори
// ҳамаи lazy()-ҳо мешавад — HTML саҳифаи пурра аст, на спиннер.
//   vite build --ssr src/entry-server.jsx --outDir dist-ssr   → scripts/prerender.mjs
import ReactDomStatic from "react-dom/static";
import { StaticRouter } from "react-router";
import i18n, { i18nReady } from "./lib/i18n";
import { AppRoutes } from "./App";
import { ToastProvider } from "./components/toast/ToastProvider";

export async function render(url, data) {
    globalThis.__SSR_DATA__ = data;
    await i18nReady;
    if (i18n.language !== "tj") await i18n.changeLanguage("tj");
    // react-dom/static дар Node — CommonJS ва танҳо prerenderToNodeStream дорад.
    const { prelude } = await ReactDomStatic.prerenderToNodeStream(
        <ToastProvider>
            <StaticRouter location={url}>
                <AppRoutes />
            </StaticRouter>
        </ToastProvider>,
    );
    let html = "";
    for await (const chunk of prelude) html += chunk;
    return html;
}
