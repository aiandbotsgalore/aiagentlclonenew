import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Message } from '../types';

type ConversationState = {
  messages: Message[];
  currentTranscript: string;  // Real-time transcription buffer
  isTranscribing: boolean;
  addMessage: (role: 'user' | 'assistant', content: string, isAudio?: boolean) => void;
  setTranscript: (text: string) => void;
  setTranscribing: (isTranscribing: boolean) => void;
  clearMessages: () => void;
  exportConversation: () => string;
};

export const useConversationStore = create<ConversationState>()(
  persist(
    (set, get) => ({
      messages: [],
      currentTranscript: '',
      isTranscribing: false,

      addMessage: (role, content, isAudio = false) => {
        const message: Message = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          role,
          content,
          timestamp: new Date(),
          isAudio,
        };
        set((state) => ({
          messages: [...state.messages, message],
          currentTranscript: '', // Clear transcript after adding message
        }));
      },

      setTranscript: (text) => set({ currentTranscript: text }),

      setTranscribing: (isTranscribing) => set({ isTranscribing }),

      clearMessages: () => set({ messages: [], currentTranscript: '' }),

      exportConversation: () => {
        const { messages } = get();
        const timestamp = new Date().toISOString().split('T')[0];
        let markdown = `# Conversation Export - ${timestamp}\n\n`;

        messages.forEach((msg) => {
          const time = new Date(msg.timestamp).toLocaleTimeString();
          const speaker = msg.role === 'user' ? '**You**' : '**AI**';
          const audioTag = msg.isAudio ? ' 🎤' : '';
          markdown += `### ${speaker}${audioTag} - ${time}\n${msg.content}\n\n`;
        });

        return markdown;
      },
    }),
    {
      name: 'conversation-storage',
      partialize: (state) => ({ messages: state.messages }), // Only persist messages
    }
  )
);
