import EventEmitter from 'eventemitter3';
import WebSocket from 'ws';
import { AudioManager } from '../audio/audioManager';
import { ConnectionStatus, ConversationTurn } from '../../shared/types';

interface GeminiClientEvents {
  statusChange: (status: ConnectionStatus) => void;
  message: (message: ConversationTurn) => void;
  error: (error: Error) => void;
}

const GEMINI_WS_URL = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';
const MODEL = 'models/gemini-2.0-flash-exp';
const VOICE_NAME = 'Charon'; // Deep, authoritative tone for Dr. Snuggles

/**
 * Dr. Snuggles System Prompt
 * This defines the persona's behavior and tone
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
 * Client for interacting with the Google Generative AI Gemini Live API via WebSocket.
 *
 * It manages the connection, session setup, message sending (text/audio), and
 * handling of responses (audio/text).
 */
export class GeminiClient extends EventEmitter<GeminiClientEvents> {
  private ws: WebSocket | null = null;
  private apiKey: string;
  private audioManager: AudioManager;
  private connected: boolean = false;
  private connecting: boolean = false;
  private conversationHistory: ConversationTurn[] = [];

  /**
   * Initializes the GeminiClient.
   *
   * @param {string} apiKey - The API key for Gemini.
   * @param {AudioManager} audioManager - The audio manager for processing streams.
   */
  constructor(apiKey: string, audioManager: AudioManager) {
    super();
    this.apiKey = apiKey;
    this.audioManager = audioManager;

    // Note: Audio data will be sent from renderer via IPC in Electron architecture
    // The audioManager primarily handles resampling, not capture
  }

