/**
 * AUDIO PLAYBACK SERVICE - Renderer
 *
 * Receives audio chunks from the main process (via IPC) and plays them back
 * using the Web Audio API. It buffers chunks to ensure smooth playback.
 */

export class AudioPlaybackService {
  private audioContext: AudioContext | null = null;
  private nextStartTime: number = 0;
  private isActive: boolean = false;
  private sampleRate: number = 48000;

  constructor() {
    console.log('[AudioPlaybackService] Initialized');
  }

  /**
   * Initializes the audio context for playback.
   */
  public start(): void {
    if (this.isActive) return;

    try {
      this.audioContext = new AudioContext({ sampleRate: this.sampleRate });
      this.nextStartTime = this.audioContext.currentTime;
      this.isActive = true;

      // Listen for incoming audio
      window.snugglesAPI.onGenaiAudioReceived((audioData: Float32Array) => {
        this.queueAudio(audioData);
      });

      console.log('[AudioPlaybackService] Audio playback ready');
    } catch (error) {
      console.error('[AudioPlaybackService] Failed to start playback:', error);
    }
  }

  /**
   * Queues an audio chunk for playback.
   *
   * @param {Float32Array} audioData - The audio samples to play.
   */
  private queueAudio(audioData: Float32Array): void {
    if (!this.isActive || !this.audioContext) return;

    const buffer = this.audioContext.createBuffer(1, audioData.length, this.sampleRate);
    buffer.getChannelData(0).set(audioData);

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);

    // Schedule playback
    // If nextStartTime is in the past, reset it to now to avoid massive catch-up speedups
    if (this.nextStartTime < this.audioContext.currentTime) {
      this.nextStartTime = this.audioContext.currentTime;
    }

    source.start(this.nextStartTime);

    // Advance time for the next chunk
    this.nextStartTime += buffer.duration;
  }

  /**
   * Stops playback and closes the audio context.
   */
  public stop(): void {
    this.isActive = false;

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.nextStartTime = 0;

    console.log('[AudioPlaybackService] Audio playback stopped');
  }
}
