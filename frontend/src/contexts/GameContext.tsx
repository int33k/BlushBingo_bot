import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { Game, GameResponse } from '../types';
import { useSocket, useUser } from '../hooks';
import { GameContext } from './GameContextDefinition';

type SocketResponse = { game?: Game; error?: string; message?: string };

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState({ currentGame: null as Game | null, isLoading: false, error: null as string | null });
  const { socket, isConnected, emit, on } = useSocket();
  const { user } = useUser();

  // Ultra-compact handler factory with minimal logging
  const createHandler = useCallback((action?: () => void) => (data: unknown) => {
    const { game, error, message } = data as SocketResponse;
    if (game) { setState(s => ({ ...s, currentGame: game })); action?.(); }
    if (error || message) setState(s => ({ ...s, error: error || message || 'Error occurred' }));
  }, []);

  // Streamlined event configuration
  const eventConfig = useMemo(() => [
    ...(['game:created', 'game:joined', 'game:playerJoined', 'game:started', 'game:updated',
         'game:bingoClaimedBy', 'player:reconnected', 'game:rematchRequested'] as const)
      .map(e => [e, createHandler()]),
    ['player:readyStatus', createHandler(() => setState(s => ({ ...s, isLoading: false })))],
    ['player:disconnected', (data: unknown) => {
      const { game } = data as { game?: Game; playerId: string };
      if (game) setState(s => ({ ...s, currentGame: game }));
    }],
    ['game:rematchAccepted', (data: unknown) => {
      const { newGameId, newGame } = data as { newGameId?: string; newGame?: Game };
      if (newGameId && newGame) {
        setState(s => ({ ...s, currentGame: newGame, error: null }));
        window.location.href = `/#/lobby/${newGameId}`;
      }
    }],
    ['error', (error: unknown) => setState(s => ({ ...s, error: (error as SocketResponse).message || 'Error occurred' }))]
  ], [createHandler]);

  // Ultra-compact event registration
  useEffect(() => isConnected && socket ?
    (() => { const unsubs = eventConfig.map(([e, h]) => on(e as string, h as (data: unknown) => void)); return () => unsubs.forEach(u => u()); })() : undefined,
    [isConnected, socket, on, eventConfig]);

  // Ultra-compact async operation wrapper with state integration
  const executeSocketOperation = useCallback(async (event: string, data: Record<string, unknown> = {}, timeout = 10000): Promise<GameResponse> => {
    if (!user || !isConnected) throw new Error('User not authenticated or not connected');
    setState(s => ({ ...s, isLoading: true, error: null }));

    return new Promise<GameResponse>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Request timeout')), timeout);
      emit(event, { ...data, identifier: user.identifier, name: user.name }, (response: unknown) => {
        clearTimeout(timer);
        setState(s => ({ ...s, isLoading: false }));
        const { game, error } = response as SocketResponse;
        if (error) { setState(s => ({ ...s, error })); reject(new Error(error)); }
        else if (game) resolve({ success: true, game, gameId: game.gameId });
        else reject(new Error('Invalid response from server'));
      });
    }).catch(err => { setState(s => ({ ...s, isLoading: false, error: (err as Error).message })); throw err; });
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