/**
 * OPTIMIZED AUDIO RESAMPLER - December 2025
 *
 * Blazingly fast linear interpolation resampler for Gemini Live API
 *
 * Upstream: 48kHz (system) → 16kHz (Gemini requirement)
 * Downstream: 24kHz (Gemini output) → 48kHz (system playback)
 *
 * Format compliance:
 * - Upstream: Float32Array → Int16Array → base64 PCM16
 * - Downstream: base64 PCM16 → Int16Array → Float32Array
 */

export class AudioResampler {
  private ratio: number;

  /**
   * Create resampler with source and target rates
   * @param sourceRate - Input sample rate (Hz)
   * @param targetRate - Output sample rate (Hz)
   */
  constructor(
    private sourceRate: number,
    private targetRate: number
  ) {
    this.ratio = targetRate / sourceRate;
    console.log(`[Resampler] ${sourceRate}Hz → ${targetRate}Hz (ratio: ${this.ratio.toFixed(4)})`);
  }

  /**
   * Resample audio using linear interpolation
   * Ultra-fast, minimal CPU overhead
   */
  public resample(input: Float32Array): Float32Array {
    if (this.sourceRate === this.targetRate) {
      return input; // No-op if rates match
    }

    const outputLength = Math.floor(input.length * this.ratio);
    const output = new Float32Array(outputLength);

    for (let i = 0; i < outputLength; i++) {
      const srcIndex = i / this.ratio;
      const floor = Math.floor(srcIndex);
      const ceil = Math.min(floor + 1, input.length - 1);
      const fraction = srcIndex - floor;

      // Linear interpolation
      output[i] = input[floor] * (1 - fraction) + input[ceil] * fraction;
    }

    return output;
  }

  /**
   * Convert Float32 PCM to Int16 PCM
   * Required format for Gemini API
   */
  public static float32ToInt16(float32: Float32Array): Int16Array {
    const int16 = new Int16Array(float32.length);

    for (let i = 0; i < float32.length; i++) {
      const clamped = Math.max(-1, Math.min(1, float32[i]));
      int16[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF;
    }

    return int16;
  }

  /**
   * Convert Int16 PCM to Float32 PCM
   * For audio playback
   */
  public static int16ToFloat32(int16: Int16Array): Float32Array {
    const float32 = new Float32Array(int16.length);

    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / (int16[i] < 0 ? 0x8000 : 0x7FFF);
    }

    return float32;
  }

  /**
   * UPSTREAM PIPELINE: System audio → Gemini
   * 48kHz Float32 → 16kHz Int16 → base64
   */
  public static prepareForGemini(systemAudio: Float32Array, resampler: AudioResampler): string {
    // 1. Resample: 48kHz → 16kHz
    const resampled = resampler.resample(systemAudio);

    // 2. Convert: Float32 → Int16
    const int16 = AudioResampler.float32ToInt16(resampled);

    // 3. Encode: Int16 → base64
    const buffer = Buffer.from(int16.buffer);
    return buffer.toString('base64');
  }

  /**
   * DOWNSTREAM PIPELINE: Gemini → System audio
   * base64 → 24kHz Int16 → Float32 → 48kHz Float32
   */
  public static prepareForPlayback(base64PCM: string, resampler: AudioResampler): Float32Array {
    // 1. Decode: base64 → Buffer
    const buffer = Buffer.from(base64PCM, 'base64');

    // 2. Convert: Buffer → Int16Array
    const int16 = new Int16Array(buffer.buffer, buffer.byteOffset, buffer.length / 2);

    // 3. Convert: Int16 → Float32
    const float32 = AudioResampler.int16ToFloat32(int16);

    // 4. Resample: 24kHz → 48kHz
    const upsampled = resampler.resample(float32);

    return upsampled;
  }

  public getSourceRate(): number {
    return this.sourceRate;
  }

  public getTargetRate(): number {
    return this.targetRate;
  }

  public getRatio(): number {
    return this.ratio;
  }
}

/**
 * Pre-configured resampler instances
 */
export class AudioResamplers {
  // Upstream: System (48kHz) → Gemini (16kHz)
  public static readonly UPSTREAM = new AudioResampler(48000, 16000);

  // Downstream: Gemini (24kHz) → System (48kHz)
  public static readonly DOWNSTREAM = new AudioResampler(24000, 48000);
}
