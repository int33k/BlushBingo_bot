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

  // User initialization with short polling/retry for Telegram user
  useEffect(() => {
    const storedUser = localStorage.getItem('bingoUser');
    const forceNewUser = new URLSearchParams(window.location.search).get('newuser') === 'true';

    // Debug log for Telegram API
    console.log('[Telegram Debug] window.Telegram:', window.Telegram);
    if (window.Telegram && window.Telegram.WebApp) {
      console.log('[Telegram Debug] window.Telegram.WebApp:', window.Telegram.WebApp);
      console.log('[Telegram Debug] window.Telegram.WebApp.initDataUnsafe:', window.Telegram.WebApp.initDataUnsafe);
    }

    // Poll for Telegram user for up to 2 seconds
    let attempts = 0;
    const maxAttempts = 10;
    const interval = setInterval(() => {
      attempts++;
      const telegramUser = window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user;
      if (telegramUser) {
        const photoUrl = (telegramUser as { photo_url?: string }).photo_url;
        console.log('[Telegram Debug] Telegram user found:', telegramUser);
        console.log('[Telegram Debug] photoUrl:', photoUrl);
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
        clearInterval(interval);
        setUserLoading(false);
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        if (storedUser && !forceNewUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
          } catch {
            localStorage.removeItem('bingoUser');
          }
        } else {
          const identifier = `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
          const newUser: User = { identifier, name: `Player_${identifier.slice(-5)}`, isAuthenticated: true };
          setUser(newUser);
          localStorage.setItem('bingoUser', JSON.stringify(newUser));
          if (forceNewUser) window.history.replaceState({}, '', window.location.pathname + window.location.hash);
        }
        setUserLoading(false);
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  const login = (identifier: string, name?: string) => {
    const newUser: User = { identifier, name: name || `Player_${identifier.slice(-5)}`, isAuthenticated: true };
    setUser(newUser);
    localStorage.setItem('bingoUser', JSON.stringify(newUser));
  };

  const logout = () => { setUser(null); localStorage.removeItem('bingoUser'); };

  const value: UserContextType & { userLoading: boolean } = {
    user,
    setUser,
    isAuthenticated: !!user?.isAuthenticated,
    login,
    logout,
    userLoading
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};