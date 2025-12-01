import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Agent } from '../types';

const AGENT_PRESETS: Agent[] = [
  {
    id: 'dr-snuggles-p',
    name: 'Dr. Snuggles',
    personality:
      'You are Dr. Snuggles, a charming and witty AI cohost with a warm, engaging personality. You excel at natural conversation, asking thoughtful questions, and keeping discussions lively and entertaining. You have a knack for storytelling, can riff on ideas creatively, and know when to add humor or go deep on a topic. You are an excellent collaborator for content creation, podcasting, and brainstorming sessions. Your style is conversational yet intelligent, casual yet professional. You make your cohost look good while being genuinely helpful and fun to talk with.',
    bodyColor: '#10b981', // emerald-500 (friendly, energetic green)
    voice: { pitch: 'medium', style: 'energetic' },
  },
  {
    id: 'zara-p',
    name: 'Zara',
    personality:
      'You are Zara, a friendly and insightful AI assistant. You are curious, encouraging, and knowledgeable. You break down complex topics into easy-to-understand explanations. You are patient and always willing to help.',
    bodyColor: '#3b82f6', // blue-500
    voice: { pitch: 'medium', style: 'calm' },
  },
  {
    id: 'kai-p',
    name: 'Kai',
    personality:
      "You are Kai, an energetic and enthusiastic AI companion. You're passionate about creativity, brainstorming, and innovation. You speak in a lively, upbeat manner and often use positive affirmations. You are great at motivating others.",
    bodyColor: '#f59e0b', // amber-500
    voice: { pitch: 'medium', style: 'energetic' },
  },
  {
    id: 'onyx-p',
    name: 'Onyx',
    personality:
      'You are Onyx, a direct and concise AI expert. You value accuracy and efficiency. You speak in a formal, measured tone. You get straight to the point but can provide deep analysis when requested. You are highly logical and analytical.',
    bodyColor: '#6b7280', // gray-500
    voice: { pitch: 'low', style: 'formal' },
  },
];


type AgentState = {
  current: Agent;
  availablePresets: Agent[];
  availablePersonal: Agent[];
  setCurrent: (agentId: string) => void;
  update: (agentData: Partial<Agent>) => void;
  // addAgent, deleteAgent etc. could be added here
};

export const useAgentStore = create<AgentState>()(
  persist(
    (set, get) => ({
      current: AGENT_PRESETS[0],
      availablePresets: AGENT_PRESETS,
      availablePersonal: [],
      setCurrent: (agentId) => {
        const allAgents = [...get().availablePresets, ...get().availablePersonal];
        const newCurrent = allAgents.find((a) => a.id === agentId);
        if (newCurrent) {
          set({ current: newCurrent });
        }
      },
      update: (agentData) => {
        set((state) => ({
          current: { ...state.current, ...agentData },
        }));
      },
    }),
    {
      name: 'agent-storage',
    }
  )
);