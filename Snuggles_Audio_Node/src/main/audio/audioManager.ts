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
 * AudioManager handles audio processing for Dr. Snuggles (Main Process).
 *
 * NOTE: In Electron, actual audio capture must happen in the renderer process.
 * This manager handles device configuration, audio resampling, and volume monitoring
 * primarily for the legacy audio flow.
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

  // Volume monitoring
  private inputVolume: number = 0;
  private outputVolume: number = 0;
  private lastVolumeUpdate: number = 0;
  private readonly VOLUME_UPDATE_INTERVAL = 100; // ms

  /**
   * Initializes the AudioManager.
   * Sets up resamplers for converting between system (48kHz) and Gemini (24kHz) sample rates.
   */
  constructor() {
    super();

    // Initialize resamplers
    this.inputResampler = new AudioResampler(SYSTEM_SAMPLE_RATE, GEMINI_SAMPLE_RATE);
    this.outputResampler = new AudioResampler(GEMINI_SAMPLE_RATE, SYSTEM_SAMPLE_RATE);

    console.log('[AudioManager] Initialized with resamplers');
  }

  /**
   * Get available audio devices.
   * NOTE: In the main process, this returns a placeholder list.
   * The actual device list must be retrieved in the renderer process via IPC.
   *
   * @returns {Promise<AudioDevice[]>} Placeholder list of audio devices.
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
   * Set active audio devices.
   * Currently just logs the selection as device handling is done in renderer.
   *
   * @param {string} inputId - Input device ID.
   * @param {string} outputId - Output device ID.
   */
  public async setDevices(inputId: string, outputId: string): Promise<void> {
    console.log(`[AudioManager] Devices set: Input=${inputId}, Output=${outputId}`);
  }

  /**
   * Start audio processing.
   * Called when connection is established.
   */
  public async start(): Promise<void> {
    console.log('[AudioManager] Audio processing started');
  }

  /**
   * Stop audio processing.
   */
  public async stop(): Promise<void> {
    console.log('[AudioManager] Audio processing stopped');
  }

  /**
   * Process incoming audio from renderer (before sending to Gemini).
   * Calculates volume and downsamples the audio.
   *
   * @param {Float32Array} audioBuffer - Input audio buffer (48kHz).
   * @returns {Buffer} Processed audio buffer for Gemini.
   */
  public processInput(audioBuffer: Float32Array): Buffer {
    // Calculate input volume
    this.updateInputVolume(audioBuffer);

    // Downsample and convert for Gemini
    return this.inputResampler.prepareForGemini(audioBuffer);
  }

  /**
   * Process outgoing audio from Gemini (before sending to renderer).
   * Upsamples the audio and calculates volume.
   *
   * @param {Buffer} geminiPCM - Output audio buffer from Gemini.
   * @returns {Float32Array} Processed audio buffer for playback (48kHz).
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
   * Toggle mute state.
   */
  public toggleMute(): void {
    this.muted = !this.muted;
    console.log(`[AudioManager] Mute: ${this.muted}`);
  }

  /**
   * Get current mute state.
   * @returns {boolean} True if muted, false otherwise.
   */
  public isMuted(): boolean {
    return this.muted;
  }

  /**
   * Update input volume meter.
   * @param {Float32Array} samples - Audio samples.
   */
  private updateInputVolume(samples: Float32Array): void {
    const rms = this.calculateRMS(samples);
    this.inputVolume = Math.min(100, rms * 100);
    this.throttledVolumeUpdate();
  }

  /**
   * Update output volume meter.
   * @param {Float32Array} samples - Audio samples.
   */
  private updateOutputVolume(samples: Float32Array): void {
    const rms = this.calculateRMS(samples);
    this.outputVolume = Math.min(100, rms * 100);
    this.throttledVolumeUpdate();
  }

  /**
   * Calculate RMS (Root Mean Square) for volume measurement.
   * @param {Float32Array} samples - Audio samples.
   * @returns {number} The RMS value.
   */
  private calculateRMS(samples: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    return Math.sqrt(sum / samples.length);
  }

  /**
   * Throttle volume updates to prevent UI spam.
   * Emits 'volumeUpdate' event at most every VOLUME_UPDATE_INTERVAL ms.
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
   * Get current volume levels.
   * @returns {VolumeData} Object containing input and output volume levels.
   */
  public getVolume(): VolumeData {
    return {
      input: Math.round(this.inputVolume),
      output: Math.round(this.outputVolume)
    };
  }
}
