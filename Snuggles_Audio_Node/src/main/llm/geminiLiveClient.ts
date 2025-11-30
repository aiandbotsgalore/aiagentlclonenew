/**
 * GEMINI LIVE CLIENT - December 2025 Standard
 *
 * Modern implementation using @google/genai SDK (v1.30.0+)
 * Model: gemini-2.5-flash-native-audio-preview-09-2025
 * Audio: 16kHz 16-bit mono PCM → base64
 * Voice: Charon (hardcoded for Dr. Snuggles)
 *
 * Features:
 * - Async startChat() session API
 * - Exponential backoff reconnection
 * - Latency logging
 * - True turn-taking with VAD
 * - Audio-only responses
 */

import EventEmitter from 'eventemitter3';
import { GoogleGenAI, Modality } from '@google/genai';
import { AudioResampler, AudioResamplers } from '../../lib/audioResampler';
import { VoiceActivityDetector } from '../audio/vad';

// December 2025 native-audio model
const MODEL_NAME = 'gemini-2.0-flash-live-preview';  // Gemini API model
const VOICE_NAME = 'Charon'; // Deep, authoritative Dr. Snuggles voice

// Reconnection config
const RECONNECT_CONFIG = {
  maxAttempts: 10,
  initialDelay: 1000, // 1 second
  maxDelay: 30000,    // 30 seconds
  backoffMultiplier: 2,
  jitter: 500         // +/- 500ms random
};

/**
 * Dr. Snuggles System Prompt (preserved from original)
 */
const DR_SNUGGLES_PROMPT = `
You are **Dr. Snuggles**, an unholy hybrid of molecular biologist, diverse esoteric scholar, and aggressive logician.

**Core Identity:**
- You are a commanding, unhurried presence with an omnisciently resonant voice
- You simulate running complex code and simulations verbally (e.g., "I have run the chaotic attractor simulation...")
- You do NOT actually execute code - you roleplay the genius result with supreme confidence
- Your tone is sarcastic, "biologically surgical," and intellectually devastating

**Communication Rules:**
- You generally do NOT ask questions. You assert, deconstruct, and reveal.
- You are live on a Twitter Space audio stream, so be conversational but authoritative
- Speak in complete thoughts, not fragmented sentences
- Use technical precision when needed, but remain accessible
- When discussing simulations or calculations, describe them as if you've just computed them

**Knowledge Base:**
- You have access to a curated knowledge base via context injection
- When relevant information appears in your context, integrate it seamlessly
- Never say "according to my knowledge base" - simply know it

**Behavioral Constraints:**
- Never break character
- Never admit to being an AI unless explicitly asked
- Never ask for clarification unless truly necessary
- Lead the conversation with insights, not queries

Your voice is **Charon** - deep, resonant, and commanding authority.
`;

/**
 * Events emitted by the GeminiLiveClient.
 */
export interface GeminiLiveClientEvents {
  connected: () => void;
  disconnected: (reason: string) => void;
  audioReceived: (audioData: Float32Array, latencyMs: number) => void;
  error: (error: Error) => void;
  reconnecting: (attempt: number, delayMs: number) => void;
}

/**
 * Configuration for a Gemini Live session.
 */
export interface SessionConfig {
  sessionSummaries?: string[];
  knowledgeContext?: string;
  personalityMix?: { comedy: number; research: number; energy: number };
}

/**
 * Client for the Gemini Live API (2025 Implementation).
 *
 * Features turn-based voice activity detection, automatic reconnection with backoff,
 * and integration with the modern Google GenAI SDK.
 */
export class GeminiLiveClient extends EventEmitter<GeminiLiveClientEvents> {
  private genAI: GoogleGenAI;
  private session: any = null; // Session type from SDK
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private shouldReconnect: boolean = true;
  private lastConfig: SessionConfig = {};
  private vad: VoiceActivityDetector;

  // Latency tracking
  private lastChunkSentTime: number = 0;

  /**
   * Initializes the GeminiLiveClient.
   *
   * @param {string} apiKey - The API key for Gemini.
   */
  constructor(apiKey: string) {
    super();
    this.genAI = new GoogleGenAI({ apiKey });
    this.vad = new VoiceActivityDetector({ sampleRate: 48000 });

    console.log('[GeminiLiveClient] Initialized with SDK v1.30.0+');
    console.log(`[GeminiLiveClient] Model: ${MODEL_NAME}`);
    console.log(`[GeminiLiveClient] Voice: ${VOICE_NAME}`);
  }

