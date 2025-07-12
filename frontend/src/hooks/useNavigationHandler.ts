import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocketHandler } from './useSocketHandler';
import type { Game, Player } from '../types';

interface UseNavigationHandlerProps {
  currentGame: Game | null;
  currentPlayer: Player | null;
  gameId: string | undefined;
}

export const useNavigationHandler = ({ 
  currentGame, 
  currentPlayer, 
  gameId 
}: UseNavigationHandlerProps) => {
  const navigate = useNavigate();
  const { sendSocketMessage } = useSocketHandler();

  useEffect(() => {
    // Handle browser back button and page unload
    const handlePopState = () => {
      if (currentGame?.status === 'playing' || currentGame?.status === 'completed') {
        // Send disconnect signal to other player
        if (sendSocketMessage && currentPlayer) {
          sendSocketMessage('game:disconnect', { 
            gameId, 
            playerId: currentPlayer.playerId 
          });
        }
        // Navigate to launch screen immediately
        navigate('/', { replace: true });
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [currentGame?.status, sendSocketMessage, currentPlayer, gameId, navigate]);
};
