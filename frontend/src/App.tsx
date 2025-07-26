import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import LaunchPage from './pages/LaunchPage'
import LobbyPage from './pages/LobbyPage'
import GamePage from './pages/GamePage'
import { UserProvider } from './contexts/UserContext'
//import { useUser } from './hooks';
import { useEffect } from 'react';
import { telegramWebApp } from './services/telegramWebAppService';

// function DebugPanel() {
//   const { user } = useUser();
//   return (
//     <div style={{ background: '#222', color: '#fff', padding: 10, fontSize: 12, position: 'fixed', top: 0, right: 0, zIndex: 9999, maxWidth: 400, wordBreak: 'break-all' }}>
//       <div><b>window.Telegram:</b> {JSON.stringify(window.Telegram)}</div>
//       <div><b>window.Telegram.WebApp:</b> {JSON.stringify(window.Telegram?.WebApp)}</div>
//       <div><b>window.Telegram.WebApp.initDataUnsafe:</b> {JSON.stringify(window.Telegram?.WebApp?.initDataUnsafe)}</div>
//       <div><b>React user context:</b> {JSON.stringify(user)}</div>
//     </div>
//   );
// }
import { SocketProvider } from './contexts/SocketContext'
import { GameProvider } from './contexts/GameContext'

function App() {
  useEffect(() => {
    telegramWebApp.initialize(); // Ensure Telegram WebApp is initialized on mount
  }, []);

  return (
    <div className="app">
      <UserProvider>
        {/* <DebugPanel /> */}
        <SocketProvider>
          <GameProvider>
            <Routes>
              <Route path="/" element={<LaunchPage />} />
              <Route path="/join/:gameId" element={<LaunchPage />} />
              <Route path="/lobby/:gameId" element={<LobbyPage />} />
              <Route path="/game/:gameId" element={<GamePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </GameProvider>
        </SocketProvider>
      </UserProvider>
    </div>
  );
}

export default App
