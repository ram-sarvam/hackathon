import { create } from "zustand";

export const useStore = create<{
  userId: string;
  setUserId: (userId: string) => void;
}>((set) => ({
  userId: '',
  setUserId: (userId: string) =>
    set((state) => {
      localStorage.setItem("userId", userId);
      return { userId };
    }),
}));
