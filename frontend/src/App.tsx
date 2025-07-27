import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import './App.css'
import LaunchPage from './pages/LaunchPage'
import LobbyPage from './pages/LobbyPage'
import GamePage from './pages/GamePage'
import { UserProvider } from './contexts/UserContext';
import { useUser } from './hooks';

// ...existing code...
import { SocketProvider } from './contexts/SocketContext'
import { GameProvider } from './contexts/GameContext'

// RootRedirector: checks for startapp param and redirects to lobby if present
function RootRedirector() {
  const navigate = useNavigate();
  const location = useLocation();
  const [redirecting, setRedirecting] = React.useState(false);
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const startAppGameId = urlParams.get('startapp');
    if (startAppGameId) {
      setRedirecting(true);
      navigate(`/lobby/${startAppGameId}`, { replace: true });
    }
  }, [navigate, location.search]);
  const urlParams = new URLSearchParams(location.search);
  const startAppGameId = urlParams.get('startapp');
  if (startAppGameId || redirecting) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-black text-pink-400">
        <div className="animate-spin w-8 h-8 border-4 border-pink-400/30 border-t-pink-400 rounded-full mx-auto"></div>
        <div className="ml-4 text-lg font-bold">Joining game...</div>
      </div>
    );
  }
  return <LaunchPage />;
}

function AppRoutes() {
  const { userLoading } = useUser();
  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-black text-pink-400">
        <div className="animate-spin w-8 h-8 border-4 border-pink-400/30 border-t-pink-400 rounded-full mx-auto"></div>
        <div className="ml-4 text-lg font-bold">Loading user...</div>
      </div>
    );
  }
  return (
    <SocketProvider>
      <GameProvider>
        <Routes>
          <Route path="/" element={<RootRedirector />} />
          <Route path="/join/:gameId" element={<LaunchPage />} />
          <Route path="/lobby/:gameId" element={<LobbyPage />} />
          <Route path="/game/:gameId" element={<GamePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </GameProvider>
    </SocketProvider>
  );
}

function App() {
  return (
    <div className="app">
      <UserProvider>
        <AppRoutes />
      </UserProvider>
    </div>
  );
}

export default App
