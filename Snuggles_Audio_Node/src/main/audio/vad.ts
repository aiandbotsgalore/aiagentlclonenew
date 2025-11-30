/**
 * VOICE ACTIVITY DETECTION (VAD) - December 2025
 *
 * Detects when user is speaking to optimize audio transmission
 *
 * Strategy:
 * 1. Only send audio when user is speaking (saves bandwidth & cost)
 * 2. Immediately stop sending when Gemini starts responding (true turn-taking)
 * 3. Use RMS + zero-crossing rate for robust detection
 */

/**
 * Configuration for Voice Activity Detection.
 */
export interface VADConfig {
  /** RMS threshold for voice detection (0-1, default: 0.01) */
  rmsThreshold: number;

  /** Zero-crossing rate threshold (Hz, default: 50) */
  zcrThreshold: number;

  /** Minimum consecutive frames to trigger speech (default: 3) */
  minSpeechFrames: number;

  /** Minimum consecutive frames to trigger silence (default: 10) */
  minSilenceFrames: number;

  /** Sample rate (Hz) */
  sampleRate: number;
}

/**
 * Voice Activity Detector (VAD).
 *
 * Analyzes audio frames to detect speech based on Root Mean Square (RMS) energy
 * and Zero-Crossing Rate (ZCR). It manages the state of user speech and
 * respects turn-taking by suppressing user audio when Gemini is speaking.
 */
export class VoiceActivityDetector {
  private config: VADConfig;
  private speechFrameCount: number = 0;
  private silenceFrameCount: number = 0;
  private isSpeaking: boolean = false;
  private isGeminiSpeaking: boolean = false;

  /**
   * Initializes the VoiceActivityDetector.
   *
   * @param {Partial<VADConfig>} [config] - Optional configuration overrides.
   */
  constructor(config?: Partial<VADConfig>) {
    this.config = {
      rmsThreshold: config?.rmsThreshold ?? 0.01,
      zcrThreshold: config?.zcrThreshold ?? 50,
      minSpeechFrames: config?.minSpeechFrames ?? 3,
      minSilenceFrames: config?.minSilenceFrames ?? 10,
      sampleRate: config?.sampleRate ?? 48000
    };

    console.log('[VAD] Initialized with config:', this.config);
  }

  /**
   * Process audio frame and determine if speech is present.
   *
   * Analyzes the frame's RMS and ZCR. Updates the internal state machine
   * to decide if the user is speaking or silent.
   *
   * @param {Float32Array} audioData - Float32Array audio samples.
   * @returns {boolean} true if user is speaking and should send audio.
   */
  public process(audioData: Float32Array): boolean {
    // Never send audio if Gemini is speaking (true turn-taking)
    if (this.isGeminiSpeaking) {
      this.reset();
      return false;
    }

    // Calculate voice activity features
    const rms = this.calculateRMS(audioData);
    const zcr = this.calculateZCR(audioData);

    // Determine if current frame contains speech
    const hasVoiceActivity =
      rms > this.config.rmsThreshold &&
      zcr > this.config.zcrThreshold;

    if (hasVoiceActivity) {
      this.speechFrameCount++;
      this.silenceFrameCount = 0;

      // Trigger speech after minimum consecutive frames
      if (this.speechFrameCount >= this.config.minSpeechFrames) {
        if (!this.isSpeaking) {
          console.log(`[VAD] 🎤 Speech detected (RMS: ${rms.toFixed(4)}, ZCR: ${zcr.toFixed(0)})`);
        }
        this.isSpeaking = true;
      }
    } else {
      this.silenceFrameCount++;
      this.speechFrameCount = 0;

      // Trigger silence after minimum consecutive frames
      if (this.silenceFrameCount >= this.config.minSilenceFrames) {
        if (this.isSpeaking) {
          console.log('[VAD] 🔇 Silence detected');
        }
        this.isSpeaking = false;
      }
    }

    return this.isSpeaking;
  }

  /**
   * Signal that Gemini has started speaking.
   * This immediately stops user audio transmission (turn-taking).
   *
   * @param {boolean} speaking - True if Gemini is speaking.
   */
  public setGeminiSpeaking(speaking: boolean): void {
    if (speaking !== this.isGeminiSpeaking) {
      console.log(`[VAD] 🤖 Gemini ${speaking ? 'started' : 'stopped'} speaking`);
      this.isGeminiSpeaking = speaking;

      if (speaking) {
        this.reset();
      }
    }
  }

  /**
   * Check if user is currently speaking.
   * @returns {boolean} True if user is speaking and Gemini is not.
   */
  public isSpeechActive(): boolean {
    return this.isSpeaking && !this.isGeminiSpeaking;
  }

  /**
   * Reset VAD state.
   * Clears counters and resets speaking state.
   */
  public reset(): void {
    this.speechFrameCount = 0;
    this.silenceFrameCount = 0;
    this.isSpeaking = false;
  }

  /**
   * Calculate Root Mean Square (RMS) energy.
   * Represents the loudness of the audio signal.
   *
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
   * Calculate Zero-Crossing Rate (ZCR).
   * Higher ZCR indicates voice frequency content.
   *
   * @param {Float32Array} samples - Audio samples.
   * @returns {number} The ZCR in Hz.
   */
  private calculateZCR(samples: Float32Array): number {
    let crossings = 0;

    for (let i = 1; i < samples.length; i++) {
      if ((samples[i] >= 0 && samples[i - 1] < 0) ||
          (samples[i] < 0 && samples[i - 1] >= 0)) {
        crossings++;
      }
    }

    // Convert to Hz
    const duration = samples.length / this.config.sampleRate;
    return crossings / duration;
  }

  /**
   * Update configuration at runtime.
   * @param {Partial<VADConfig>} config - New configuration values.
   */
  public updateConfig(config: Partial<VADConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[VAD] Config updated:', this.config);
  }

  /**
   * Get current configuration.
   * @returns {VADConfig} The current configuration.
   */
  public getConfig(): VADConfig {
    return { ...this.config };
  }

  /**
   * Get current state for debugging.
   * @returns {object} Current VAD state (speaking flags and counters).
   */
  public getState(): {
    isSpeaking: boolean;
    isGeminiSpeaking: boolean;
    speechFrameCount: number;
    silenceFrameCount: number;
  } {
    return {
      isSpeaking: this.isSpeaking,
      isGeminiSpeaking: this.isGeminiSpeaking,
      speechFrameCount: this.speechFrameCount,
      silenceFrameCount: this.silenceFrameCount
    };
  }
}
