import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import './lib/i18n'
import { installMockInterceptor } from './lib/mockApi'
import { REQUEST_TIMEOUT_MS } from './lib/config'
import App from './App.jsx'
import { ToastProvider } from './components/toast/ToastProvider'
import { useAuthStore } from './store/authStore'

/*
 * Timeout-и умумӣ барои ҳамаи дархостҳо.
 *
 * Axios ба таври пешфарз ҳеҷ timeout надорад — агар сервер ё шабака овезон
 * монад, дархост абадан интизор мешавад: блоки `finally` иҷро намешавад,
 * спиннер то абад мечархад ва корбар ҳатто хатое намебинад. Бо timeout
 * дархост меафтад, `catch` кор мекунад ва паёми фаҳмо нишон дода мешавад.
 *
 * Даъватҳои AI timeout-и дарозтари худро доранд (AI_TIMEOUT_MS) — генератсия
 * табиатан сустар аст.
 */
axios.defaults.timeout = REQUEST_TIMEOUT_MS;

// Install mock API interceptor for offline/demo mode
installMockInterceptor();

/*
 * Токени нигоҳдошташуда рад шуд (401) → хуруҷ.
 *
 * Токен метавонад аз сервери дигар бошад (localhost онро бо калиди худ имзо
 * карда буд, баъд ба API-и сервер пайваст шуд) ё муҳлаташ гузашта бошад.
 * Пештар ҳар саҳифа танҳо «Хатогӣ ҳангоми боргузории омор» менавишт, ва
 * корбар намедонист, ки бояд аз нав ворид шавад.
 *
 * Танҳо дархостҳое, ки худ токен фиристоданд: пароли нодуруст дар /auth/login
 * ҳам 401 медиҳад, вале он дархост токен надорад. Ба саҳифаи воридшавӣ танҳо
 * аз саҳифаҳои пӯшида фиристода мешавад — дар саҳифаи асосӣ корбар ҳамон ҷо
 * мемонад, фақат ҳамчун меҳмон.
 */
const PROTECTED_PREFIXES = ['/dashboard', '/admin', '/quiz', '/profile', '/settings', '/favorites'];
let handlingExpiredSession = false;
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const headers = error?.config?.headers;
    const authHeader = headers?.get?.('Authorization') ?? headers?.Authorization ?? headers?.authorization ?? '';
    const sentToken = /^Bearer\s+\S+/.test(String(authHeader));
    if (error?.response?.status === 401 && sentToken && !handlingExpiredSession) {
      handlingExpiredSession = true;
      useAuthStore.getState().logout();
      const path = window.location.pathname;
      if (PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix))) {
        window.location.assign('/login');
      } else {
        handlingExpiredSession = false;
      }
    }
    return Promise.reject(error);
  },
);

// Wrapper component to initialize toast handler
const AppWithToast = () => {
  // This component just renders App within ToastProvider
  // The toast handler will be set via a ref in ToastProvider
  return <App />;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <AppWithToast />
    </ToastProvider>
  </StrictMode>,
);
