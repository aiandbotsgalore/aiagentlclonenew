import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Agent } from '../types';

/**
 * Predefined agent presets.
 */
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


/**
 * State definition for the Agent store.
 */
type AgentState = {
  /**
   * The currently selected agent.
   */
  current: Agent;
  /**
   * List of available preset agents.
   */
  availablePresets: Agent[];
  /**
   * List of custom user-created agents.
   */
  availablePersonal: Agent[];
  /**
   * Sets the current agent by ID.
   * @param {string} agentId - The ID of the agent to select.
   */
  setCurrent: (agentId: string) => void;
  /**
   * Updates the current agent's data.
   * @param {Partial<Agent>} agentData - The partial agent data to update.
   */
  update: (agentData: Partial<Agent>) => void;
  // addAgent, deleteAgent etc. could be added here
};

/**
 * Store for managing agent state, including selection, updates, and persistence.
 *
 * It uses Zustand with persistence to save the state to local storage.
 */
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
