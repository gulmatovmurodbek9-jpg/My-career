import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './lib/i18n'
import { installMockInterceptor } from './lib/mockApi'
import App from './App.jsx'
import { ToastProvider } from './components/toast/ToastProvider'

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
