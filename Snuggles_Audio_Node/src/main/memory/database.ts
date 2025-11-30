import Dexie, { Table } from 'dexie';
import { ConversationTurn, SessionSummary } from '../../shared/types';

/**
 * SnugglesDB - Dexie database for Dr. Snuggles memory
 * Stores conversation history and session summaries.
 */
class SnugglesDB extends Dexie {
  conversations!: Table<ConversationTurn, string>;
  sessions!: Table<SessionSummary, string>;

  /**
   * Initializes the database schema.
   */
  constructor() {
    super('SnugglesDB');

    this.version(1).stores({
      conversations: 'id, timestamp, role',
      sessions: 'id, timestamp'
    });
  }

  /**
   * Add a conversation turn.
   * @param {ConversationTurn} turn - The conversation turn to add.
   */
  async addTurn(turn: ConversationTurn): Promise<void> {
    await this.conversations.add(turn);
  }

  /**
   * Get recent conversation turns.
   * @param {number} [limit=50] - Max number of turns to retrieve.
   * @returns {Promise<ConversationTurn[]>} List of recent turns.
   */
  async getRecentTurns(limit: number = 50): Promise<ConversationTurn[]> {
    return await this.conversations
      .orderBy('timestamp')
      .reverse()
      .limit(limit)
      .toArray();
  }

  /**
   * Add a session summary.
   * @param {SessionSummary} summary - The session summary to add.
   */
  async addSession(summary: SessionSummary): Promise<void> {
    await this.sessions.add(summary);
  }

  /**
   * Get recent session summaries.
   * @param {number} [limit=10] - Max number of summaries to retrieve.
   * @returns {Promise<SessionSummary[]>} List of recent session summaries.
   */
  async getRecentSessions(limit: number = 10): Promise<SessionSummary[]> {
    return await this.sessions
      .orderBy('timestamp')
      .reverse()
      .limit(limit)
      .toArray();
  }

  /**
   * Clear old conversation turns (keep last N days).
   * @param {number} [daysToKeep=30] - Number of days of history to keep.
   */
  async pruneOldConversations(daysToKeep: number = 30): Promise<void> {
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    await this.conversations.where('timestamp').below(cutoffTime).delete();
  }

  /**
   * Get conversation statistics.
   * @returns {Promise<object>} Statistics including total turns, sessions, and date ranges.
   */
  async getStats(): Promise<{
    totalTurns: number;
    totalSessions: number;
    oldestTurn: number | null;
    newestTurn: number | null;
  }> {
    const totalTurns = await this.conversations.count();
    const totalSessions = await this.sessions.count();

    const turns = await this.conversations
      .orderBy('timestamp')
      .toArray();

    return {
      totalTurns,
      totalSessions,
      oldestTurn: turns.length > 0 ? turns[0].timestamp : null,
      newestTurn: turns.length > 0 ? turns[turns.length - 1].timestamp : null
    };
  }

  /**
   * Create a session summary from recent turns.
   * @param {number} turnCount - Number of turns in the session.
   * @param {string} summaryText - The summary text.
   * @returns {Promise<SessionSummary>} The created session summary.
   */
  async createSessionSummary(turnCount: number, summaryText: string): Promise<SessionSummary> {
    const summary: SessionSummary = {
      id: `session_${Date.now()}`,
      timestamp: Date.now(),
      summary: summaryText,
      turnCount
    };

    await this.addSession(summary);
    return summary;
  }
}

// Singleton instance
export const db = new SnugglesDB();

/**
 * Memory Manager
 * High-level interface for conversation memory operations.
 */
export class MemoryManager {
  private db: SnugglesDB;

  /**
   * Initializes the MemoryManager with the singleton database instance.
   */
  constructor() {
    this.db = db;
  }

  /**
   * Record a conversation turn.
   * @param {'user' | 'assistant'} role - The speaker's role.
   * @param {string} text - The spoken text.
   */
  async recordTurn(role: 'user' | 'assistant', text: string): Promise<void> {
    const turn: ConversationTurn = {
      id: `turn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      role,
      text
    };

    await this.db.addTurn(turn);
    console.log(`[Memory] Recorded ${role} turn`);
  }

  /**
   * Get recent conversation context for RAG.
   * Formats recent turns into a readable string for the LLM.
   *
   * @param {number} [limit=10] - Number of turns to include.
   * @returns {Promise<string>} Formatted conversation context.
   */
  async getRecentContext(limit: number = 10): Promise<string> {
    const turns = await this.db.getRecentTurns(limit);

    if (turns.length === 0) {
      return '';
    }

    let context = 'Recent conversation:\n\n';

    turns.reverse().forEach(turn => {
      const speaker = turn.role === 'user' ? 'User' : 'Dr. Snuggles';
      context += `${speaker}: ${turn.text}\n`;
    });

    return context;
  }

  /**
   * Get session summaries for context.
   * @param {number} [limit=3] - Number of summaries to retrieve.
   * @returns {Promise<string[]>} Array of summary texts.
   */
  async getSessionSummaries(limit: number = 3): Promise<string[]> {
    const sessions = await this.db.getRecentSessions(limit);
    return sessions.map(s => s.summary);
  }

  /**
   * End current session and create summary.
   * @param {string} summaryText - Summary of the ended session.
   */
  async endSession(summaryText: string): Promise<void> {
    const turns = await this.db.getRecentTurns();
    await this.db.createSessionSummary(turns.length, summaryText);
    console.log('[Memory] Session ended, summary saved');
  }

  /**
   * Get memory statistics.
   */
  async getStats() {
    return await this.db.getStats();
  }

  /**
   * Clean up old data.
   * @param {number} [daysToKeep=30] - Number of days to keep data.
   */
  async cleanup(daysToKeep: number = 30): Promise<void> {
    await this.db.pruneOldConversations(daysToKeep);
    console.log(`[Memory] Cleaned up conversations older than ${daysToKeep} days`);
  }
}
