import React, { createContext, useContext } from 'react';
import { useLiveApi, UseLiveApiReturn } from '../hooks/useLiveApi';

const LiveAPIContext = createContext<UseLiveApiReturn | null>(null);

export const LiveAPIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const liveApi = useLiveApi();
  return (
    <LiveAPIContext.Provider value={liveApi}>
      {children}
    </LiveAPIContext.Provider>
  );
};

export const useLiveAPI = (): UseLiveApiReturn => {
  const context = useContext(LiveAPIContext);
  if (!context) {
    throw new Error('useLiveAPI must be used within a LiveAPIProvider');
  }
  return context;
};