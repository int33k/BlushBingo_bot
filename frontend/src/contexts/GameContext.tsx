import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { Game, GameResponse, Move } from '../types';
import { useSocket, useUser } from '../hooks';
import { GameContext } from './GameContextDefinition';

type SocketResponse = { game?: Game; error?: string; message?: string };

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState({ currentGame: null as Game | null, isLoading: false, error: null as string | null });
  const { socket, isConnected, emit, on } = useSocket();
  const { user } = useUser();

  // Ultra-compact handler factory with minimal logging and memory optimization
  const createHandler = useCallback((action?: () => void) => (data: unknown) => {
    const { game, error, message } = data as SocketResponse;
    if (game) { 
      console.log(`[DEBUG] GameContext received game update:`, {
        gameId: game.gameId,
        status: game.status,
        statusMessage: game.statusMessage,
        challengerStatus: game.players?.challenger?.status,
        acceptorStatus: game.players?.acceptor?.status
      });
      
      // Only update changed fields to avoid unnecessary re-renders
      setState(s => {
        if (!s.currentGame || s.currentGame.gameId !== game.gameId) {
          console.log(`[DEBUG] Setting new current game:`, game.gameId);
          return { ...s, currentGame: game };
        }
        // Merge only if there are actual changes
        const hasChanges = s.currentGame.status !== game.status || 
                          s.currentGame.currentTurn !== game.currentTurn ||
                          s.currentGame.statusMessage !== game.statusMessage ||
                          s.currentGame.players?.challenger?.status !== game.players?.challenger?.status ||
                          s.currentGame.players?.acceptor?.status !== game.players?.acceptor?.status ||
                          (s.currentGame.moves?.length || 0) !== (game.moves?.length || 0);
        
        if (hasChanges) {
          console.log(`[DEBUG] Game state has changes, updating:`, {
            oldStatusMessage: s.currentGame.statusMessage,
            newStatusMessage: game.statusMessage,
            oldChallengerStatus: s.currentGame.players?.challenger?.status,
            newChallengerStatus: game.players?.challenger?.status,
            oldAcceptorStatus: s.currentGame.players?.acceptor?.status,
            newAcceptorStatus: game.players?.acceptor?.status
          });
        } else {
          console.log(`[DEBUG] No changes detected, skipping update`);
        }
        
        return hasChanges ? { ...s, currentGame: { ...s.currentGame, ...game } } : s;
      }); 
      action?.(); 
    }
    if (error || message) setState(s => ({ ...s, error: error || message || 'Error occurred' }));
  }, []);

  // Optimized event configuration with delta update handling
  const eventConfig = useMemo(() => [
    ...(['game:created', 'game:joined', 'game:playerJoined', 'game:started', 'game:updated',
         'game:bingoClaimedBy', 'player:reconnected', 'game:rematchRequested'] as const)
      .map(e => [e, createHandler()]),
    ['player:readyStatus', createHandler()],
    // Optimized delta update handler for better performance
    ['game:move-update', (data: unknown) => {
      const { gameId, newMoves, currentTurn, status } = data as { 
        gameId: string; 
        newMoves: Move[]; 
        currentTurn: string; 
        status: string; 
      };
      setState(s => {
        if (s.currentGame?.gameId === gameId) {
          const updatedGame: Game = {
            ...s.currentGame,
            moves: [...(s.currentGame.moves || []), ...newMoves],
            currentTurn: currentTurn as 'challenger' | 'acceptor' | null,
            status: status as 'waiting' | 'lobby' | 'playing' | 'completed'
          };
          return { ...s, currentGame: updatedGame };
        }
        return s;
      });
    }],
    ['player:disconnected', (data: unknown) => {
      const { game } = data as { game?: Game; playerId: string };
      if (game) setState(s => ({ ...s, currentGame: game }));
    }],
    ['player:reconnected', (data: unknown) => {
      const { game } = data as { game?: Game; playerId: string };
      if (game) {
        console.log(`[DEBUG] Player reconnected, updating game state:`, game);
        setState(s => ({ ...s, currentGame: game }));
      }
    }],
    ['game:state', (data: unknown) => {
      const { game } = data as { game?: Game };
      if (game) {
        console.log(`[DEBUG] Received game state update:`, game);
        setState(s => ({ ...s, currentGame: game }));
      }
    }],
    ['connection:reconnect:success', (data: unknown) => {
      const { game } = data as { game?: Game };
      if (game) {
        console.log(`[DEBUG] Reconnection successful, restoring game state:`, game);
        setState(s => ({ ...s, currentGame: game }));
      }
    }],
    ['game:rematchRequested', (data: unknown) => {
      const { game } = data as { game?: Game };
      if (game) {
        console.log(`[DEBUG] Rematch requested, updating game state:`, game);
        setState(s => ({ ...s, currentGame: game }));
      }
    }],
    ['game:rematchAccepted', (data: unknown) => {
      const { newGameId, newGame } = data as { newGameId?: string; newGame?: Game };
      if (newGameId && newGame) {
        setState(s => ({ ...s, currentGame: newGame, error: null }));
        window.location.href = `/lobby/${newGameId}`;
      }
    }],
    ['error', (error: unknown) => setState(s => ({ ...s, error: (error as SocketResponse).message || 'Error occurred' }))]
  ], [createHandler]);

  // Ultra-compact event registration
  useEffect(() => isConnected && socket ?
    (() => { const unsubs = eventConfig.map(([e, h]) => on(e as string, h as (data: unknown) => void)); return () => unsubs.forEach(u => u()); })() : undefined,
    [isConnected, socket, on, eventConfig]);

  // Enhanced async operation wrapper with better error handling and logging
  const executeSocketOperation = useCallback(async (event: string, data: Record<string, unknown> = {}, timeout = 10000): Promise<GameResponse> => {
    console.log(`Executing socket operation: ${event}`, data);
    
    if (!user) {
      console.error('Socket operation failed: User not authenticated');
      throw new Error('User not authenticated');
    }
    
    if (!isConnected) {
      console.error('Socket operation failed: Socket not connected');
      throw new Error('Socket not connected, please try again');
    }
    
    setState(s => ({ ...s, isLoading: true, error: null }));
    console.log('Setting game state to loading');

    return new Promise<GameResponse>((resolve, reject) => {
      const timer = setTimeout(() => {
        console.error(`Socket operation ${event} timed out after ${timeout}ms`);
        reject(new Error('Request timeout - server did not respond'));
      }, timeout);
      
      console.log(`Emitting ${event} with user:`, user.identifier);
      emit(event, { ...data, identifier: user.identifier, name: user.name }, (response: unknown) => {
        clearTimeout(timer);
        console.log(`Response received for ${event}:`, response);
        setState(s => ({ ...s, isLoading: false }));
        
        const { game, error } = response as SocketResponse;
        if (error) { 
          console.error(`Socket operation ${event} failed with error:`, error);
          setState(s => ({ ...s, error })); 
          reject(new Error(error)); 
        }
        else if (game) {
          console.log(`Socket operation ${event} succeeded with game:`, game.gameId);
          // Optimized state update - only update if game data actually changed
          setState(s => {
            const gameChanged = !s.currentGame || 
              s.currentGame.gameId !== game.gameId ||
              s.currentGame.status !== game.status ||
              s.currentGame.moves?.length !== game.moves?.length;
            
            return gameChanged ? { ...s, currentGame: game } : s;
          });
          resolve({ success: true, game, gameId: game.gameId });
        }
        else {
          console.error(`Socket operation ${event} received invalid response:`, response);
          reject(new Error('Invalid response from server'));
        }
      });
    }).catch(err => { 
      console.error(`Caught error in socket operation ${event}:`, err);
      setState(s => ({ ...s, isLoading: false, error: (err as Error).message })); 
      throw err; 
    });
  }, [user, isConnected, emit]);

  // Ultra-compact game operations with inline logic and memoized fetchGame
  const operations = useMemo(() => ({
    createGame: () => executeSocketOperation('game:create'),
    joinGame: (gameId: string) => executeSocketOperation('game:join', { gameId }),
    setPlayerReady: (card: number[][]) => state.currentGame ?
      executeSocketOperation('player:ready', { gameId: state.currentGame.gameId, playerId: user?.identifier, card: Array.isArray(card) ? card : null }) :
      Promise.reject(new Error('No active game')),
    fetchGame: async (gameId: string) => state.isLoading ? Promise.reject(new Error('Loading')) :
      executeSocketOperation('game:fetch', { gameId }).then(result => (setState(s => ({ ...s, currentGame: result.game! })), result)),
    requestRematch: () => state.currentGame ? executeSocketOperation('game:requestRematch', { gameId: state.currentGame.gameId }) : Promise.reject(new Error('No active game')),
    leaveGame: () => setState(s => ({ ...s, currentGame: null, error: null }))
  }), [executeSocketOperation, state.currentGame, state.isLoading, user]);

  return <GameContext.Provider value={{ ...state, ...operations }}>{children}</GameContext.Provider>;
};