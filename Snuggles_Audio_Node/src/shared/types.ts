// Shared types between Main and Renderer processes

/**
 * Represents an audio input or output device.
 */
export interface AudioDevice {
  /** Unique identifier for the device. */
  id: string;
  /** Human-readable label for the device. */
  label: string;
  /** Type of device (input or output). */
  kind: 'audioinput' | 'audiooutput';
}

/**
 * Represents the current connection status to the AI service.
 */
export interface ConnectionStatus {
  /** Whether currently connected. */
  connected: boolean;
  /** Whether currently attempting to connect. */
  connecting: boolean;
  /** Error message if connection failed. */
  error: string | null;
}

/**
 * Represents volume levels for input and output.
 */
export interface VolumeData {
  /** Input volume level (0-100). */
  input: number;
  /** Output volume level (0-100). */
  output: number;
}

/**
 * Application configuration settings.
 */
export interface AppConfig {
  /** ID of the selected input device. */
  inputDeviceId: string | null;
  /** ID of the selected output device. */
  outputDeviceId: string | null;
  /** API key for the service. */
  apiKey: string;
  /** Timestamp of last usage. */
  lastUsed: number;
}

/**
 * Represents a single turn in the conversation history.
 */
export interface ConversationTurn {
  /** Unique ID for the turn. */
  id: string;
  /** Timestamp of the turn. */
  timestamp: number;
  /** Role of the speaker ('user' or 'assistant'). */
  role: 'user' | 'assistant';
  /** Text content of the turn. */
  text: string;
  /** Optional URL to the audio recording. */
  audioUrl?: string;
}

/**
 * Summary of a completed session.
 */
export interface SessionSummary {
  /** Unique ID for the session. */
  id: string;
  /** Timestamp of the session. */
  timestamp: number;
  /** Text summary of the session content. */
  summary: string;
  /** Number of turns in the session. */
  turnCount: number;
}

/**
 * Represents a document in the knowledge base.
 */
export interface KnowledgeDocument {
  /** Unique ID for the document. */
  id: string;
  /** Title of the document. */
  title: string;
  /** Content of the document. */
  content: string;
  /** Optional vector embedding for semantic search. */
  embedding?: number[];
  /** Metadata associated with the document. */
  metadata: {
    source: string;
    type: 'pdf' | 'txt';
    addedAt: number;
  };
}

/**
 * Result from a Retrieval-Augmented Generation (RAG) search.
 */
export interface RAGResult {
  /** The retrieved document. */
  document: KnowledgeDocument;
  /** Raw search score. */
  score: number;
  /** Normalized relevance score (0-100). */
  relevance: number;
}

// === Enhanced Analytics Types ===

/**
 * Real-time analytics for the current session.
 */
export interface LiveAnalytics {
  /** Distribution of speaking time. */
  speakingTime: {
    ai: number;      // percentage
    user: number;    // percentage
  };
  /** Total number of AI responses. */
  totalResponses: number;
  /** Average response time in seconds. */
  avgResponseTime: number; // seconds
  /** Number of times speakers interrupted each other. */
  interrupts: number;
  /** Success rate of jokes (percentage). */
  jokeSuccessRate: number; // percentage
  /** List of automatically detected clip-worthy moments. */
  clipWorthyMoments: ClipMoment[];
}

/**
 * Represents a moment in the session deemed worthy of creating a clip.
 */
export interface ClipMoment {
  /** Unique ID for the moment. */
  id: string;
  /** Timestamp of the moment. */
  timestamp: number;
  /** Title or description of the moment. */
  title: string;
  /** Formatted timestamp string "HH:MM:SS". */
  timeInSession: string;
  /** Text snippet of the moment. */
  snippet: string;
}

/**
 * Represents a key topic discussed in the session.
 */
export interface KeyTopic {
  /** The topic name. */
  topic: string;
  /** Number of times mentioned. */
  mentions: number;
  /** Who mentioned the topic. */
  speaker: 'user' | 'assistant' | 'both';
}

/**
 * Note about a specific speaker.
 */
export interface SpeakerNote {
  /** The speaker name or identifier. */
  speaker: string;
  /** The note content. */
  note: string;
  /** Timestamp of the note. */
  timestamp: number;
}

/**
 * Aggregated memory of the session context.
 */
export interface SessionMemory {
  /** List of key topics discussed. */
  keyTopics: KeyTopic[];
  /** Notes about speakers. */
  speakerNotes: SpeakerNote[];
  /** List of running jokes or callbacks. */
  runningJokes: string[];
}

/**
 * Configuration for the AI's personality.
 */
export interface PersonalityMix {
  /** Comedy level (0-100). */
  comedy: number;
  /** Research/Information focus level (0-100). */
  research: number;
  /** Energy level (0-100). */
  energy: number;
}

/**
 * Status of the AI Co-host.
 */
export interface AICohostStatus {
  /** Current state of the AI. */
  status: 'idle' | 'listening' | 'thinking' | 'speaking';
  /** Last response time in seconds. */
  responseTime: number;
  /** Confidence level of the last response (0-100). */
  confidence: number;
}

/**
 * Definition of a quick command.
 */
export interface QuickCommand {
  /** Unique ID. */
  id: string;
  /** Display label. */
  label: string;
  /** Keyboard shortcut. */
  shortcut: string;
  /** Action function to execute. */
  action: () => void;
}

// === December 2025 Audio Streaming Types ===

/**
 * Metrics related to latency in the audio pipeline.
 */
export interface LatencyMetrics {
  /** Time to upload audio chunk (ms). */
  audioUpload: number;
  /** Time for Gemini to process and generate response (ms). */
  geminiProcessing: number;
  /** Time to download audio response (ms). */
  audioDownload: number;
  /** Total roundtrip time (ms). */
  totalRoundtrip: number;
  /** Timestamp of the measurement. */
  timestamp: number;
}

/**
 * State of the Voice Activity Detector.
 */
export interface VADState {
  /** Whether user is speaking. */
  isSpeaking: boolean;
  /** Whether Gemini is speaking. */
  isGeminiSpeaking: boolean;
  /** Consecutive frames with speech. */
  speechFrameCount: number;
  /** Consecutive frames of silence. */
  silenceFrameCount: number;
}

/**
 * Configuration for the audio stream.
 */
export interface AudioStreamConfig {
  /** Input sample rate (e.g., 48000). */
  inputSampleRate: number;
  /** Output sample rate (e.g., 48000). */
  outputSampleRate: number;
  /** Sample rate expected by Gemini input (e.g., 16000). */
  geminiInputRate: number;
  /** Sample rate provided by Gemini output (e.g., 24000). */
  geminiOutputRate: number;
  /** Whether VAD is enabled. */
  enableVAD: boolean;
}

/**
 * IPC Channel names for communication between Main and Renderer processes.
 */
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
