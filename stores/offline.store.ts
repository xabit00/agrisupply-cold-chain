import { create } from "zustand";

interface OfflineState {
  isOnline: boolean;
  pendingTransactionsCount: number;
  setIsOnline: (status: boolean) => void;
  setPendingCount: (count: number) => void;
}

export const useOfflineStore = create<OfflineState>((set) => ({
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  pendingTransactionsCount: 0,
  setIsOnline: (isOnline) => set({ isOnline }),
  setPendingCount: (pendingTransactionsCount) =>
    set({ pendingTransactionsCount }),
}));
