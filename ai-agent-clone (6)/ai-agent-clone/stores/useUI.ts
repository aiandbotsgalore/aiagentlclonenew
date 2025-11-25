import { create } from 'zustand';

type UIState = {
  showUserConfig: boolean;
  showAgentEdit: boolean;
  setShowUserConfig: (show: boolean) => void;
  setShowAgentEdit: (show: boolean) => void;
};

export const useUIStore = create<UIState>((set) => ({
  showUserConfig: false,
  showAgentEdit: false,
  setShowUserConfig: (show) => set({ showUserConfig: show }),
  setShowAgentEdit: (show) => set({ showAgentEdit: show }),
}));