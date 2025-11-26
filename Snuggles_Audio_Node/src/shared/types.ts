// Shared types between Main and Renderer processes

export interface AudioDevice {
  id: string;
  label: string;
  kind: 'audioinput' | 'audiooutput';
}

export interface ConnectionStatus {
  connected: boolean;
  connecting: boolean;
  error: string | null;
}

export interface VolumeData {
  input: number;  // 0-100
  output: number; // 0-100
}

export interface AppConfig {
  inputDeviceId: string | null;
  outputDeviceId: string | null;
  apiKey: string;
  lastUsed: number;
}

export interface ConversationTurn {
  id: string;
  timestamp: number;
  role: 'user' | 'assistant';
  text: string;
  audioUrl?: string;
}

export interface SessionSummary {
  id: string;
  timestamp: number;
  summary: string;
  turnCount: number;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  embedding?: number[];
  metadata: {
    source: string;
    type: 'pdf' | 'txt';
    addedAt: number;
  };
}

export interface RAGResult {
  document: KnowledgeDocument;
  score: number;
  relevance: number;
}

// IPC Channel Names
export const IPC_CHANNELS = {
  GET_AUDIO_DEVICES: 'get-audio-devices',
  SET_AUDIO_DEVICES: 'set-audio-devices',
  CONNECT_GEMINI: 'connect-gemini',
  DISCONNECT_GEMINI: 'disconnect-gemini',
  SEND_MESSAGE: 'send-message',
  TOGGLE_MUTE: 'toggle-mute',
  GET_STATUS: 'get-status',
  VOLUME_UPDATE: 'volume-update',
  CONNECTION_STATUS: 'connection-status',
  MESSAGE_RECEIVED: 'message-received',
  RESET_AGENT: 'reset-agent',
  SEARCH_KNOWLEDGE: 'search-knowledge',
  LOAD_KNOWLEDGE: 'load-knowledge'
} as const;
