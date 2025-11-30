import React, { createContext, useContext } from 'react';
import { useLiveApi, UseLiveApiReturn } from '../hooks/useLiveApi';

/**
 * Context to hold the return value of the `useLiveApi` hook.
 */
const LiveAPIContext = createContext<UseLiveApiReturn | null>(null);

/**
 * Provides the Live API context to its children.
 *
 * This component initializes the `useLiveApi` hook and passes its result
 * to the `LiveAPIContext.Provider`.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {React.ReactNode} props.children - The child components that will have access to the context.
 * @returns {JSX.Element} The provider component.
 */
export const LiveAPIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const liveApi = useLiveApi();
  return (
    <LiveAPIContext.Provider value={liveApi}>
      {children}
    </LiveAPIContext.Provider>
  );
};

/**
 * Hook to consume the Live API context.
 *
 * @throws {Error} If used outside of a `LiveAPIProvider`.
 * @returns {UseLiveApiReturn} The Live API context value.
 */
export const useLiveAPI = (): UseLiveApiReturn => {
  const context = useContext(LiveAPIContext);
  if (!context) {
    throw new Error('useLiveAPI must be used within a LiveAPIProvider');
  }
  return context;
};
