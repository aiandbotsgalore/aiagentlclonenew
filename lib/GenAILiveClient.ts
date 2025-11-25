import { GoogleGenAI, LiveServerMessage, GenerateContentResponse, Modality } from '@google/genai';
import { EventEmitter } from 'eventemitter3';
import { Agent } from '../types';

const MODEL = 'models/gemini-2.0-flash-live-001';

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Fix: Added event types for EventEmitter to resolve type errors
type LiveClientEvents = {
  open: () => void;
  close: () => void;
  error: (error: Error) => void;
  audio: (buffer: ArrayBuffer) => void;
};

export class GenAILiveClient extends EventEmitter<LiveClientEvents> {
  private ai: GoogleGenAI;
  // Note: Using 'any' because 'LiveSession' type is not exported by @google/genai
  private session: any | null = null;

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

  private isAudioPart(part: any): boolean {
    return part?.inlineData?.mimeType?.startsWith('audio/') && part.inlineData.data;
  }

  private handleAudioPart(part: any): void {
    console.log('Got audio response, size:', part.inlineData.data.length);
    const audioBuffer = base64ToArrayBuffer(part.inlineData.data);
    this.emit('audio', audioBuffer);
  }

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

  // Fix: Refactored connect method to use the 'callbacks' parameter as required by the new API.
  // This resolves the missing 'callbacks' property error and fixes the context for 'emit' calls.
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

  disconnect() {
    this.session?.close();
  }

  sendInitialText(text: string) {
    if (!this.session) return;
    // Fix: Use the correct Live API method sendClientContent with proper format
    this.session.sendClientContent({
      turns: { role: "user", parts: [{ text }] },
      turnComplete: true
    });
  }

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

  get isConnected(): boolean {
    return !!this.session;
  }
}
