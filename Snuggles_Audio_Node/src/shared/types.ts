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

// === Enhanced Analytics Types ===

export interface LiveAnalytics {
  speakingTime: {
    ai: number;      // percentage
    user: number;    // percentage
  };
  totalResponses: number;
  avgResponseTime: number; // seconds
  interrupts: number;
  jokeSuccessRate: number; // percentage
  clipWorthyMoments: ClipMoment[];
}

export interface ClipMoment {
  id: string;
  timestamp: number;
  title: string;
  timeInSession: string; // formatted "HH:MM:SS"
  snippet: string;
}

export interface KeyTopic {
  topic: string;
  mentions: number;
  speaker: 'user' | 'assistant' | 'both';
}

export interface SpeakerNote {
  speaker: string;
  note: string;
  timestamp: number;
}

export interface SessionMemory {
  keyTopics: KeyTopic[];
  speakerNotes: SpeakerNote[];
  runningJokes: string[];
}

export interface PersonalityMix {
  comedy: number;    // 0-100
  research: number;  // 0-100
  energy: number;    // 0-100
}

export interface AICohostStatus {
  status: 'idle' | 'listening' | 'thinking' | 'speaking';
  responseTime: number; // seconds
  confidence: number;   // 0-100
}

export interface QuickCommand {
  id: string;
  label: string;
  shortcut: string;
  action: () => void;
}

// === December 2025 Audio Streaming Types ===

export interface LatencyMetrics {
  audioUpload: number;      // ms to upload audio chunk
  geminiProcessing: number; // ms for Gemini to respond
  audioDownload: number;    // ms to download audio response
  totalRoundtrip: number;   // ms total latency
  timestamp: number;
}

export interface VADState {
  isSpeaking: boolean;
  isGeminiSpeaking: boolean;
  speechFrameCount: number;
  silenceFrameCount: number;
}

export interface AudioStreamConfig {
  inputSampleRate: number;  // Typically 48000
  outputSampleRate: number; // Typically 48000
  geminiInputRate: number;  // 16000 (new standard)
  geminiOutputRate: number; // 24000
  enableVAD: boolean;
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
  LOAD_KNOWLEDGE: 'load-knowledge',
  // New channels for enhanced features
  GET_ANALYTICS: 'get-analytics',
  GET_SESSION_MEMORY: 'get-session-memory',
  UPDATE_PERSONALITY: 'update-personality',
  EXECUTE_QUICK_COMMAND: 'execute-quick-command',
  // December 2025 Audio Streaming Channels
  GENAI_START_SESSION: 'genai:startSession',
  GENAI_SEND_AUDIO_CHUNK: 'genai:sendAudioChunk',
  GENAI_AUDIO_RECEIVED: 'genai:audioReceived',
  GENAI_LATENCY_UPDATE: 'genai:latencyUpdate',
  GENAI_VAD_STATE: 'genai:vadState'
} as const;