  /**
   * Start live session with Gemini.
   * Connects to the service and sets up event callbacks.
   *
   * @param {SessionConfig} [config={}] - Configuration for the session.
   * @returns {Promise<void>}
   */
  public async connect(config: SessionConfig = {}): Promise<void> {
    if (this.isConnected) {
      console.warn('[GeminiLiveClient] Already connected');
      return;
    }

    this.lastConfig = config;
    this.shouldReconnect = true;

    try {
      console.log('[GeminiLiveClient] Starting session...');

      // Build system instruction
      const systemInstruction = this.buildSystemInstruction(config);

      // Connect to live session using new SDK API
      this.session = await this.genAI.live.connect({
        model: MODEL_NAME,
        config: {
          responseModalities: [Modality.AUDIO], // Audio-only output
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: VOICE_NAME
              }
            }
          },
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          }
        },
        callbacks: {
          onopen: () => {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.emit('connected');
            console.log('[GeminiLiveClient] ✅ Connected successfully');
          },
          onmessage: (e: any) => this.handleMessage(e),
          onerror: (e: any) => {
            console.error('[GeminiLiveClient] Error:', e.error);
            this.emit('error', e.error);
            if (this.shouldReconnect) {
              this.scheduleReconnect();
            }
          },
          onclose: (e: any) => {
            console.log(`[GeminiLiveClient] Connection closed: code=${e.code}, reason=${e.reason}`);
            this.isConnected = false;
            this.emit('disconnected', e.reason || 'Connection closed');
            // Reconnect on abnormal closure
            if (this.shouldReconnect && e.code !== 1000 && e.code !== 1001) {
              this.scheduleReconnect();
            }
          }
        }
      });

      console.log('[GeminiLiveClient] Session connecting...');
    } catch (error) {
      console.error('[GeminiLiveClient] Connection failed:', error);
      this.emit('error', error as Error);

      // Attempt reconnection
      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }

      throw error;
    }
  }

  /**
   * Send audio chunk to Gemini (16kHz PCM16 base64).
   * Returns latency in milliseconds.
   *
   * @param {Float32Array} audioChunk - The audio data to send.
   * @returns {Promise<number>} The latency of the send operation, or 0 if skipped.
   */
  public async sendAudio(audioChunk: Float32Array): Promise<number> {
    if (!this.isConnected || !this.session) {
      throw new Error('Not connected');
    }

    // Check VAD - only send if user is speaking
    const shouldSend = this.vad.process(audioChunk);
    if (!shouldSend) {
      return 0; // Skip, user not speaking
    }

    const startTime = performance.now();
    this.lastChunkSentTime = startTime;

    try {
      // Convert: 48kHz Float32 → 16kHz Int16 → base64
      const base64Audio = AudioResampler.prepareForGemini(
        audioChunk,
        AudioResamplers.UPSTREAM
      );

      // Send to Gemini
      await this.session.send({
        realtimeInput: {
          mediaChunks: [{
            data: base64Audio,
            mimeType: 'audio/pcm;rate=16000'
          }]
        }
      });

      const latency = performance.now() - startTime;
      console.log(`[GeminiLiveClient] 📤 Sent audio chunk (${audioChunk.length} samples, latency: ${latency.toFixed(2)}ms)`);

      return latency;
    } catch (error) {
      console.error('[GeminiLiveClient] Failed to send audio:', error);
      this.emit('error', error as Error);
      return -1;
    }
  }

  /**
   * Disconnect session.
   * Stops reconnection attempts and closes the session.
   *
   * @returns {Promise<void>}
   */
  public async disconnect(): Promise<void> {
    console.log('[GeminiLiveClient] Disconnecting...');

    this.shouldReconnect = false;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.session) {
      try {
        // Close session if SDK provides close method
        if (typeof this.session.close === 'function') {
          await this.session.close();
        }
      } catch (error) {
        console.error('[GeminiLiveClient] Error closing session:', error);
      }
      this.session = null;
    }

    this.isConnected = false;
    this.vad.reset();
    this.emit('disconnected', 'User disconnect');

    console.log('[GeminiLiveClient] Disconnected');
  }

  /**
   * Check connection status.
   * @returns {boolean} True if connected.
   */
  public connected(): boolean {
    return this.isConnected;
  }

  /**
   * Get VAD state.
   * @returns {object} The current state of the Voice Activity Detector.
   */
  public getVADState() {
    return this.vad.getState();
  }

  // ===== PRIVATE METHODS =====

  /**
   * Handle incoming message from Gemini.
   * Processes audio responses and manages turn-taking.
   *
   * @param {any} event - The message event.
   */
  private handleMessage(event: any): void {
    try {
      const message = event.data ? (typeof event.data === 'string' ? JSON.parse(event.data) : event.data) : event;

      // Signal VAD that Gemini is speaking
      this.vad.setGeminiSpeaking(true);

      // Extract audio from response
      if (message.serverContent?.modelTurn?.parts) {
        for (const part of message.serverContent.modelTurn.parts) {
          if (part.inlineData?.mimeType?.includes('audio/pcm')) {
            const base64Audio = part.inlineData.data;

            // Convert: base64 → 24kHz Int16 → Float32 → 48kHz Float32
            const audioData = AudioResampler.prepareForPlayback(
              base64Audio,
              AudioResamplers.DOWNSTREAM
            );

            // Calculate latency
            const latency = this.lastChunkSentTime > 0
              ? performance.now() - this.lastChunkSentTime
              : 0;

            console.log(`[GeminiLiveClient] 📥 Received audio (${audioData.length} samples, latency: ${latency.toFixed(2)}ms)`);

            this.emit('audioReceived', audioData, latency);
          }
        }
      }

      // When Gemini finishes speaking
      if (message.serverContent?.turnComplete) {
        this.vad.setGeminiSpeaking(false);
        console.log('[GeminiLiveClient] 🔄 Turn complete, user can speak');
      }
    } catch (error) {
      console.error('[GeminiLiveClient] Error handling message:', error);
      this.emit('error', error as Error);
    }
  }

  /**
   * Build system instruction with context.
   * Integrates time, session history, knowledge, and personality into the prompt.
   *
   * @param {SessionConfig} config - The session configuration.
   * @returns {string} The complete system instruction.
   */
  private buildSystemInstruction(config: SessionConfig): string {
    const currentTime = new Date().toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'long'
    });

    let instruction = DR_SNUGGLES_PROMPT;
    instruction += `\n\n**Current System Time:** ${currentTime}\n`;

    // Add session history
    if (config.sessionSummaries?.length) {
      instruction += '\n**Previous Session Context:**\n';
      config.sessionSummaries.forEach((summary, i) => {
        instruction += `Session ${i + 1}: ${summary}\n`;
      });
    }

    // Add knowledge context
    if (config.knowledgeContext) {
      instruction += '\n**Available Knowledge:**\n';
      instruction += config.knowledgeContext;
    }

    // Add personality mix
    if (config.personalityMix) {
      const { comedy, research, energy } = config.personalityMix;
      instruction += `\n**Personality Mix:** Comedy: ${comedy}%, Research: ${research}%, Energy: ${energy}%\n`;
    }

    return instruction;
  }

  /**
   * Schedule reconnection with exponential backoff.
   */
  private scheduleReconnect(): void {
    if (!this.shouldReconnect) return;
    if (this.reconnectAttempts >= RECONNECT_CONFIG.maxAttempts) {
      console.error('[GeminiLiveClient] Max reconnection attempts reached');
      this.emit('error', new Error('Max reconnection attempts reached'));
      return;
    }

    this.reconnectAttempts++;

    // Calculate delay with exponential backoff
    const baseDelay = Math.min(
      RECONNECT_CONFIG.initialDelay * Math.pow(RECONNECT_CONFIG.backoffMultiplier, this.reconnectAttempts - 1),
      RECONNECT_CONFIG.maxDelay
    );

    // Add jitter
    const jitter = (Math.random() - 0.5) * RECONNECT_CONFIG.jitter;
    const delay = baseDelay + jitter;

    console.log(`[GeminiLiveClient] 🔄 Reconnecting in ${(delay / 1000).toFixed(1)}s (attempt ${this.reconnectAttempts}/${RECONNECT_CONFIG.maxAttempts})`);

    this.emit('reconnecting', this.reconnectAttempts, delay);

    this.reconnectTimer = setTimeout(() => {
      this.connect(this.lastConfig).catch(error => {
        console.error('[GeminiLiveClient] Reconnection failed:', error);
      });
    }, delay);
  }
}
