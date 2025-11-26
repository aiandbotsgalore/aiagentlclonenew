import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS, AudioDevice, ConnectionStatus, VolumeData, ConversationTurn } from '../shared/types';

/**
 * Preload script - Exposes safe IPC APIs to renderer
 */

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('snugglesAPI', {
  // Audio devices
  getAudioDevices: () => ipcRenderer.invoke(IPC_CHANNELS.GET_AUDIO_DEVICES),
  setAudioDevices: (inputId: string, outputId: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.SET_AUDIO_DEVICES, inputId, outputId),

  // Gemini connection
  connect: () => ipcRenderer.invoke(IPC_CHANNELS.CONNECT_GEMINI),
  disconnect: () => ipcRenderer.invoke(IPC_CHANNELS.DISCONNECT_GEMINI),
  sendMessage: (text: string) => ipcRenderer.invoke(IPC_CHANNELS.SEND_MESSAGE, text),

  // Controls
  toggleMute: () => ipcRenderer.invoke(IPC_CHANNELS.TOGGLE_MUTE),
  resetAgent: () => ipcRenderer.invoke(IPC_CHANNELS.RESET_AGENT),

  // Status
  getStatus: () => ipcRenderer.invoke(IPC_CHANNELS.GET_STATUS),

  // Knowledge
  searchKnowledge: (query: string) => ipcRenderer.invoke(IPC_CHANNELS.SEARCH_KNOWLEDGE, query),
  loadKnowledge: () => ipcRenderer.invoke(IPC_CHANNELS.LOAD_KNOWLEDGE),

  // Event listeners
  onVolumeUpdate: (callback: (data: VolumeData) => void) => {
    ipcRenderer.on(IPC_CHANNELS.VOLUME_UPDATE, (_, data) => callback(data));
  },

  onConnectionStatus: (callback: (status: ConnectionStatus) => void) => {
    ipcRenderer.on(IPC_CHANNELS.CONNECTION_STATUS, (_, status) => callback(status));
  },

  onMessageReceived: (callback: (message: ConversationTurn) => void) => {
    ipcRenderer.on(IPC_CHANNELS.MESSAGE_RECEIVED, (_, message) => callback(message));
  },

  // ===== December 2025 Audio Streaming APIs =====

  /**
   * Start Gemini Live session with new SDK
   * @param config - Session configuration (optional)
   * @returns Promise<{ success: boolean; error?: string }>
   */
  genaiStartSession: (config?: any) =>
    ipcRenderer.invoke(IPC_CHANNELS.GENAI_START_SESSION, config),

  /**
   * Send audio chunk to Gemini (48kHz Float32Array)
   * Main process handles conversion to 16kHz PCM16 base64
   * @param audioChunk - Float32Array audio data
   * @returns Promise<number> - Latency in milliseconds
   */
  genaiSendAudioChunk: (audioChunk: Float32Array) =>
    ipcRenderer.invoke(IPC_CHANNELS.GENAI_SEND_AUDIO_CHUNK, audioChunk),

  /**
   * Listen for audio received from Gemini (48kHz Float32Array)
   * Main process handles conversion from 24kHz PCM16 base64
   */
  onGenaiAudioReceived: (callback: (audioData: Float32Array) => void) => {
    ipcRenderer.on(IPC_CHANNELS.GENAI_AUDIO_RECEIVED, (_, audioData) => callback(audioData));
  },

  /**
   * Listen for latency updates
   */
  onGenaiLatencyUpdate: (callback: (metrics: any) => void) => {
    ipcRenderer.on(IPC_CHANNELS.GENAI_LATENCY_UPDATE, (_, metrics) => callback(metrics));
  },

  /**
   * Listen for VAD state changes
   */
  onGenaiVADState: (callback: (state: any) => void) => {
    ipcRenderer.on(IPC_CHANNELS.GENAI_VAD_STATE, (_, state) => callback(state));
  }
});

// TypeScript type definitions for window.snugglesAPI
declare global {
  interface Window {
    snugglesAPI: {
      getAudioDevices: () => Promise<AudioDevice[]>;
      setAudioDevices: (inputId: string, outputId: string) => Promise<boolean>;
      connect: () => Promise<{ success: boolean; error?: string }>;
      disconnect: () => Promise<boolean>;
      sendMessage: (text: string) => Promise<boolean>;
      toggleMute: () => Promise<boolean>;
      resetAgent: () => Promise<boolean>;
      getStatus: () => Promise<{ connected: boolean; muted: boolean; devices: AudioDevice[] }>;
      searchKnowledge: (query: string) => Promise<any[]>;
      loadKnowledge: () => Promise<{ success: boolean; count: number }>;
      onVolumeUpdate: (callback: (data: VolumeData) => void) => void;
      onConnectionStatus: (callback: (status: ConnectionStatus) => void) => void;
      onMessageReceived: (callback: (message: ConversationTurn) => void) => void;
      // December 2025 Audio Streaming APIs
      genaiStartSession: (config?: any) => Promise<{ success: boolean; error?: string }>;
      genaiSendAudioChunk: (audioChunk: Float32Array) => Promise<number>;
      onGenaiAudioReceived: (callback: (audioData: Float32Array) => void) => void;
      onGenaiLatencyUpdate: (callback: (metrics: any) => void) => void;
      onGenaiVADState: (callback: (state: any) => void) => void;
    };
  }
}
