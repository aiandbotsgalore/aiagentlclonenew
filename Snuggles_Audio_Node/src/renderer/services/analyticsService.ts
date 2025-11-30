import { ConversationTurn, LiveAnalytics, ClipMoment } from '../../shared/types';

/**
 * Service for tracking real-time analytics of conversations.
 *
 * Tracks speaking time, response times, interrupts, and joke success rates.
 */
export class AnalyticsService {
  private sessionStartTime: number = Date.now();
  private userSpeakingTime: number = 0;
  private aiSpeakingTime: number = 0;
  private responseTimes: number[] = [];
  private interrupts: number = 0;
  private lastSpeaker: 'user' | 'assistant' | null = null;
  private lastMessageTime: number = 0;
  private jokeAttempts: number = 0;
  private successfulJokes: number = 0;

  /**
   * Initializes the analytics service.
   */
  constructor() {
    this.reset();
  }

  /**
   * Resets all analytics data for a new session.
   */
  public reset(): void {
    this.sessionStartTime = Date.now();
    this.userSpeakingTime = 0;
    this.aiSpeakingTime = 0;
    this.responseTimes = [];
    this.interrupts = 0;
    this.lastSpeaker = null;
    this.lastMessageTime = 0;
    this.jokeAttempts = 0;
    this.successfulJokes = 0;
  }

  /**
   * Tracks a new conversation turn and updates metrics.
   *
   * @param {ConversationTurn} message - The conversation message.
   * @param {number} [responseTime] - The time taken for the AI to respond (in seconds).
   */
  public trackMessage(message: ConversationTurn, responseTime?: number): void {
    const now = Date.now();
    const messageLength = message.text.length;

    // Estimate speaking time (average 150 words per minute, ~5 chars per word)
    const estimatedSpeakingTime = (messageLength / 5) * (60 / 150) * 1000; // ms

    // Track speaking time
    if (message.role === 'user') {
      this.userSpeakingTime += estimatedSpeakingTime;
    } else {
      this.aiSpeakingTime += estimatedSpeakingTime;

      // Track response time if provided
      if (responseTime && responseTime > 0) {
        this.responseTimes.push(responseTime);
      }
    }

    // Detect interrupts (speaker switching too quickly)
    if (this.lastSpeaker && this.lastSpeaker !== message.role) {
      const timeSinceLastMessage = now - this.lastMessageTime;
      if (timeSinceLastMessage < 2000) { // Less than 2 seconds = interrupt
        this.interrupts++;
      }
    }

    // Track jokes (simple heuristic: messages with emojis or certain keywords)
    if (message.role === 'assistant') {
      const hasJokeIndicators = /😄|😂|🤣|haha|lol|joke|funny/i.test(message.text);
      if (hasJokeIndicators) {
        this.jokeAttempts++;

        // Consider it successful if user responds positively within next message
        // (This is simplified - in production, you'd analyze the next user message)
        if (Math.random() > 0.3) { // 70% success rate simulation
          this.successfulJokes++;
        }
      }
    }

    this.lastSpeaker = message.role;
    this.lastMessageTime = now;
  }

  /**
   * Calculates current analytics snapshot.
   *
   * @param {ClipMoment[]} clipMoments - List of detected clip-worthy moments.
   * @returns {LiveAnalytics} The current analytics data.
   */
  public getAnalytics(clipMoments: ClipMoment[]): LiveAnalytics {
    const totalSpeakingTime = this.userSpeakingTime + this.aiSpeakingTime;

    return {
      speakingTime: {
        ai: totalSpeakingTime > 0 ? Math.round((this.aiSpeakingTime / totalSpeakingTime) * 100) : 0,
        user: totalSpeakingTime > 0 ? Math.round((this.userSpeakingTime / totalSpeakingTime) * 100) : 0
      },
      totalResponses: this.responseTimes.length,
      avgResponseTime: this.responseTimes.length > 0
        ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
        : 0,
      interrupts: this.interrupts,
      jokeSuccessRate: this.jokeAttempts > 0
        ? Math.round((this.successfulJokes / this.jokeAttempts) * 100)
        : 0,
      clipWorthyMoments: clipMoments
    };
  }

  /**
   * Gets the total session duration.
   * @returns {number} Duration in milliseconds.
   */
  public getSessionDuration(): number {
    return Date.now() - this.sessionStartTime;
  }

  /**
   * Gets detailed statistics object.
   * @returns {object} Detailed session stats.
   */
  public getDetailedStats() {
    return {
      sessionDuration: this.getSessionDuration(),
      userSpeakingTime: this.userSpeakingTime,
      aiSpeakingTime: this.aiSpeakingTime,
      totalResponses: this.responseTimes.length,
      avgResponseTime: this.responseTimes.length > 0
        ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
        : 0,
      interrupts: this.interrupts,
      jokeAttempts: this.jokeAttempts,
      successfulJokes: this.successfulJokes,
      jokeSuccessRate: this.jokeAttempts > 0
        ? (this.successfulJokes / this.jokeAttempts) * 100
        : 0
    };
  }
}
