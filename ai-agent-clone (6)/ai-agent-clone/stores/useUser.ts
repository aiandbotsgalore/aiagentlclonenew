import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type UserState = {
  name: string;
  info: string;
  setName: (name: string) => void;
  setInfo: (info: string) => void;
};

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