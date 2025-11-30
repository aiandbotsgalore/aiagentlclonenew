import Sentiment from 'sentiment';
import { ConversationTurn, ClipMoment } from '../../shared/types';

/**
 * Service for analyzing conversation turns to identify clip-worthy moments based on sentiment, engagement, and quotability.
 */
export class ClipDetectionService {
  private sentiment: Sentiment;
  private readonly CLIP_THRESHOLD = 3; // Sentiment score threshold
  private readonly MIN_LENGTH = 100; // Minimum message length for clips

  /**
   * Initializes the clip detection service.
   */
  constructor() {
    this.sentiment = new Sentiment();
  }

  /**
   * Analyzes a single message for clip-worthiness.
   *
   * Evaluates sentiment, engagement, and quotability scores.
   * If the combined score meets the threshold, returns a ClipMoment object.
   *
   * @param {ConversationTurn} message - The message to analyze.
   * @param {number} sessionStartTime - The start time of the session.
   * @returns {ClipMoment | null} A ClipMoment if the message is clip-worthy, otherwise null.
   */
  public analyzeMessage(message: ConversationTurn, sessionStartTime: number): ClipMoment | null {
    // Only analyze AI responses
    if (message.role !== 'assistant') {
      return null;
    }

    // Check minimum length
    if (message.text.length < this.MIN_LENGTH) {
      return null;
    }

    // Calculate sentiment score
    const sentimentResult = this.sentiment.analyze(message.text);
    const score = Math.abs(sentimentResult.score); // Absolute value (strong emotions either way)

    // Check for engagement indicators
    const engagementScore = this.calculateEngagementScore(message.text);

    // Calculate quotability score
    const quotabilityScore = this.calculateQuotabilityScore(message.text);

    // Combined score
    const totalScore = score + engagementScore + quotabilityScore;

    // Check if it meets threshold
    if (totalScore >= this.CLIP_THRESHOLD) {
      return {
        id: message.id,
        timestamp: message.timestamp,
        title: this.extractTitle(message.text),
        timeInSession: this.formatTime(message.timestamp - sessionStartTime),
        snippet: message.text.substring(0, 150) + (message.text.length > 150 ? '...' : '')
      };
    }

    return null;
  }

  /**
   * Calculates engagement score based on content characteristics (questions, exclamations, etc.).
   *
   * @param {string} text - The message text.
   * @returns {number} The calculated engagement score.
   */
  private calculateEngagementScore(text: string): number {
    let score = 0;

    // Questions drive engagement
    if (/\?/g.test(text)) {
      score += 1;
    }

    // Exclamations show emotion
    const exclamations = (text.match(/!/g) || []).length;
    score += Math.min(exclamations * 0.5, 2);

    // Numbers and data points
    if (/\d+%|\d+x|\d+ (times|people|users)/i.test(text)) {
      score += 1;
    }

    // Action words
    const actionWords = ['discover', 'reveal', 'breakthrough', 'amazing', 'incredible', 'shocking'];
    actionWords.forEach(word => {
      if (new RegExp(word, 'i').test(text)) {
        score += 0.5;
      }
    });

    return score;
  }

  /**
   * Calculates quotability score based on sentence structure and rhetorical devices.
   *
   * @param {string} text - The message text.
   * @returns {number} The calculated quotability score.
   */
  private calculateQuotabilityScore(text: string): number {
    let score = 0;

    // Short, punchy sentences
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const shortSentences = sentences.filter(s => s.trim().split(' ').length < 15);
    score += (shortSentences.length / sentences.length) * 2;

    // Metaphors and comparisons
    if (/like|as if|similar to|reminds me of/i.test(text)) {
      score += 1;
    }

    // Strong adjectives
    const strongAdjectives = ['revolutionary', 'transformative', 'unprecedented', 'remarkable', 'extraordinary'];
    strongAdjectives.forEach(adj => {
      if (new RegExp(adj, 'i').test(text)) {
        score += 0.5;
      }
    });

    // Contrasts and paradoxes
    if (/but|however|yet|although|despite/i.test(text)) {
      score += 0.5;
    }

    return score;
  }

  /**
   * Extracts a concise title from the message text.
   *
   * @param {string} text - The message text.
   * @returns {string} The extracted title.
   */
  private extractTitle(text: string): string {
    // Get first sentence or up to 50 characters
    const firstSentence = text.split(/[.!?]/)[0].trim();
    const title = firstSentence.substring(0, 50);
    return title + (firstSentence.length > 50 ? '...' : '');
  }

  /**
   * Formats a duration in milliseconds to HH:MM:SS string.
   *
   * @param {number} ms - The duration in milliseconds.
   * @returns {string} The formatted time string.
   */
  private formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Analyzes multiple messages and returns the top clips.
   *
   * @param {ConversationTurn[]} messages - The list of messages.
   * @param {number} sessionStartTime - The session start time.
   * @param {number} [limit=5] - Maximum number of clips to return.
   * @returns {ClipMoment[]} List of clip-worthy moments.
   */
  public detectClips(messages: ConversationTurn[], sessionStartTime: number, limit: number = 5): ClipMoment[] {
    const clips: ClipMoment[] = [];

    for (const message of messages) {
      const clip = this.analyzeMessage(message, sessionStartTime);
      if (clip) {
        clips.push(clip);
      }
    }

    // Sort by timestamp (most recent first) and limit
    return clips
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Gets the overall sentiment breakdown for a session.
   *
   * @param {ConversationTurn[]} messages - The list of messages.
   * @returns {object} Sentiment statistics (positive, negative, neutral counts and overall tone).
   */
  public getSessionSentiment(messages: ConversationTurn[]) {
    let positive = 0;
    let negative = 0;
    let neutral = 0;

    messages.forEach(message => {
      const result = this.sentiment.analyze(message.text);
      if (result.score > 0) positive++;
      else if (result.score < 0) negative++;
      else neutral++;
    });

    return {
      positive,
      negative,
      neutral,
      total: messages.length,
      overallTone: positive > negative ? 'positive' : negative > positive ? 'negative' : 'neutral'
    };
  }
}
