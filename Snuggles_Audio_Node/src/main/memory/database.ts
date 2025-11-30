/**
 * Session Memory Service - JSON Storage
 *
 * Manages persistent storage for session summaries using a local JSON file.
 * This replaces the Dexie implementation to ensure compatibility with the Electron Main process
 * on Windows and other platforms without requiring native database drivers.
 */

import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { SessionSummary } from '../../shared/types';

const MEMORY_FILE_NAME = 'session-memory.json';

export class SessionMemoryService {
  private filePath: string;
  private summaries: SessionSummary[] = [];

  constructor() {
    this.filePath = path.join(app.getPath('userData'), MEMORY_FILE_NAME);
    this.load();
    console.log(`[SessionMemory] Initialized at ${this.filePath}`);
  }

  /**
   * Load data from disk.
   */
  private load(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf-8');
        this.summaries = JSON.parse(data);
        console.log(`[SessionMemory] Loaded ${this.summaries.length} summaries`);
      } else {
        this.summaries = [];
        this.save(); // Initialize file
      }
    } catch (error) {
      console.error('[SessionMemory] Failed to load memory:', error);
      this.summaries = [];
    }
  }

  /**
   * Save data to disk.
   */
  private save(): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.summaries, null, 2), 'utf-8');
    } catch (error) {
      console.error('[SessionMemory] Failed to save memory:', error);
    }
  }

  /**
   * Add a new session summary.
   * @param summary The session summary to add.
   */
  async addSummary(summary: SessionSummary): Promise<void> {
    this.summaries.push(summary);
    this.save();
  }

  /**
   * Get recent session summaries.
   * @param count Number of summaries to retrieve.
   */
  async getRecentSummaries(count: number): Promise<string[]> {
    // Sort by timestamp descending
    const sorted = [...this.summaries].sort((a, b) => b.timestamp - a.timestamp);

    // Take top N
    const recent = sorted.slice(0, count);

    return recent.map(s => s.summary);
  }

  /**
   * Get all summaries.
   */
  async getAllSummaries(): Promise<SessionSummary[]> {
    return [...this.summaries].sort((a, b) => b.timestamp - a.timestamp);
  }
}
