/**
 * VoicePreviewService - Text-to-Speech voice preview using Web Speech API
 */
export class VoicePreviewService {
  private synth: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    this.synth = window.speechSynthesis;
  }

  /**
   * Get available voices from the system
   */
  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.synth.getVoices();
  }

  /**
   * Wait for voices to load (they load asynchronously)
   */
  public waitForVoices(): Promise<SpeechSynthesisVoice[]> {
    return new Promise((resolve) => {
      const voices = this.synth.getVoices();
      if (voices.length > 0) {
        resolve(voices);
      } else {
        this.synth.onvoiceschanged = () => {
          resolve(this.synth.getVoices());
        };
      }
    });
  }

  /**
   * Preview a voice with sample text
   */
  public async previewVoice(
    voiceName: string,
    sampleText: string = "Hello, I'm Dr. Snuggles. Welcome to the future of AI conversations."
  ): Promise<void> {
    // Stop any currently playing preview
    this.stop();

    // Wait for voices to load
    const voices = await this.waitForVoices();

    // Find the selected voice
    let selectedVoice = voices.find(v => v.name === voiceName);

    // Fallback to a deep male voice if not found
    if (!selectedVoice) {
      selectedVoice = voices.find(v =>
        v.name.toLowerCase().includes('male') ||
        v.name.toLowerCase().includes('daniel') ||
        v.name.toLowerCase().includes('alex')
      ) || voices[0];
    }

    // Create utterance
    this.currentUtterance = new SpeechSynthesisUtterance(sampleText);

    if (selectedVoice) {
      this.currentUtterance.voice = selectedVoice;
    }

    // Configure voice characteristics for Dr. Snuggles
    this.currentUtterance.pitch = 0.8;  // Deeper voice
    this.currentUtterance.rate = 0.9;   // Slightly slower, more authoritative
    this.currentUtterance.volume = 1.0;

    // Play the preview
    return new Promise((resolve, reject) => {
      if (!this.currentUtterance) {
        reject(new Error('Failed to create utterance'));
        return;
      }

      this.currentUtterance.onend = () => {
        resolve();
      };

      this.currentUtterance.onerror = (error) => {
        reject(error);
      };

      this.synth.speak(this.currentUtterance);
    });
  }

  /**
   * Stop current preview
   */
  public stop(): void {
    if (this.synth.speaking) {
      this.synth.cancel();
    }
    this.currentUtterance = null;
  }

  /**
   * Check if preview is currently playing
   */
  public isPlaying(): boolean {
    return this.synth.speaking;
  }

  /**
   * Get recommended voices for Dr. Snuggles
   */
  public async getRecommendedVoices(): Promise<SpeechSynthesisVoice[]> {
    const voices = await this.waitForVoices();

    // Prefer deep, male, English voices
    const preferred = voices.filter(v => {
      const name = v.name.toLowerCase();
      const lang = v.lang.toLowerCase();

      return (
        lang.startsWith('en') && // English voices
        (
          name.includes('male') ||
          name.includes('daniel') ||
          name.includes('alex') ||
          name.includes('fred') ||
          name.includes('jorge')
        )
      );
    });

    return preferred.length > 0 ? preferred : voices.slice(0, 5);
  }

  /**
   * Get voice characteristics
   */
  public getVoiceInfo(voice: SpeechSynthesisVoice) {
    return {
      name: voice.name,
      lang: voice.lang,
      default: voice.default,
      localService: voice.localService,
      voiceURI: voice.voiceURI
    };
  }

  /**
   * Test if speech synthesis is supported
   */
  public static isSupported(): boolean {
    return 'speechSynthesis' in window;
  }
}
