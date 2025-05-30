// Ultra-compact custom hooks with inline implementations
import { useContext } from 'react';
import { GameContext } from '../contexts/GameContextDefinition';
import { SocketContext } from '../contexts/SocketContext';
import { UserContext } from '../contexts/UserContext';

const createHook = <T>(context: React.Context<T | undefined>, name: string) => (): T => {
  const ctx = useContext(context);
  if (ctx === undefined) throw new Error(`${name} must be used within a ${name.replace('use', '')}Provider`);
  return ctx;
};

export const useGame = createHook(GameContext, 'useGame');
export const useSocket = createHook(SocketContext, 'useSocket');
export const useUser = createHook(UserContext, 'useUser');
