/**
 * AUDIO CAPTURE SERVICE - Renderer
 *
 * Captures audio from the user's microphone using the Web Audio API.
 * buffers the audio, and sends it to the main process via IPC.
 */

export class AudioCaptureService {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null; // Using ScriptProcessor for simplicity/compatibility
  private isActive: boolean = false;
  private sampleRate: number = 48000;
  private bufferSize: number = 4096;

  constructor() {
    console.log('[AudioCaptureService] Initialized');
  }

  /**
   * Starts audio capture.
   *
   * @param {string} [deviceId] - Optional specific device ID to use.
   * @returns {Promise<void>}
   */
  public async start(deviceId?: string): Promise<void> {
    if (this.isActive) return;

    try {
      this.audioContext = new AudioContext({ sampleRate: this.sampleRate });

      const constraints: MediaStreamConstraints = {
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
        video: false
      };

      console.log(`[AudioCaptureService] Requesting microphone access (${deviceId || 'default'})...`);
      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Use ScriptProcessor to access raw audio data
      // Buffer size 4096 gives ~85ms latency at 48kHz, which is a reasonable trade-off
      this.processor = this.audioContext.createScriptProcessor(this.bufferSize, 1, 1);

      this.processor.onaudioprocess = (e) => {
        if (!this.isActive) return;

        const inputData = e.inputBuffer.getChannelData(0);
        // Clone the data because inputData is reused
        const audioChunk = new Float32Array(inputData);

        // Send to main process
        window.snugglesAPI.genaiSendAudioChunk(audioChunk);
      };

      source.connect(this.processor);
      this.processor.connect(this.audioContext.destination); // Necessary for the processor to run

      this.isActive = true;
      console.log('[AudioCaptureService] Audio capture started');

    } catch (error) {
      console.error('[AudioCaptureService] Failed to start capture:', error);
      this.stop();
      throw error;
    }
  }

  /**
   * Stops audio capture and cleans up resources.
   */
  public stop(): void {
    this.isActive = false;

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    console.log('[AudioCaptureService] Audio capture stopped');
  }

  /**
   * Checks if capture is currently active.
   */
  public isCapturing(): boolean {
    return this.isActive;
  }
}
