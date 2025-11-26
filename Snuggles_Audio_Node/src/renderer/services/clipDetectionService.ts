import Sentiment from 'sentiment';
import { ConversationTurn, ClipMoment } from '../../shared/types';

/**
 * ClipDetectionService - ML-based sentiment analysis for clip-worthy moments
 */
export class ClipDetectionService {
  private sentiment: Sentiment;
  private readonly CLIP_THRESHOLD = 3; // Sentiment score threshold
  private readonly MIN_LENGTH = 100; // Minimum message length for clips

  constructor() {
    this.sentiment = new Sentiment();
  }

  /**
   * Analyze message for clip-worthiness using multiple factors
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
   * Calculate engagement score based on content characteristics
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
   * Calculate quotability score (how likely to be shared)
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
   * Extract a concise title from the message
   */
  private extractTitle(text: string): string {
    // Get first sentence or up to 50 characters
    const firstSentence = text.split(/[.!?]/)[0].trim();
    const title = firstSentence.substring(0, 50);
    return title + (firstSentence.length > 50 ? '...' : '');
  }

  /**
   * Format time in session as HH:MM:SS
   */
  private formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Analyze multiple messages and return top clips
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
   * Get sentiment breakdown for session
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
