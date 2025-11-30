import { useState, useRef, useCallback, useEffect } from 'react';
import { GenAILiveClient } from '../lib/GenAILiveClient';
import { AudioStreamer } from '../lib/AudioStreamer';
import { useAgentStore } from '../stores/useAgent';
import { useUserStore } from '../stores/useUser';

/**
 * Interface representing the return value of the `useLiveApi` hook.
 */
export interface UseLiveApiReturn {
  /**
   * Indicates if the client is currently connected.
   */
  isConnected: boolean;
  /**
   * The current output volume level (0-1).
   */
  outputVolume: number;
  /**
   * The underlying GenAI Live Client instance.
   */
  client: GenAILiveClient | null;
  /**
   * Connects to the Live API.
   * @returns {Promise<void>}
   */
  connect: () => Promise<void>;
  /**
   * Disconnects from the Live API.
   */
  disconnect: () => void;
  /**
   * The current connection error message, if any.
   */
  connectionError: string | null;
  /**
   * Indicates if a connection is currently being established.
   */
  isConnecting: boolean;
  /**
   * The current reconnection attempt number.
   */
  reconnectAttempt: number;
}

const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;

/**
 * Hook to manage the connection to the Generative AI Live API.
 *
 * This hook handles connection state, audio streaming, error handling, and automatic reconnection.
 *
 * @returns {UseLiveApiReturn} The hook's return value.
 */
