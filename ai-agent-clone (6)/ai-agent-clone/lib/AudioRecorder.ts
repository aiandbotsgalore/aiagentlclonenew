import { EventEmitter } from 'eventemitter3';

const WORKLET_PROCESSOR_NAME = 'audio-recording-processor';
const TARGET_SAMPLE_RATE = 16000;

// Helper function to convert ArrayBuffer to base64 efficiently (prevents stack overflow)
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

const workletCode = `
function floatTo16BitPCM(input) {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return output;
}

function downsampleBuffer(buffer, inputSampleRate, outputSampleRate) {
  if (inputSampleRate === outputSampleRate) {
    return buffer;
  }
  const sampleRateRatio = inputSampleRate / outputSampleRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    let accum = 0, count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = accum / count;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

class AudioRecordingProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 2048;
    this._buffer = new Float32Array(this.bufferSize);
    this._pos = 0;
  }

  process(inputs) {
    const input = inputs[0][0];
    if (input) {
      const downsampled = downsampleBuffer(input, sampleRate, ${TARGET_SAMPLE_RATE});
      const pcm = floatTo16BitPCM(downsampled);
      this.port.postMessage(pcm.buffer, [pcm.buffer]);
    }
    return true;
  }
}

registerProcessor('${WORKLET_PROCESSOR_NAME}', AudioRecordingProcessor);
`;

// Fix: Added event types for EventEmitter to resolve 'emit' and 'on' not being found.
type AudioRecorderEvents = {
  data: (base64: string) => void;
  error: (error: Error) => void;
};

export class AudioRecorder extends EventEmitter<AudioRecorderEvents> {
  private stream: MediaStream | null = null;
  private context: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;

  async start() {
    if (this.stream) return;
    try {
      console.log('Requesting microphone access...');
      
      // Add a timeout for mic request (30 seconds max)
      const micPromise = navigator.mediaDevices.getUserMedia({ audio: true });
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Microphone request timed out - check browser permissions')), 30000)
      );
      
      try {
        this.stream = await Promise.race([micPromise, timeoutPromise]);
        console.log('✓ Microphone access granted', this.stream?.getTracks().length, 'tracks');
      } catch (micError) {
        console.error('✗ Microphone access denied or unavailable:', micError instanceof Error ? micError.message : String(micError));
        throw micError;
      }
      
      this.context = new AudioContext();
      
      const blob = new Blob([workletCode], { type: 'application/javascript' });
      const workletURL = URL.createObjectURL(blob);
      try {
        await this.context.audioWorklet.addModule(workletURL);
        console.log('Audio worklet module loaded');
      } finally {
        // Revoke immediately after loading to prevent memory leak
        URL.revokeObjectURL(workletURL);
      }

      this.workletNode = new AudioWorkletNode(this.context, WORKLET_PROCESSOR_NAME);
      let audioDataCount = 0;
      this.workletNode.port.onmessage = (event) => {
        const pcm16Buffer = event.data;
        const base64 = arrayBufferToBase64(pcm16Buffer);
        audioDataCount++;
        if (audioDataCount % 10 === 0) {
          console.log('Audio data captured:', audioDataCount, 'chunks');
        }
        this.emit('data', base64);
      };

      const source = this.context.createMediaStreamSource(this.stream);
      source.connect(this.workletNode).connect(this.context.destination);
      console.log('Audio recording started');

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error starting audio recorder:', errorMsg);
      this.emit('error', new Error(`Microphone error: ${errorMsg}`));
    }
  }

  async stop() {
    // Stop media stream tracks first
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (error) {
          console.error('Error stopping media track:', error);
        }
      });
      this.stream = null;
    }

    // Disconnect worklet before closing context
    if (this.workletNode) {
      try {
        this.workletNode.port.onmessage = null; // Remove handler
        this.workletNode.disconnect();
        this.workletNode = null;
      } catch (error) {
        console.error('Error cleaning up worklet:', error);
      }
    }

    // Close audio context last
    if (this.context) {
      try {
        if (this.context.state !== 'closed') {
          await this.context.close();
        }
      } catch (error) {
        console.error('Error closing AudioContext:', error);
      } finally {
        this.context = null;
      }
    }
  }
}
