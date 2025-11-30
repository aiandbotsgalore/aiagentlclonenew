/**
 * Session Memory Service - Dexie.js
 *
 * Manages persistent storage for session summaries and conversation history.
 */

import Dexie, { Table } from 'dexie';
import { SessionSummary } from '../../shared/types';

export class SessionMemoryDB extends Dexie {
  summaries!: Table<SessionSummary, string>;

  constructor() {
    super('SnugglesMemory');
    this.version(1).stores({
      summaries: 'id, timestamp, turnCount'
    });
  }
}

export class SessionMemoryService {
  private db: SessionMemoryDB;

  constructor() {
    this.db = new SessionMemoryDB();
  }

  /**
   * Add a new session summary.
   * @param summary The session summary to add.
   */
  async addSummary(summary: SessionSummary): Promise<void> {
    await this.db.summaries.put(summary);
  }

  /**
   * Get recent session summaries.
   * @param count Number of summaries to retrieve.
   */
  async getRecentSummaries(count: number): Promise<string[]> {
    const summaries = await this.db.summaries
      .orderBy('timestamp')
      .reverse()
      .limit(count)
      .toArray();

    return summaries.map(s => s.summary);
  }

  /**
   * Get all summaries.
   */
  async getAllSummaries(): Promise<SessionSummary[]> {
    return await this.db.summaries.orderBy('timestamp').reverse().toArray();
  }
}
