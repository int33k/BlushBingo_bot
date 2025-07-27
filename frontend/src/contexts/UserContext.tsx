import React, { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, UserContextType } from '../types';

// eslint-disable-next-line react-refresh/only-export-components
export const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  // Optimized user initialization: synchronous localStorage, instant setup, Telegram support
  useEffect(() => {
    const storedUser = localStorage.getItem('bingoUser');
    const forceNewUser = new URLSearchParams(window.location.search).get('newuser') === 'true';
    const telegramUser = window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user;
    if (telegramUser) {
      const photoUrl = (telegramUser as { photo_url?: string }).photo_url;
      const identifier = telegramUser.id ? `telegram_${telegramUser.id}` : `user_${Date.now()}`;
      const newUser: User = {
        identifier,
        name: telegramUser.first_name + (telegramUser.last_name ? ` ${telegramUser.last_name}` : ''),
        username: telegramUser.username,
        telegramId: telegramUser.id?.toString(),
        photoUrl,
        isAuthenticated: true
      };
      setUser(newUser);
      localStorage.setItem('bingoUser', JSON.stringify(newUser));
      setUserLoading(false);
    } else if (storedUser && !forceNewUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('bingoUser');
        setUser(null);
      }
      setUserLoading(false);
    } else {
      const identifier = `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      const newUser: User = { identifier, name: `Player_${identifier.slice(-5)}`, isAuthenticated: true };
      setUser(newUser);
      localStorage.setItem('bingoUser', JSON.stringify(newUser));
      if (forceNewUser) window.history.replaceState({}, '', window.location.pathname + window.location.hash);
      setUserLoading(false);
    }
  }, []);

  const login = React.useCallback((identifier: string, name?: string) => {
    const newUser: User = { identifier, name: name || `Player_${identifier.slice(-5)}`, isAuthenticated: true };
    setUser(newUser);
    localStorage.setItem('bingoUser', JSON.stringify(newUser));
  }, [setUser]);

  const logout = React.useCallback(() => { setUser(null); localStorage.removeItem('bingoUser'); }, [setUser]);

  // Memoize context value to avoid unnecessary re-renders
  const contextValue = React.useMemo(() => ({
    user,
    setUser,
    isAuthenticated: !!user?.isAuthenticated,
    login,
    logout,
    userLoading
  }), [user, userLoading, login, logout, setUser]);
  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
};