/**
 * CRITICAL COMPONENT: Sample Rate Converter
 *
 * Converts audio between system sample rate (typically 44.1kHz or 48kHz)
 * and Gemini API sample rate (24kHz for Live API, 16kHz for standard)
 *
 * Without proper resampling, audio will have pitch/speed issues!
 */

/**
 * Handles resampling of audio data between different sample rates and bit depths.
 */
export class AudioResampler {
  private sourceRate: number;
  private targetRate: number;
  private ratio: number;
  private lastSample: number = 0;

  /**
   * Initializes the AudioResampler.
   *
   * @param {number} sourceRate - The input sample rate (e.g., 48000).
   * @param {number} targetRate - The output sample rate (e.g., 24000).
   */
  constructor(sourceRate: number, targetRate: number) {
    this.sourceRate = sourceRate;
    this.targetRate = targetRate;
    this.ratio = targetRate / sourceRate;

    console.log(`[Resampler] Initialized: ${sourceRate}Hz → ${targetRate}Hz (ratio: ${this.ratio.toFixed(4)})`);
  }

  /**
   * Downsample: Convert high sample rate to lower (e.g., 48kHz → 24kHz)
   * Used for microphone input before sending to Gemini.
   *
   * @param {Float32Array} inputBuffer - The input audio buffer.
   * @returns {Float32Array} The downsampled audio buffer.
   */
  public downsample(inputBuffer: Float32Array): Float32Array {
    if (this.sourceRate === this.targetRate) {
      return inputBuffer; // No conversion needed
    }

    const outputLength = Math.floor(inputBuffer.length * this.ratio);
    const output = new Float32Array(outputLength);

    for (let i = 0; i < outputLength; i++) {
      const srcIndex = i / this.ratio;
      const srcIndexFloor = Math.floor(srcIndex);
      const srcIndexCeil = Math.min(srcIndexFloor + 1, inputBuffer.length - 1);
      const fraction = srcIndex - srcIndexFloor;

      // Linear interpolation between samples
      output[i] = inputBuffer[srcIndexFloor] * (1 - fraction) +
                  inputBuffer[srcIndexCeil] * fraction;
    }

    return output;
  }

  /**
   * Upsample: Convert low sample rate to higher (e.g., 24kHz → 48kHz)
   * Used for Gemini output before playing through VoiceMeeter.
   * Maintains state (lastSample) for continuity between buffers.
   *
   * @param {Float32Array} inputBuffer - The input audio buffer.
   * @returns {Float32Array} The upsampled audio buffer.
   */
  public upsample(inputBuffer: Float32Array): Float32Array {
    if (this.sourceRate === this.targetRate) {
      return inputBuffer; // No conversion needed
    }

    const outputLength = Math.floor(inputBuffer.length * this.ratio);
    const output = new Float32Array(outputLength);

    for (let i = 0; i < outputLength; i++) {
      const srcIndex = i / this.ratio;
      const srcIndexFloor = Math.floor(srcIndex);
      const srcIndexCeil = Math.min(srcIndexFloor + 1, inputBuffer.length - 1);
      const fraction = srcIndex - srcIndexFloor;

      // Linear interpolation with continuity from last sample
      const sample1 = srcIndexFloor === 0 ? this.lastSample : inputBuffer[srcIndexFloor];
      const sample2 = inputBuffer[srcIndexCeil];

      output[i] = sample1 * (1 - fraction) + sample2 * fraction;
    }

    // Store last sample for next buffer's continuity
    if (inputBuffer.length > 0) {
      this.lastSample = inputBuffer[inputBuffer.length - 1];
    }

    return output;
  }

  /**
   * Convert Float32 PCM to Int16 PCM (required by Gemini API).
   * Clamps values to [-1, 1] range.
   *
   * @param {Float32Array} float32Array - The float audio data.
   * @returns {Int16Array} The 16-bit integer audio data.
   */
  public float32ToInt16(float32Array: Float32Array): Int16Array {
    const int16Array = new Int16Array(float32Array.length);

    for (let i = 0; i < float32Array.length; i++) {
      // Clamp to [-1, 1] and convert to 16-bit integer
      const clamped = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF;
    }

    return int16Array;
  }

  /**
   * Convert Int16 PCM to Float32 PCM (for audio playback).
   *
   * @param {Int16Array} int16Array - The 16-bit integer audio data.
   * @returns {Float32Array} The float audio data.
   */
  public int16ToFloat32(int16Array: Int16Array): Float32Array {
    const float32Array = new Float32Array(int16Array.length);

    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / (int16Array[i] < 0 ? 0x8000 : 0x7FFF);
    }

    return float32Array;
  }

  /**
   * Complete pipeline: System Audio → Gemini-ready PCM16.
   * Downsamples and converts to Int16 Buffer.
   *
   * @param {Float32Array} systemAudio - Input audio (e.g., 48kHz).
   * @returns {Buffer} Gemini-compatible audio buffer (e.g., 24kHz Int16).
   */
  public prepareForGemini(systemAudio: Float32Array): Buffer {
    const downsampled = this.downsample(systemAudio);
    const int16 = this.float32ToInt16(downsampled);
    return Buffer.from(int16.buffer);
  }

  /**
   * Complete pipeline: Gemini PCM16 → System-ready Audio.
   * Converts from Buffer/Int16 to Float32 and upsamples.
   *
   * @param {Buffer} geminiPCM - Input audio from Gemini (e.g., 24kHz Int16).
   * @returns {Float32Array} System-compatible audio buffer (e.g., 48kHz Float32).
   */
  public prepareForPlayback(geminiPCM: Buffer): Float32Array {
    const int16 = new Int16Array(geminiPCM.buffer, geminiPCM.byteOffset, geminiPCM.length / 2);
    const float32 = this.int16ToFloat32(int16);
    const upsampled = this.upsample(float32);
    return upsampled;
  }

  /**
   * Get the source sample rate.
   * @returns {number} Source rate in Hz.
   */
  public getSourceRate(): number {
    return this.sourceRate;
  }

  /**
   * Get the target sample rate.
   * @returns {number} Target rate in Hz.
   */
  public getTargetRate(): number {
    return this.targetRate;
  }

  /**
   * Get the resampling ratio.
   * @returns {number} Ratio of target rate to source rate.
   */
  public getRatio(): number {
    return this.ratio;
  }
}
