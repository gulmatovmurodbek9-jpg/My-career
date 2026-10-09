import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import i18n, { i18nReady } from './lib/i18n'
import { loginUrl } from './components/RouteGuards'
import { API, REQUEST_TIMEOUT_MS } from './lib/config'
import { installGuestHeader } from './lib/classGuest'
import App, { preloadRoute } from './App.jsx'
import { preloadMainRoutes } from './lib/routePreload'
import { ToastProvider } from './components/toast/ToastProvider'
import { useAuthStore } from './store/authStore'

axios.defaults.timeout = REQUEST_TIMEOUT_MS;
installGuestHeader(axios, API);

const PROTECTED_PREFIXES = ['/dashboard', '/admin', '/quiz', '/profile', '/settings', '/favorites'];
let handlingExpiredSession = false;
// Агар сервер токенро рад кунад (401), корбар худкор хориҷ мешавад.
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Хатои валидатсияи сервер массив аст (["Почта нодуруст аст", …]) — ба як матн.
    const data = error?.response?.data;
    if (data && Array.isArray(data.message)) data.message = data.message.join('. ');
    // Сервер дастнорас ё вақт гузашт: ба ҷои «Network Error» матни фаҳмо.
    if (!error?.response && error?.code !== 'ERR_CANCELED') {
      const lang = i18n.language;
      error.message = lang === 'ru'
        ? 'Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.'
        : lang === 'en'
          ? 'No connection to the server. Check your internet and try again.'
          : 'Пайваст бо сервер нашуд. Интернетро санҷед ва боз кӯшиш кунед.';
    }
    const headers = error?.config?.headers;
    const authHeader = headers?.get?.('Authorization') ?? headers?.Authorization ?? headers?.authorization ?? '';
    const sentToken = /^Bearer\s+\S+/.test(String(authHeader));
    if (error?.response?.status === 401 && sentToken && !handlingExpiredSession) {
      handlingExpiredSession = true;
      useAuthStore.getState().logout();
      const path = window.location.pathname;
      if (PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix))) {
        window.location.assign(loginUrl(path + window.location.search));
      } else {
        handlingExpiredSession = false;
      }
    }
    return Promise.reject(error);
  },
);

const AppWithToast = () => {
  return <App />;
};

// Забони русӣ/англисӣ аз файли алоҳида меояд — то он бор нашавад, сайт нишон дода
// намешавад (вагарна як лаҳза матни тоҷикӣ медурахшид).
// Саҳифаи пешсохта (SSR): аввал модули саҳифа, баъд React — HTML-и тайёр бе спиннер иваз мешавад.
const ssrReady = window.__SSR_DATA__ ? preloadRoute(window.location.pathname).catch(() => { }) : Promise.resolve();

Promise.all([i18nReady.catch(() => { }), ssrReady]).finally(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <ToastProvider>
        <AppWithToast />
      </ToastProvider>
    </StrictMode>,
  );
  // Саҳифаҳои панели поён пешакӣ — тугмаҳо фавран кор мекунанд.
  preloadMainRoutes(['/careers', '/universities', '/dashboard', '/info/x', '/trial', '/quiz', '/favorites', '/dashboard/ai-chat']);
});
