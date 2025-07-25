import ReactDOM from 'react-dom/client'
import { telegramWebApp } from './services/telegramWebAppService';
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import './styles/edge-optimizations.css'

// --- DEBUG: Log Telegram WebApp globals at the very start ---
console.log('[DEBUG] window.Telegram:', window.Telegram);
console.log('[DEBUG] window.Telegram.WebApp:', window.Telegram?.WebApp);
console.log('[DEBUG] window.Telegram.WebApp.initDataUnsafe:', window.Telegram?.WebApp?.initDataUnsafe);

// --- EARLY Telegram WebApp initialization ---
telegramWebApp.initialize();
// Fix for Edge browser FOUC (Flash of Unstyled Content)
const root = ReactDOM.createRoot(document.getElementById('root')!);

// Ensure smooth loading for Edge/Telegram browsers
const renderApp = () => {
  root.render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  // Mark as loaded to show content smoothly after React renders
  setTimeout(() => {
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.classList.add('loaded');
    }
  }, 50); // Small delay to ensure component styles are applied
};

// Use requestAnimationFrame for better performance in Edge/Telegram
if (typeof requestAnimationFrame !== 'undefined') {
  requestAnimationFrame(renderApp);
} else {
  renderApp();
}
