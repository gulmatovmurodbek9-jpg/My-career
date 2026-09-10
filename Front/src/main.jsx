import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import './lib/i18n'
import { installMockInterceptor } from './lib/mockApi'
import { REQUEST_TIMEOUT_MS } from './lib/config'
import App from './App.jsx'
import { ToastProvider } from './components/toast/ToastProvider'

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
