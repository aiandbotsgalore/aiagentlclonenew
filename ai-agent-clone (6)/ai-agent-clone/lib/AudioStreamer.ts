import { EventEmitter } from 'eventemitter3';

const WORKLET_PROCESSOR_NAME = 'volume-meter-processor';

const workletCode = `
class VolumeMeterProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.sum = 0;
    this.sumOfSquares = 0;
    this.sampleCount = 0;
    this.updateInterval = 50; // ms
    this.lastUpdateTime = currentTime;
  }

  process(inputs) {
    const input = inputs[0][0];
    if (input) {
      for (let i = 0; i < input.length; i++) {
        const sample = input[i];
        this.sum += sample;
        this.sumOfSquares += sample * sample;
      }
      this.sampleCount += input.length;
    }

    if (currentTime - this.lastUpdateTime > this.updateInterval / 1000) {
      const rms = Math.sqrt(this.sumOfSquares / this.sampleCount);
      this.port.postMessage({ rms });
      this.sum = 0;
      this.sumOfSquares = 0;
      this.sampleCount = 0;
      this.lastUpdateTime = currentTime;
    }

    return true;
  }
}

registerProcessor('${WORKLET_PROCESSOR_NAME}', VolumeMeterProcessor);
`;

// Fix: Added event types for EventEmitter to resolve 'emit' and 'on' not being found.
type AudioStreamerEvents = {
  volume: (rms: number) => void;
};

export class AudioStreamer extends EventEmitter<AudioStreamerEvents> {
  private context: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private gainNode: GainNode | null = null;
  private startTime = 0;
  private audioQueue: ArrayBuffer[] = [];
  private isPlaying = false;

  async init() {
    if (this.context) return;
    this.context = new AudioContext({ sampleRate: 16000 });

    const blob = new Blob([workletCode], { type: 'application/javascript' });
    const workletURL = URL.createObjectURL(blob);
    try {
      await this.context.audioWorklet.addModule(workletURL);
    } finally {
      // Revoke immediately after loading to prevent memory leak
      URL.revokeObjectURL(workletURL);
    }

    this.workletNode = new AudioWorkletNode(this.context, WORKLET_PROCESSOR_NAME);
    this.workletNode.port.onmessage = (event) => {
      this.emit('volume', event.data.rms);
    };

    this.gainNode = this.context.createGain();
    this.gainNode.connect(this.workletNode).connect(this.context.destination);

    this.startTime = this.context.currentTime;
  }

  receiveAudio(audioBuffer: ArrayBuffer) {
    this.audioQueue.push(audioBuffer);
    if (!this.isPlaying) {
      this.playQueue();
    }
  }

  private async playQueue() {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      this.emit('volume', 0); // Reset volume when done
      return;
    }
    
    this.isPlaying = true;
    const nextAudio = this.audioQueue.shift();
    if (!nextAudio || !this.context || !this.gainNode) return;
    
    try {
      console.log('Playing audio chunk, size:', nextAudio.byteLength);
      
      // Convert PCM 16-bit data to AudioBuffer
      // The audio data is raw PCM at 16kHz sample rate
      const audioData = new Int16Array(nextAudio);
      const samples = audioData.length;
      const audioBuffer = this.context.createBuffer(
        1,
        samples,
        16000
      );
      
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < samples; i++) {
        channelData[i] = audioData[i] / 32768; // Convert Int16 to float [-1, 1]
      }
      
      const source = this.context.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.gainNode);

      const scheduleTime = Math.max(this.startTime, this.context.currentTime);
      source.start(scheduleTime);

      this.startTime = scheduleTime + audioBuffer.duration;

      source.onended = () => {
        try {
          this.playQueue();
        } catch (error) {
          console.error('Error in playQueue after audio ended:', error);
          this.isPlaying = false;
          this.emit('volume', 0);
        }
      };

      // Critical: Add error handler to prevent queue stall on playback failure
      source.addEventListener('error', (error) => {
        console.error('Audio playback error:', error);
        this.isPlaying = false;
        // Continue with next chunk to prevent permanent stall
        this.playQueue();
      });

    } catch (e) {
        console.error("Error processing audio data", e);
        this.playQueue(); // Try next chunk
    }
  }

  async stop() {
    this.audioQueue = [];
    this.isPlaying = false;

    if (this.context) {
      try {
        // Can only close contexts in 'running' or 'suspended' state
        if (this.context.state !== 'closed') {
          await this.context.close();
        }
      } catch (error) {
        console.error('Error closing AudioContext:', error);
        // Continue cleanup even if close fails
      } finally {
        this.context = null;
      }
    }

    this.workletNode = null;
    this.gainNode = null;
  }
}
