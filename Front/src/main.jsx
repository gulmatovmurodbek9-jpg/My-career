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

axios.defaults.timeout = REQUEST_TIMEOUT_MS;

installMockInterceptor();

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

const AppWithToast = () => {
  return <App />;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <AppWithToast />
    </ToastProvider>
  </StrictMode>,
);
