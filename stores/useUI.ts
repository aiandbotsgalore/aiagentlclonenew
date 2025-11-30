import { create } from 'zustand';

/**
 * State definition for the UI store.
 */
type UIState = {
  /**
   * Whether the user configuration modal is visible.
   */
  showUserConfig: boolean;
  /**
   * Whether the agent edit modal is visible.
   */
  showAgentEdit: boolean;
  /**
   * Sets the visibility of the user configuration modal.
   * @param {boolean} show - True to show, false to hide.
   */
  setShowUserConfig: (show: boolean) => void;
  /**
   * Sets the visibility of the agent edit modal.
   * @param {boolean} show - True to show, false to hide.
   */
  setShowAgentEdit: (show: boolean) => void;
};

/**
 * Store for managing global UI state, such as modal visibility.
 */
export const useUIStore = create<UIState>((set) => ({
  showUserConfig: false,
  showAgentEdit: false,
  setShowUserConfig: (show) => set({ showUserConfig: show }),
  setShowAgentEdit: (show) => set({ showAgentEdit: show }),
}));
