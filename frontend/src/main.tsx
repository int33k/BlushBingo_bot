
import ReactDOM from 'react-dom/client';
import { telegramWebApp } from './services/telegramWebAppService';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import './styles/edge-optimizations.css';

// --- EARLY Telegram WebApp initialization ---
telegramWebApp.initialize();

// --- Handle Telegram challenge link before React mounts ---
function getGameIdFromTelegramParams() {
  // Check query string
  const urlParams = new URLSearchParams(window.location.search);
  let gameId = urlParams.get('startapp') || urlParams.get('start_param');
  // Check hash for tgWebAppData
  if (!gameId && window.location.hash) {
    const hashParams = decodeURIComponent(window.location.hash);
    const match = hashParams.match(/start_param=([0-9]+)/);
    if (match) {
      gameId = match[1];
    }
  }
  return gameId;
}
const gameId = getGameIdFromTelegramParams();
if (gameId && !window.location.pathname.startsWith('/lobby/')) {
  window.location.replace(`/lobby/${gameId}`);
}

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