  /**
   * Connect to Gemini Live API.
   * Establishes a WebSocket connection and sends the initial setup message.
   *
   * @param {string[]} [sessionSummaries=[]] - Summaries of previous sessions to include in context.
   * @param {string} [knowledgeContext=''] - Relevant knowledge base content.
   * @returns {Promise<void>}
   */
  public async connect(
    sessionSummaries: string[] = [],
    knowledgeContext: string = ''
  ): Promise<void> {
    if (this.connected || this.connecting) {
      console.warn('[GeminiClient] Already connected or connecting');
      return;
    }

    this.connecting = true;
    this.emitStatus({ connected: false, connecting: true, error: null });

    try {
      // Build system instruction with dynamic context
      const systemInstruction = this.buildSystemInstruction(sessionSummaries, knowledgeContext);

      // Connect WebSocket with API key
      const wsUrl = `${GEMINI_WS_URL}?key=${this.apiKey}`;
      this.ws = new WebSocket(wsUrl);

      // Setup event handlers
      this.ws.on('open', () => this.onOpen(systemInstruction));
      this.ws.on('message', (data) => this.onMessage(data));
      this.ws.on('close', (code, reason) => this.onClose(code, reason.toString()));
      this.ws.on('error', (error) => this.onError(error));

      console.log('[GeminiClient] Connecting...');
    } catch (error) {
      this.connecting = false;
      this.emitStatus({ connected: false, connecting: false, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Disconnect from Gemini.
   * Closes the WebSocket connection.
   *
   * @returns {Promise<void>}
   */
  public async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close(1000, 'User disconnect');
      this.ws = null;
    }

    this.connected = false;
    this.connecting = false;
    this.emitStatus({ connected: false, connecting: false, error: null });

    console.log('[GeminiClient] Disconnected');
  }

  /**
   * Send text message to Gemini.
   *
   * @param {string} text - The text content to send.
   * @returns {Promise<void>}
   * @throws {Error} If not connected.
   */
  public async sendText(text: string): Promise<void> {
    if (!this.connected || !this.ws) {
      throw new Error('Not connected to Gemini');
    }

    const message = {
      client_content: {
        turns: [{
          role: 'user',
          parts: [{ text }]
        }]
      }
    };

    this.ws.send(JSON.stringify(message));
    console.log('[GeminiClient] Sent text:', text.substring(0, 50));
  }

  /**
   * Send audio chunk to Gemini.
   * Converts the buffer to Base64 and wraps it in the expected JSON format.
   *
   * @param {Buffer} buffer - The PCM audio buffer.
   */
  public sendAudio(buffer: Buffer): void {
    if (!this.connected || !this.ws) {
      return;
    }

    const message = {
      realtime_input: {
        media_chunks: [{
          data: buffer.toString('base64'),
          mime_type: 'audio/pcm'
        }]
      }
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Handle WebSocket open event.
   * Sends the setup message with model configuration and system instructions.
   *
   * @param {string} systemInstruction - The constructed system instruction.
   */
  private onOpen(systemInstruction: string): void {
    if (!this.ws) return;

    const setupMessage = {
      setup: {
        model: MODEL,
        generation_config: {
          response_modalities: ['AUDIO'], // Audio-only output
          speech_config: {
            voice_config: {
              prebuilt_voice_config: {
                voice_name: VOICE_NAME
              }
            }
          }
        },
        system_instruction: {
          parts: [{ text: systemInstruction }]
        }
      }
    };

    this.ws.send(JSON.stringify(setupMessage));
    this.connected = true;
    this.connecting = false;
    this.emitStatus({ connected: true, connecting: false, error: null });

    console.log('[GeminiClient] Connected with voice:', VOICE_NAME);
  }

  /**
   * Handle incoming WebSocket messages.
   * Processes audio responses and text transcriptions.
   *
   * @param {WebSocket.Data} data - The received data.
   */
  private onMessage(data: WebSocket.Data): void {
    try {
      const message = JSON.parse(data.toString());

      // Handle audio response
      if (message.serverContent?.modelTurn?.parts) {
        for (const part of message.serverContent.modelTurn.parts) {
          if (part.inlineData?.mimeType === 'audio/pcm') {
            const audioBuffer = Buffer.from(part.inlineData.data, 'base64');
            // Process audio through resampler
            this.audioManager.processOutput(audioBuffer);
            // TODO: Forward audio to renderer for playback via IPC event
          }

          // Also handle text transcription if available
          if (part.text) {
            const turn: ConversationTurn = {
              id: Date.now().toString(),
              timestamp: Date.now(),
              role: 'assistant',
              text: part.text
            };
            this.conversationHistory.push(turn);
            this.emit('message', turn);
          }
        }
      }

      // Handle setup confirmation
      if (message.setupComplete) {
        console.log('[GeminiClient] Setup complete');
      }

      // Handle errors
      if (message.error) {
        console.error('[GeminiClient] Server error:', message.error);
        this.emitStatus({
          connected: this.connected,
          connecting: false,
          error: message.error.message || 'Unknown error'
        });
      }
    } catch (error) {
      console.error('[GeminiClient] Failed to parse message:', error);
    }
  }

  /**
   * Handle WebSocket close event.
   * Updates connection status.
   *
   * @param {number} code - The close code.
   * @param {string} reason - The reason for closing.
   */
  private onClose(code: number, reason: string): void {
    this.connected = false;
    this.connecting = false;

    console.log(`[GeminiClient] Closed: code=${code}, reason=${reason}`);

    this.emitStatus({
      connected: false,
      connecting: false,
      error: code === 1000 ? null : `Connection closed: ${reason}`
    });
  }

  /**
   * Handle WebSocket error event.
   *
   * @param {Error} error - The error object.
   */
  private onError(error: Error): void {
    console.error('[GeminiClient] WebSocket error:', error);

    this.emitStatus({
      connected: false,
      connecting: false,
      error: error.message
    });

    this.emit('error', error);
  }

  /**
   * Build system instruction with dynamic context.
   * Incorporates current time, session history, and knowledge base content.
   *
   * @param {string[]} sessionSummaries - List of previous session summaries.
   * @param {string} knowledgeContext - Relevant knowledge context.
   * @returns {string} The complete system instruction.
   */
  private buildSystemInstruction(
    sessionSummaries: string[],
    knowledgeContext: string
  ): string {
    const currentTime = new Date().toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'long'
    });

    let instruction = DR_SNUGGLES_PROMPT;

    // Add time awareness
    instruction += `\n\n**Current System Time:** ${currentTime}\n`;

    // Add session history context
    if (sessionSummaries.length > 0) {
      instruction += '\n**Previous Session Context:**\n';
      sessionSummaries.forEach((summary, i) => {
        instruction += `Session ${i + 1}: ${summary}\n`;
      });
    }

    // Add knowledge base context
    if (knowledgeContext) {
      instruction += '\n**Available Knowledge:**\n';
      instruction += knowledgeContext;
    }

    return instruction;
  }

  /**
   * Emit status change event.
   *
   * @param {ConnectionStatus} status - The new connection status.
   */
  private emitStatus(status: ConnectionStatus): void {
    this.emit('statusChange', status);
  }

  /**
   * Check if connected.
   * @returns {boolean} True if connected.
   */
  public isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get conversation history.
   * @returns {ConversationTurn[]} Array of conversation turns.
   */
  public getHistory(): ConversationTurn[] {
    return [...this.conversationHistory];
  }
}