export const useLiveApi = (): UseLiveApiReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [outputVolume, setOutputVolume] = useState(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [clientInstance, setClientInstance] = useState<GenAILiveClient | null>(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  const clientRef = useRef<GenAILiveClient | null>(null);
  const streamerRef = useRef<AudioStreamer | null>(null);
  const streamerInitialized = useRef(false);
  
  // Reconnection control refs
  const shouldReconnect = useRef(true);  // False when user explicitly disconnects
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Store latest connection params in refs for reconnection
  const lastAgent = useRef<typeof currentAgent>(null);
  const lastUserData = useRef<{ name: string; info?: string | null } | null>(null);

  // Ref for volume update throttling to avoid closure issues
  const lastVolumeUpdateRef = useRef(0);

  const { current: currentAgent } = useAgentStore();
  const { name, info } = useUserStore();

  /**
   * Internal function to establish a connection.
   *
   * @param {boolean} [isReconnect=false] - Whether this is a reconnection attempt.
   * @returns {Promise<void>}
   */
  const connectInternal = useCallback(async (isReconnect = false): Promise<void> => {
    if (!clientRef.current || !streamerRef.current) {
      throw new Error('Client not initialized');
    }

    const agent = isReconnect ? lastAgent.current : currentAgent;
    const userData = isReconnect ? lastUserData.current : { name, info };

    // Input validation
    if (!agent) {
      throw new Error('Missing agent configuration');
    }
    if (!userData || userData.name == null) {
      throw new Error('Invalid user data - name is required');
    }
    if (typeof userData.name !== 'string') {
      throw new Error('User name must be a string');
    }
    // Info is optional - can be null, undefined, or string
    if (userData.info != null && typeof userData.info !== 'string') {
      throw new Error('User info must be a string when provided');
    }
    if (userData.name.trim().length === 0) {
      throw new Error('User name cannot be empty');
    }

    // Store connection params BEFORE attempting connection so reconnect logic has them
    if (!isReconnect) {
      lastAgent.current = agent;
      lastUserData.current = userData;
    }

    try {
      setIsConnecting(true);
      setConnectionError(null);

      if (!streamerInitialized.current) {
        await streamerRef.current.init();
        streamerInitialized.current = true;
      }

      await clientRef.current.connect(agent, userData);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Connection failed:', errorMsg);
      setConnectionError(errorMsg);
      setIsConnected(false);
      setIsConnecting(false);
      throw error;
    }
  }, [currentAgent, name, info]);

  /**
   * Schedules a reconnection attempt with exponential backoff.
   */
  const scheduleReconnect = useCallback(() => {
    if (!shouldReconnect.current) {
      console.log('Reconnection disabled (user disconnected)');
      return;
    }

    if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error(`Max reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached`);
      setConnectionError('Connection lost. Max reconnection attempts reached.');
      return;
    }

    // Calculate delay with exponential backoff + jitter
    const exponentialDelay = BASE_RECONNECT_DELAY_MS * Math.pow(2, reconnectAttempts.current);
    const jitter = Math.random() * 500;  // 0-500ms jitter to prevent thundering herd
    const delay = Math.min(exponentialDelay + jitter, MAX_RECONNECT_DELAY_MS);

    reconnectAttempts.current++;
    setReconnectAttempt(reconnectAttempts.current);
    
    console.log(`Scheduling reconnect attempt ${reconnectAttempts.current} in ${Math.round(delay)}ms`);

    reconnectTimeout.current = setTimeout(async () => {
      try {
        await connectInternal(true);
      } catch (error) {
        // connectInternal already logs and sets error state
        // Schedule another attempt
        scheduleReconnect();
      }
    }, delay);
  }, [connectInternal]);

  /**
   * Cancels any pending reconnection attempts.
   */
  const cancelReconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
    reconnectAttempts.current = 0;
    setReconnectAttempt(0);
  }, []);

  useEffect(() => {
    const newClient = new GenAILiveClient();
    const newStreamer = new AudioStreamer();

    clientRef.current = newClient;
    streamerRef.current = newStreamer;
    setClientInstance(newClient);

    const onOpen = () => {
      console.log('Connection established');
      setIsConnected(true);
      setIsConnecting(false);
      setConnectionError(null);
      
      // Reset reconnection state on successful connection
      reconnectAttempts.current = 0;
      setReconnectAttempt(0);
    };

    const onClose = (event?: { code?: number; reason?: string }) => {
      const code = event?.code ?? 0;
      const reason = event?.reason ?? 'Unknown';
      
      console.log(`Connection closed: code=${code}, reason=${reason}`);
      setIsConnected(false);
      setIsConnecting(false);

      // Normal closure codes (1000 = normal, 1001 = going away intentionally)
      const normalClosure = code === 1000 || code === 1001;

      if (!normalClosure && shouldReconnect.current) {
        console.log('Abnormal closure detected, initiating reconnection...');
        scheduleReconnect();
      }
    };

    const onError = (error: Error) => {
      console.error('Live client error:', error);
      setConnectionError(error.message);
      // Don't set isConnected=false here; let onClose handle it
      // This prevents race conditions between error and close events
    };

    const onAudio = (audio: ArrayBuffer) => streamerRef.current?.receiveAudio(audio);

    // Throttle volume updates to prevent excessive re-renders
    const onVolume = (volume: number) => {
      const now = Date.now();
      if (now - lastVolumeUpdateRef.current > 50) {  // Max 20 updates/sec
        setOutputVolume(volume);
        lastVolumeUpdateRef.current = now;
      }
    };

    newClient.on('open', onOpen);
    newClient.on('close', onClose);
    newClient.on('error', onError);
    newClient.on('audio', onAudio);
    newStreamer.on('volume', onVolume);

    return () => {
      // Prevent reconnection during unmount
      shouldReconnect.current = false;
      cancelReconnect();
      
      newClient.removeAllListeners();
      newStreamer.removeAllListeners();
      newClient.disconnect();
      newStreamer.stop();
      streamerInitialized.current = false;
    };
  }, [scheduleReconnect, cancelReconnect]);

  /**
   * Initiates the connection to the Live API.
   * Can be called by the user.
   */
  const connect = useCallback(async (): Promise<void> => {
    if (isConnecting) {
      console.warn('Connection already in progress');
      return;
    }

    // Enable auto-reconnect for user-initiated connections
    shouldReconnect.current = true;
    cancelReconnect();

    if (isConnected) {
      clientRef.current?.disconnect();
      streamerRef.current?.stop();
    }

    await connectInternal(false);
  }, [isConnecting, isConnected, connectInternal, cancelReconnect]);

  /**
   * Disconnects from the Live API.
   * Can be called by the user.
   */
  const disconnect = useCallback(() => {
    // Disable auto-reconnect when user explicitly disconnects
    shouldReconnect.current = false;
    cancelReconnect();

    clientRef.current?.disconnect();
    streamerRef.current?.stop();
    setIsConnected(false);
    setIsConnecting(false);
    setConnectionError(null);
  }, [cancelReconnect]);

  return {
    isConnected,
    isConnecting,
    outputVolume,
    connectionError,
    client: clientInstance,
    connect,
    disconnect,
    reconnectAttempt,
  };
};
