import { ConversationTurn, SessionMemory } from '../../shared/types';

/**
 * Service for exporting conversation transcripts in various formats.
 *
 * Supports plain text (TXT), JSON, Markdown, and CSV formats.
 */
export class TranscriptExporter {
  /**
   * Export to plain text format.
   *
   * @param {ConversationTurn[]} messages - The list of conversation messages.
   * @param {SessionMemory} [sessionInfo] - Optional session metadata.
   * @returns {string} The transcript as a plain text string.
   */
  public exportToTXT(messages: ConversationTurn[], sessionInfo?: SessionMemory): string {
    let output = '═══════════════════════════════════════════════\n';
    output += '  Dr. Snuggles - Session Transcript\n';
    output += '═══════════════════════════════════════════════\n\n';

    output += `Generated: ${new Date().toLocaleString()}\n`;
    output += `Total Messages: ${messages.length}\n\n`;

    // Add session info if provided
    if (sessionInfo) {
      output += '─── Key Topics ───\n';
      sessionInfo.keyTopics.forEach(topic => {
        output += `• ${topic.topic} (${topic.mentions}x)\n`;
      });
      output += '\n';
    }

    output += '─── Conversation ───\n\n';

    messages.forEach((message, index) => {
      const speaker = message.role === 'user' ? 'Demo Host' : 'Dr. Snuggles';
      const time = new Date(message.timestamp).toLocaleTimeString();

      output += `[${time}] ${speaker}:\n`;
      output += `${message.text}\n\n`;
    });

    output += '═══════════════════════════════════════════════\n';
    output += `End of Transcript - ${messages.length} messages\n`;
    output += '═══════════════════════════════════════════════\n';

    return output;
  }

  /**
   * Export to JSON format (structured data).
   * Useful for programmatic consumption.
   *
   * @param {ConversationTurn[]} messages - The list of conversation messages.
   * @param {SessionMemory} [sessionInfo] - Optional session metadata.
   * @returns {string} The transcript as a JSON string.
   */
  public exportToJSON(messages: ConversationTurn[], sessionInfo?: SessionMemory): string {
    const data = {
      metadata: {
        exportedAt: new Date().toISOString(),
        totalMessages: messages.length,
        session: {
          startTime: messages[0]?.timestamp || Date.now(),
          endTime: messages[messages.length - 1]?.timestamp || Date.now(),
          duration: messages.length > 0
            ? messages[messages.length - 1].timestamp - messages[0].timestamp
            : 0
        }
      },
      sessionInfo: sessionInfo || null,
      messages: messages.map(msg => ({
        id: msg.id,
        timestamp: msg.timestamp,
        timestampISO: new Date(msg.timestamp).toISOString(),
        role: msg.role,
        speaker: msg.role === 'user' ? 'Demo Host' : 'Dr. Snuggles',
        text: msg.text,
        wordCount: msg.text.split(' ').length
      }))
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Export to Markdown format.
   * Readable and shareable format with formatting.
   *
   * @param {ConversationTurn[]} messages - The list of conversation messages.
   * @param {SessionMemory} [sessionInfo] - Optional session metadata.
   * @returns {string} The transcript as a Markdown string.
   */
  public exportToMarkdown(messages: ConversationTurn[], sessionInfo?: SessionMemory): string {
    let output = '# Dr. Snuggles - Session Transcript\n\n';

    output += `**Generated:** ${new Date().toLocaleString()}  \n`;
    output += `**Total Messages:** ${messages.length}  \n`;

    if (messages.length > 0) {
      const duration = messages[messages.length - 1].timestamp - messages[0].timestamp;
      const minutes = Math.floor(duration / 60000);
      output += `**Duration:** ${minutes} minutes  \n`;
    }

    output += '\n---\n\n';

    // Add session info if provided
    if (sessionInfo && sessionInfo.keyTopics.length > 0) {
      output += '## 📌 Key Topics\n\n';
      sessionInfo.keyTopics.forEach(topic => {
        output += `- **${topic.topic}** (mentioned ${topic.mentions}x)\n`;
      });
      output += '\n';
    }

    if (sessionInfo && sessionInfo.runningJokes.length > 0) {
      output += '## 😄 Running Jokes\n\n';
      sessionInfo.runningJokes.forEach(joke => {
        output += `- ${joke}\n`;
      });
      output += '\n';
    }

    output += '## 💬 Conversation\n\n';

    messages.forEach((message, index) => {
      const speaker = message.role === 'user' ? '👤 Demo Host' : '🤖 Dr. Snuggles';
      const time = new Date(message.timestamp).toLocaleTimeString();

      output += `### ${speaker} <sub>${time}</sub>\n\n`;
      output += `${message.text}\n\n`;
      output += '---\n\n';
    });

    output += `*End of Transcript - ${messages.length} messages*\n`;

    return output;
  }

  /**
   * Export to CSV format (comma-separated values).
   * Suitable for spreadsheet analysis.
   *
   * @param {ConversationTurn[]} messages - The list of conversation messages.
   * @returns {string} The transcript as a CSV string.
   */
  public exportToCSV(messages: ConversationTurn[]): string {
    let output = 'Timestamp,ISO Time,Speaker,Role,Text,Word Count\n';

    messages.forEach(message => {
      const speaker = message.role === 'user' ? 'Demo Host' : 'Dr. Snuggles';
      const isoTime = new Date(message.timestamp).toISOString();
      const wordCount = message.text.split(' ').length;

      // Escape quotes in text
      const escapedText = message.text.replace(/"/g, '""');

      output += `${message.timestamp},"${isoTime}","${speaker}",${message.role},"${escapedText}",${wordCount}\n`;
    });

    return output;
  }

  /**
   * Downloads a generated file to the user's system.
   *
   * @param {string} content - The content of the file.
   * @param {string} filename - The name of the file to save.
   * @param {string} mimeType - The MIME type of the content.
   * @returns {Promise<void>}
   */
  public async downloadFile(content: string, filename: string, mimeType: string): Promise<void> {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Generates a filename with the current date timestamp.
   *
   * @param {string} extension - The file extension (e.g., 'txt', 'json').
   * @returns {string} The generated filename.
   */
  public generateFilename(extension: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    return `dr-snuggles-transcript-${timestamp}.${extension}`;
  }
}
