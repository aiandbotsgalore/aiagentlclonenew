import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * State definition for the User store.
 */
type UserState = {
  /**
   * The user's name.
   */
  name: string;
  /**
   * Information about the user.
   */
  info: string;
  /**
   * Sets the user's name.
   * @param {string} name - The new name.
   */
  setName: (name: string) => void;
  /**
   * Sets the user's information.
   * @param {string} info - The new information.
   */
  setInfo: (info: string) => void;
};

/**
 * Store for managing user information.
 *
 * It uses Zustand with persistence to save the state to local storage.
 */
export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      name: 'Alex',
      info: 'A creative software developer who loves sci-fi and exploring new technologies.',
      setName: (name) => set({ name }),
      setInfo: (info) => set({ info }),
    }),
    {
      name: 'user-storage',
    }
  )
);
