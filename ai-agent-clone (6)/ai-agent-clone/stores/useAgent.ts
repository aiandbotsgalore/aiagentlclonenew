import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Agent } from '../types';

const AGENT_PRESETS: Agent[] = [
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