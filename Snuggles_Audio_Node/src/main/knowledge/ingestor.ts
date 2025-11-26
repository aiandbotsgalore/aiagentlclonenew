import fs from 'fs';
import path from 'path';
// @ts-ignore - pdf-parse doesn't have type definitions
import pdfParse from 'pdf-parse';
import { KnowledgeDocument } from '../../shared/types';

/**
 * Document Ingestor
 * Parses PDFs and text files into KnowledgeDocument format
 */
export class DocumentIngestor {
  /**
   * Load all documents from a directory
   */
  public async loadDirectory(dirPath: string): Promise<KnowledgeDocument[]> {
    const documents: KnowledgeDocument[] = [];

    if (!fs.existsSync(dirPath)) {
      console.warn(`[Ingestor] Directory not found: ${dirPath}`);
      return documents;
    }

    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const ext = path.extname(file).toLowerCase();

      try {
        if (ext === '.pdf') {
          const doc = await this.parsePDF(filePath);
          if (doc) documents.push(doc);
        } else if (ext === '.txt') {
          const doc = await this.parseText(filePath);
          if (doc) documents.push(doc);
        }
      } catch (error) {
        console.error(`[Ingestor] Failed to parse ${file}:`, error);
      }
    }

    console.log(`[Ingestor] Loaded ${documents.length} documents from ${dirPath}`);
    return documents;
  }

  /**
   * Parse a PDF file
   */
  private async parsePDF(filePath: string): Promise<KnowledgeDocument | null> {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);

      const doc: KnowledgeDocument = {
        id: this.generateId(filePath),
        title: path.basename(filePath, '.pdf'),
        content: this.cleanText(pdfData.text),
        metadata: {
          source: filePath,
          type: 'pdf',
          addedAt: Date.now()
        }
      };

      console.log(`[Ingestor] Parsed PDF: ${doc.title} (${pdfData.numpages} pages)`);
      return doc;
    } catch (error) {
      console.error(`[Ingestor] PDF parse error:`, error);
      return null;
    }
  }

  /**
   * Parse a text file
   */
  private async parseText(filePath: string): Promise<KnowledgeDocument | null> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');

      const doc: KnowledgeDocument = {
        id: this.generateId(filePath),
        title: path.basename(filePath, '.txt'),
        content: this.cleanText(content),
        metadata: {
          source: filePath,
          type: 'txt',
          addedAt: Date.now()
        }
      };

      console.log(`[Ingestor] Parsed text: ${doc.title}`);
      return doc;
    } catch (error) {
      console.error(`[Ingestor] Text parse error:`, error);
      return null;
    }
  }

  /**
   * Clean and normalize text
   */
  private cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
      .replace(/[^\S\n]+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Generate unique ID from file path
   */
  private generateId(filePath: string): string {
    const hash = this.simpleHash(filePath);
    return `doc_${hash}`;
  }

  /**
   * Simple string hash function
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Chunk a document into smaller pieces for better RAG
   */
  public chunkDocument(doc: KnowledgeDocument, chunkSize: number = 1000): KnowledgeDocument[] {
    const chunks: KnowledgeDocument[] = [];
    const words = doc.content.split(/\s+/);

    for (let i = 0; i < words.length; i += chunkSize) {
      const chunkWords = words.slice(i, i + chunkSize);
      const chunkContent = chunkWords.join(' ');

      chunks.push({
        id: `${doc.id}_chunk_${chunks.length}`,
        title: `${doc.title} (Part ${chunks.length + 1})`,
        content: chunkContent,
        metadata: {
          ...doc.metadata,
          parentId: doc.id,
          chunkIndex: chunks.length
        } as any
      });
    }

    return chunks;
  }
}
