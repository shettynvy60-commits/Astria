import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext(null);

const STORAGE_KEY = 'astria_user_profile';
const AUTH_KEY = 'astria_auth_state';

const DEFAULT_GUEST = {
  fullName: '',
  email: '',
  phone: '',
  isGuest: true,
  isAuthenticated: false,
};

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const auth = localStorage.getItem(AUTH_KEY);
      if (saved && auth === 'true') return JSON.parse(saved);
    } catch {}
    return DEFAULT_GUEST;
  });

  const [streakCount] = useState(5);

  const updateUser = (updates) => {
    setUser(prev => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        if (next.isAuthenticated) localStorage.setItem(AUTH_KEY, 'true');
      } catch {}
      return next;
    });
  };

  const login = ({ fullName, email, phone }) => {
    const profile = { fullName, email, phone, isGuest: false, isAuthenticated: true };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      localStorage.setItem(AUTH_KEY, 'true');
    } catch {}
    setUser(profile);
  };

  const continueAsGuest = () => {
    const guest = { ...DEFAULT_GUEST, isAuthenticated: true, isGuest: true };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(guest));
      localStorage.setItem(AUTH_KEY, 'true');
    } catch {}
    setUser(guest);
  };

  const logout = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(AUTH_KEY);
    } catch {}
    setUser(DEFAULT_GUEST);
  };

  // Derive initials for avatar
  const initials = user.fullName
    ? user.fullName.trim().split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user.isGuest ? 'GU' : '??';

  return (
    <UserContext.Provider value={{ user, updateUser, login, continueAsGuest, logout, streakCount, initials }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
