import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import LaunchPage from './pages/LaunchPage'
import LobbyPage from './pages/LobbyPage'
import GamePage from './pages/GamePage'
import { UserProvider } from './contexts/UserContext'
import { SocketProvider } from './contexts/SocketContext'
import { GameProvider } from './contexts/GameContext'

function App() {
  return (
    <div className="app">
      <UserProvider>
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
  )
}

export default App
