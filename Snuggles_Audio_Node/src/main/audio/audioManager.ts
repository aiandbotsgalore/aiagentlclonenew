import EventEmitter from 'eventemitter3';
import { AudioResampler } from './resampler';
import { AudioDevice, VolumeData } from '../../shared/types';

interface AudioManagerEvents {
  volumeUpdate: (data: VolumeData) => void;
  audioData: (buffer: Buffer) => void;
  error: (error: Error) => void;
}

const SYSTEM_SAMPLE_RATE = 48000; // VoiceMeeter typical rate
const GEMINI_SAMPLE_RATE = 24000;  // Gemini Live API rate

/**
 * AudioManager handles audio processing for Dr. Snuggles (Main Process)
 *
 * NOTE: In Electron, actual audio capture must happen in renderer process.
 * This manager handles device configuration and audio resampling only.
 *
 * Flow:
 * 1. Renderer captures mic input (48kHz) → IPC to Main
 * 2. Main downsamples to 24kHz → Send to Gemini
 * 3. Gemini responds (24kHz) → Main upsamples to 48kHz
 * 4. IPC back to Renderer → Play through VoiceMeeter
 */
export class AudioManager extends EventEmitter<AudioManagerEvents> {
  private inputResampler: AudioResampler;
  private outputResampler: AudioResampler;
  private muted: boolean = false;
  private _currentInputDevice: string | null = null;
  private _currentOutputDevice: string | null = null;

  // Volume monitoring
  private inputVolume: number = 0;
  private outputVolume: number = 0;
  private lastVolumeUpdate: number = 0;
  private readonly VOLUME_UPDATE_INTERVAL = 100; // ms

  constructor() {
    super();

    // Initialize resamplers
    this.inputResampler = new AudioResampler(SYSTEM_SAMPLE_RATE, GEMINI_SAMPLE_RATE);
    this.outputResampler = new AudioResampler(GEMINI_SAMPLE_RATE, SYSTEM_SAMPLE_RATE);

    console.log('[AudioManager] Initialized with resamplers');
  }

  /**
   * Get available audio devices
   * NOTE: Must be called from renderer via IPC (browser context)
   */
  public async getDevices(): Promise<AudioDevice[]> {
    // Placeholder - renderer will provide actual device list
    return [
      { id: 'default', label: 'System Default Input', kind: 'audioinput' },
      { id: 'voicemeeter-out', label: 'VoiceMeeter Output (B1)', kind: 'audioinput' },
      { id: 'default-out', label: 'System Default Output', kind: 'audiooutput' },
      { id: 'voicemeeter-in', label: 'VoiceMeeter Input', kind: 'audiooutput' }
    ];
  }

  /**
   * Set active audio devices
   */
  public async setDevices(inputId: string, outputId: string): Promise<void> {
    this._currentInputDevice = inputId;
    this._currentOutputDevice = outputId;
    console.log(`[AudioManager] Devices set: Input=${inputId}, Output=${outputId}`);
  }

  /**
   * Start audio processing (called when connection established)
   */
  public async start(): Promise<void> {
    console.log('[AudioManager] Audio processing started');
  }

  /**
   * Stop audio processing
   */
  public async stop(): Promise<void> {
    console.log('[AudioManager] Audio processing stopped');
  }

  /**
   * Process incoming audio from renderer (before sending to Gemini)
   */
  public processInput(audioBuffer: Float32Array): Buffer {
    // Calculate input volume
    this.updateInputVolume(audioBuffer);

    // Downsample and convert for Gemini
    return this.inputResampler.prepareForGemini(audioBuffer);
  }

  /**
   * Process outgoing audio from Gemini (before sending to renderer)
   */
  public processOutput(geminiPCM: Buffer): Float32Array {
    if (this.muted) {
      return new Float32Array(0);
    }

    // Upsample and convert for playback
    const float32Data = this.outputResampler.prepareForPlayback(geminiPCM);

    // Calculate output volume
    this.updateOutputVolume(float32Data);

    return float32Data;
  }

  /**
   * Toggle mute state
   */
  public toggleMute(): void {
    this.muted = !this.muted;
    console.log(`[AudioManager] Mute: ${this.muted}`);
  }

  /**
   * Get current mute state
   */
  public isMuted(): boolean {
    return this.muted;
  }

  /**
   * Update input volume meter
   */
  private updateInputVolume(samples: Float32Array): void {
    const rms = this.calculateRMS(samples);
    this.inputVolume = Math.min(100, rms * 100);
    this.throttledVolumeUpdate();
  }

  /**
   * Update output volume meter
   */
  private updateOutputVolume(samples: Float32Array): void {
    const rms = this.calculateRMS(samples);
    this.outputVolume = Math.min(100, rms * 100);
    this.throttledVolumeUpdate();
  }

  /**
   * Calculate RMS (Root Mean Square) for volume measurement
   */
  private calculateRMS(samples: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    return Math.sqrt(sum / samples.length);
  }

  /**
   * Throttle volume updates to prevent UI spam
   */
  private throttledVolumeUpdate(): void {
    const now = Date.now();
    if (now - this.lastVolumeUpdate > this.VOLUME_UPDATE_INTERVAL) {
      this.emit('volumeUpdate', {
        input: Math.round(this.inputVolume),
        output: Math.round(this.outputVolume)
      });
      this.lastVolumeUpdate = now;
    }
  }

  /**
   * Get current volume levels
   */
  public getVolume(): VolumeData {
    return {
      input: Math.round(this.inputVolume),
      output: Math.round(this.outputVolume)
    };
  }
}
