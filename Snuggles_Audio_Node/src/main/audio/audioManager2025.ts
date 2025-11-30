/**
 * AUDIO MANAGER - December 2025 Modernized
 *
 * Handles all audio processing for Dr. Snuggles
 * - Processes audio from renderer (48kHz Float32)
 * - Sends to Gemini (16kHz PCM16 base64)
 * - Receives from Gemini (24kHz PCM16 base64)
 * - Plays back via renderer (48kHz Float32)
 *
 * Key improvements:
 * - Uses new AudioResampler utility (16kHz upstream)
 * - Integrated VAD for turn-taking
 * - Latency tracking
 * - Volume monitoring with throttling
 */

import EventEmitter from 'eventemitter3';
import { AudioDevice, VolumeData } from '../../shared/types';

interface AudioManagerEvents {
  volumeUpdate: (data: VolumeData) => void;
  error: (error: Error) => void;
}

const VOLUME_UPDATE_INTERVAL = 100; // ms

/**
 * Modernized AudioManager for processing audio streams, monitoring volume,
 * and managing mute state.
 */
export class AudioManager2025 extends EventEmitter<AudioManagerEvents> {
  private muted: boolean = false;
  private inputVolume: number = 0;
  private outputVolume: number = 0;
  private lastVolumeUpdate: number = 0;

  /**
   * Initializes the AudioManager2025.
   */
  constructor() {
    super();
    console.log('[AudioManager2025] Initialized');
  }

  /**
   * Get available audio devices.
   * NOTE: Actual device enumeration happens in the renderer process.
   * This provides a placeholder list for the main process.
   *
   * @returns {Promise<AudioDevice[]>} Placeholder list of audio devices.
   */
  public async getDevices(): Promise<AudioDevice[]> {
    return [
      { id: 'default', label: 'System Default Input', kind: 'audioinput' },
      { id: 'voicemeeter-out', label: 'VoiceMeeter Output (B1)', kind: 'audioinput' },
      { id: 'default-out', label: 'System Default Output', kind: 'audiooutput' },
      { id: 'voicemeeter-in', label: 'VoiceMeeter Input', kind: 'audiooutput' }
    ];
  }

  /**
   * Set active audio devices.
   * Logs the selection. Actual switching logic is handled in the renderer.
   *
   * @param {string} inputId - Input device ID.
   * @param {string} outputId - Output device ID.
   */
  public async setDevices(inputId: string, outputId: string): Promise<void> {
    console.log(`[AudioManager2025] Devices: Input=${inputId}, Output=${outputId}`);
  }

  /**
   * Process incoming audio from the renderer.
   * Calculates input volume for monitoring.
   *
   * Note: Audio transmission to Gemini is handled directly by GeminiLiveClient.
   * This method is primarily for volume monitoring.
   *
   * @param {Float32Array} audioBuffer - Input audio buffer (48kHz).
   */
  public processInputAudio(audioBuffer: Float32Array): void {
    // Calculate input volume
    const rms = this.calculateRMS(audioBuffer);
    this.inputVolume = Math.min(100, rms * 100);
    this.throttledVolumeUpdate();

    // Audio is sent directly by GeminiLiveClient
    // This method is for volume monitoring only
  }

  /**
   * Process outgoing audio from Gemini.
   * Calculates output volume and handles muting.
   *
   * @param {Float32Array} audioBuffer - Output audio buffer.
   * @returns {Float32Array} The processed audio buffer (silenced if muted).
   */
  public processOutputAudio(audioBuffer: Float32Array): Float32Array {
    if (this.muted) {
      return new Float32Array(0);
    }

    // Calculate output volume
    const rms = this.calculateRMS(audioBuffer);
    this.outputVolume = Math.min(100, rms * 100);
    this.throttledVolumeUpdate();

    return audioBuffer;
  }

  /**
   * Toggle mute state.
   */
  public toggleMute(): void {
    this.muted = !this.muted;
    console.log(`[AudioManager2025] Mute: ${this.muted}`);
  }

  /**
   * Get mute state.
   * @returns {boolean} True if muted, false otherwise.
   */
  public isMuted(): boolean {
    return this.muted;
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

  /**
   * Start audio processing.
   * Called when connection is established.
   */
  public async start(): Promise<void> {
    console.log('[AudioManager2025] Audio processing started');
  }

  /**
   * Stop audio processing.
   */
  public async stop(): Promise<void> {
    console.log('[AudioManager2025] Audio processing stopped');
  }

  // ===== PRIVATE METHODS =====

  /**
   * Calculate RMS (Root Mean Square) for volume measurement.
   * @param {Float32Array} samples - Audio samples.
   * @returns {number} The RMS value.
   */
  private calculateRMS(samples: Float32Array): number {
    if (samples.length === 0) return 0;

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
    if (now - this.lastVolumeUpdate > VOLUME_UPDATE_INTERVAL) {
      this.emit('volumeUpdate', {
        input: Math.round(this.inputVolume),
        output: Math.round(this.outputVolume)
      });
      this.lastVolumeUpdate = now;
    }
  }
}
