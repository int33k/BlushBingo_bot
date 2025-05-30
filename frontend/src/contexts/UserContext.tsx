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

  // Ultra-compact user initialization
  useEffect(() => {
    const storedUser = localStorage.getItem('bingoUser');
    const forceNewUser = new URLSearchParams(window.location.search).get('newuser') === 'true';

    if (storedUser && !forceNewUser) {
      try { setUser(JSON.parse(storedUser)); }
      catch { localStorage.removeItem('bingoUser'); }
    } else {
      const identifier = `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      const newUser: User = { identifier, name: `Player_${identifier.slice(-5)}`, isAuthenticated: true };
      setUser(newUser);
      localStorage.setItem('bingoUser', JSON.stringify(newUser));
      if (forceNewUser) window.history.replaceState({}, '', window.location.pathname + window.location.hash);
    }
  }, []);

  const login = (identifier: string, name?: string) => {
    const newUser: User = { identifier, name: name || `Player_${identifier.slice(-5)}`, isAuthenticated: true };
    setUser(newUser);
    localStorage.setItem('bingoUser', JSON.stringify(newUser));
  };

  const logout = () => { setUser(null); localStorage.removeItem('bingoUser'); };

  const value: UserContextType = {
    user,
    setUser,
    isAuthenticated: !!user?.isAuthenticated,
    login,
    logout
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};