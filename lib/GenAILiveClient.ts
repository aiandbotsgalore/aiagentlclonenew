import { GoogleGenAI, LiveServerMessage, GenerateContentResponse, Modality } from '@google/genai';
import { EventEmitter } from 'eventemitter3';
import { Agent } from '../types';

const MODEL = 'models/gemini-2.0-flash-live-001';

/**
 * Converts a Base64 string to an ArrayBuffer.
 *
 * @param {string} base64 - The Base64 encoded string.
 * @returns {ArrayBuffer} The ArrayBuffer containing the binary data.
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Events emitted by the GenAILiveClient.
 */
type LiveClientEvents = {
  /**
   * Emitted when the connection is established.
   */
  open: () => void;
  /**
   * Emitted when the connection is closed.
   */
  close: () => void;
  /**
   * Emitted when an error occurs.
   * @param {Error} error - The error object.
   */
  error: (error: Error) => void;
  /**
   * Emitted when audio data is received from the model.
   * @param {ArrayBuffer} buffer - The received audio data.
   */
  audio: (buffer: ArrayBuffer) => void;
};

/**
 * Client for interacting with the Google Generative AI Live API.
 *
 * It manages the WebSocket connection, sends input (audio/text) to the model,
 * and handles real-time responses.
 */
export class GenAILiveClient extends EventEmitter<LiveClientEvents> {
  private ai: GoogleGenAI;
  // Note: Using 'any' because 'LiveSession' type is not exported by @google/genai
  private session: any | null = null;

  /**
   * Initializes the GenAI client.
   *
   * @throws {Error} If the GEMINI_API_KEY environment variable is not set.
   */
  constructor() {
    super();
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('[GenAI] Initializing with API key:', apiKey ? '✓ Present' : '✗ Missing');
    
    if (!apiKey) {
      const error = 'GEMINI_API_KEY environment variable not set';
      console.error('[GenAI]', error);
      throw new Error(error);
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * Checks if a response part contains audio data.
   *
   * @private
   * @param {any} part - The response part to check.
   * @returns {boolean} True if the part is audio, false otherwise.
   */
  private isAudioPart(part: any): boolean {
    return part?.inlineData?.mimeType?.startsWith('audio/') && part.inlineData.data;
  }

  /**
   * Handles an audio response part.
   *
   * Decodes the Base64 audio data and emits an 'audio' event.
   *
   * @private
   * @param {any} part - The audio response part.
   */
  private handleAudioPart(part: any): void {
    console.log('Got audio response, size:', part.inlineData.data.length);
    const audioBuffer = base64ToArrayBuffer(part.inlineData.data);
    this.emit('audio', audioBuffer);
  }

  /**
   * Normalizes an error object into a standard Error instance.
   *
   * @private
   * @param {ErrorEvent | Error | unknown} e - The raw error.
   * @returns {Error} The normalized Error object.
   */
  private normalizeError(e: ErrorEvent | Error | unknown): Error {
    if (e instanceof Error) {
      return e;
    }
    if (typeof e === 'object' && e !== null && 'error' in e) {
      const errorEvent = e as ErrorEvent;
      return errorEvent.error instanceof Error
        ? errorEvent.error
        : new Error(errorEvent.message || 'Unknown error');
    }
    return new Error(String(e) || 'Unknown error');
  }

  /**
   * Connects to the Live API session.
   *
   * @param {Agent} agent - The agent configuration (name, personality, voice).
   * @param {{ name: string; info: string }} user - The user information.
   * @returns {Promise<void>}
   */
  async connect(agent: Agent, user: { name: string; info: string }) {
    if (this.session) {
      console.warn('Session already active.');
      return;
    }

    const systemInstruction = `
      You are ${agent.name}.
      Your personality is: ${agent.personality}.
      Your voice should be ${agent.voice.pitch} and ${agent.voice.style}.
      
      You are speaking to ${user.name}.
      About them: ${user.info}.
      
      Engage in a natural, real-time conversation.
      Keep your responses concise and conversational.
    `;

    try {
      this.session = await this.ai.live.connect({
        model: MODEL,
        config: {
          systemInstruction,
          responseModalities: [Modality.AUDIO]
        },
        callbacks: {
          onopen: () => {
            this.emit('open');
          },
          onmessage: (message: LiveServerMessage) => {
            try {
              if (!('response' in message) || !message.response) {
                return;
              }

              const response = message.response as GenerateContentResponse;
              const parts = response.candidates?.[0]?.content?.parts;

              if (!parts || !Array.isArray(parts)) {
                return;
              }

              for (const part of parts) {
                if (this.isAudioPart(part)) {
                  this.handleAudioPart(part);
                }
              }
            } catch (error) {
              console.error('Error processing message:', error);
              this.emit('error', error instanceof Error ? error : new Error('Message processing failed'));
            }
          },
          onclose: () => {
            this.emit('close');
            this.session = null;
          },
          onerror: (e: ErrorEvent) => {
            console.error('GenAI Live session error:', e);
            console.error('Error details:', e.error, e.message, e.type);

            const normalizedError = this.normalizeError(e);
            this.emit('error', normalizedError);
            this.session = null;
          },
        }
      });
    } catch (error) {
      this.emit('error', error as Error);
    }
  }

  /**
   * Disconnects from the current session.
   */
  disconnect() {
    this.session?.close();
  }

  /**
   * Sends an initial text message to the model.
   *
   * @param {string} text - The text to send.
   */
  sendInitialText(text: string) {
    if (!this.session) return;
    // Fix: Use the correct Live API method sendClientContent with proper format
    this.session.sendClientContent({
      turns: { role: "user", parts: [{ text }] },
      turnComplete: true
    });
  }

  /**
   * Sends real-time audio input to the model.
   *
   * @param {string} audioBase64 - The Base64 encoded audio data.
   * @param {string} mimeType - The MIME type of the audio data.
   */
  sendRealtimeInput(audioBase64: string, mimeType: string) {
    if (!this.session) {
      console.warn('Cannot send audio - session not connected');
      return;
    }
    try {
      console.log(`📤 Sending ${audioBase64.length} bytes of audio to AI`);
      // Fix: Use sendRealtimeInput method for audio data
      const audioBuffer = base64ToArrayBuffer(audioBase64);
      this.session.sendRealtimeInput(audioBuffer);
      console.log('✓ Audio sent successfully');
    } catch (error) {
      console.error('✗ Failed to send audio:', error);
    }
  }

  /**
   * Checks if the client is currently connected.
   * @returns {boolean} True if connected, false otherwise.
   */
  get isConnected(): boolean {
    return !!this.session;
  }
}
