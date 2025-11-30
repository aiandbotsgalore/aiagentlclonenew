import { create, insertMultiple, search, Orama } from '@orama/orama';
// @ts-ignore - module resolution issue with persistence plugin
import { persistToFile, restoreFromFile } from '@orama/plugin-data-persistence/server';
import path from 'path';
import fs from 'fs';
import { DocumentIngestor } from './ingestor';
import { KnowledgeDocument, RAGResult } from '../../shared/types';

const INDEX_PATH = path.join(process.cwd(), 'snuggles-index.json');

/**
 * KnowledgeStore manages the Orama vector search index
 * and provides Retrieval-Augmented Generation (RAG) functionality for Dr. Snuggles.
 */
export class KnowledgeStore {
  private db: Orama<any> | null = null;
  private ingestor: DocumentIngestor;
  private documents: Map<string, KnowledgeDocument> = new Map();
  private initialized: boolean = false;

  /**
   * Initializes the KnowledgeStore.
   */
  constructor() {
    this.ingestor = new DocumentIngestor();
  }

  /**
   * Initialize the knowledge store.
   * Loads from saved index if available, otherwise creates a new one.
   *
   * @returns {Promise<void>}
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('[KnowledgeStore] Already initialized');
      return;
    }

    try {
      // Try to restore from saved index
      if (fs.existsSync(INDEX_PATH)) {
        console.log('[KnowledgeStore] Restoring from saved index...');
        this.db = await restoreFromFile('json', INDEX_PATH) as Orama<any>;
        console.log('[KnowledgeStore] Index restored successfully');
      } else {
        console.log('[KnowledgeStore] Creating new index...');
        await this.createNewIndex();
      }

      this.initialized = true;
    } catch (error) {
      console.error('[KnowledgeStore] Initialization failed:', error);
      // Fallback to new index
      await this.createNewIndex();
      this.initialized = true;
    }
  }

  /**
   * Create a new Orama index with the required schema.
   *
   * @returns {Promise<void>}
   */
  private async createNewIndex(): Promise<void> {
    this.db = await create({
      schema: {
        id: 'string',
        title: 'string',
        content: 'string',
        source: 'string',
        type: 'string',
        addedAt: 'number'
      }
    });

    console.log('[KnowledgeStore] New index created');
  }

  /**
   * Load documents from knowledge directory.
   * Parses, chunks, and indexes documents found in the specified directory.
   *
   * @param {string} knowledgeDir - Path to the knowledge directory.
   * @returns {Promise<void>}
   */
  public async loadDocuments(knowledgeDir: string): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log(`[KnowledgeStore] Loading documents from ${knowledgeDir}...`);

    // Parse documents
    const docs = await this.ingestor.loadDirectory(knowledgeDir);

    if (docs.length === 0) {
      console.warn('[KnowledgeStore] No documents found');
      return;
    }

    // Chunk large documents for better retrieval
    const chunkedDocs: KnowledgeDocument[] = [];
    for (const doc of docs) {
      if (doc.content.length > 2000) {
        const chunks = this.ingestor.chunkDocument(doc, 500);
        chunkedDocs.push(...chunks);
      } else {
        chunkedDocs.push(doc);
      }
    }

    // Store documents
    for (const doc of chunkedDocs) {
      this.documents.set(doc.id, doc);
    }

    // Insert into Orama
    if (this.db) {
      const oramaDocs = chunkedDocs.map(doc => ({
        id: doc.id,
        title: doc.title,
        content: doc.content,
        source: doc.metadata.source,
        type: doc.metadata.type,
        addedAt: doc.metadata.addedAt
      }));

      await insertMultiple(this.db, oramaDocs);
      console.log(`[KnowledgeStore] Indexed ${oramaDocs.length} documents`);

      // Save index to disk
      await this.saveIndex();
    }
  }

  /**
   * Search the knowledge base.
   *
   * @param {string} query - The search query.
   * @param {number} [limit=5] - Maximum number of results to return.
   * @returns {Promise<RAGResult[]>} Array of search results with relevance scores.
   */
  public async search(query: string, limit: number = 5): Promise<RAGResult[]> {
    if (!this.initialized || !this.db) {
      console.warn('[KnowledgeStore] Not initialized');
      return [];
    }

    try {
      const results = await search(this.db, {
        term: query,
        limit,
        tolerance: 2,
        boost: {
          title: 2,
          content: 1
        }
      });

      const ragResults: RAGResult[] = results.hits.map((hit: any) => {
        const doc = this.documents.get(hit.id);
        return {
          document: doc!,
          score: hit.score,
          relevance: this.calculateRelevance(hit.score)
        };
      });

      console.log(`[KnowledgeStore] Found ${ragResults.length} results for: "${query}"`);
      return ragResults;
    } catch (error) {
      console.error('[KnowledgeStore] Search failed:', error);
      return [];
    }
  }

  /**
   * Get system context for Gemini (top knowledge snippets).
   * Retrieves a preview of the top available documents to prime the model.
   *
   * @returns {Promise<string>} The formatted context string.
   */
  public async getSystemContext(): Promise<string> {
    const topDocs = Array.from(this.documents.values()).slice(0, 3);

    if (topDocs.length === 0) {
      return '';
    }

    let context = 'You have access to the following knowledge:\n\n';

    for (const doc of topDocs) {
      const preview = doc.content.substring(0, 300);
      context += `**${doc.title}**\n${preview}...\n\n`;
    }

    return context;
  }

  /**
   * Save index to disk.
   * Persists the Orama database to a JSON file.
   *
   * @returns {Promise<void>}
   */
  private async saveIndex(): Promise<void> {
    if (!this.db) return;

    try {
      await persistToFile(this.db, 'json', INDEX_PATH);
      console.log('[KnowledgeStore] Index saved to disk');
    } catch (error) {
      console.error('[KnowledgeStore] Failed to save index:', error);
    }
  }

  /**
   * Calculate relevance percentage from Orama score.
   *
   * @param {number} score - The raw score from Orama.
   * @returns {number} The relevance percentage (0-100).
   */
  private calculateRelevance(score: number): number {
    // Orama scores are typically 0-1, normalize to 0-100
    return Math.min(100, Math.round(score * 100));
  }

  /**
   * Get document count.
   * @returns {Promise<number>} The number of documents in the store.
   */
  public async getDocumentCount(): Promise<number> {
    return this.documents.size;
  }

  /**
   * Clear all documents and index.
   * Removes all data from memory and deletes the persistent index file.
   *
   * @returns {Promise<void>}
   */
  public async clear(): Promise<void> {
    this.documents.clear();
    await this.createNewIndex();

    if (fs.existsSync(INDEX_PATH)) {
      fs.unlinkSync(INDEX_PATH);
    }

    console.log('[KnowledgeStore] Cleared all documents');
  }
}
