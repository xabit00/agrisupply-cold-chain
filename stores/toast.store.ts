import { create } from "zustand";
import type { ToastItem } from "@/components/ui/toast";

export interface ToastInput {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
  /** Auto-dismiss delay in ms; pass 0 to keep it pinned until dismissed. */
  durationMs?: number;
}

interface ToastState {
  toasts: ToastItem[];
  push: (input: ToastInput) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

const MAX_VISIBLE_TOASTS = 4;
const DEFAULT_DURATION_MS = 4000;

let toastSequence = 0;
const dismissTimers = new Map<string, ReturnType<typeof setTimeout>>();

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  push: (input) => {
    const id = `toast_${Date.now()}_${toastSequence++}`;
    const item: ToastItem = {
      id,
      title: input.title,
      description: input.description,
      variant: input.variant,
    };

    set((state) => ({
      toasts: [...state.toasts, item].slice(-MAX_VISIBLE_TOASTS),
    }));

    const duration = input.durationMs ?? DEFAULT_DURATION_MS;
    if (duration > 0) {
      const timer = setTimeout(() => {
        dismissTimers.delete(id);
        get().dismiss(id);
      }, duration);
      dismissTimers.set(id, timer);
    }

    return id;
  },

  dismiss: (id) => {
    const timer = dismissTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      dismissTimers.delete(id);
    }
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }));
  },

  clear: () => {
    dismissTimers.forEach((timer) => clearTimeout(timer));
    dismissTimers.clear();
    set({ toasts: [] });
  },
}));

/**
 * Imperative toast API usable outside React render (mutations, services).
 */
export const toast = {
  success: (title: string, description?: string) =>
    useToastStore.getState().push({ title, description }),
  error: (title: string, description?: string) =>
    useToastStore
      .getState()
      .push({ title, description, variant: "destructive", durationMs: 7000 }),
  info: (title: string, description?: string) =>
    useToastStore.getState().push({ title, description, durationMs: 5000 }),
  dismiss: (id: string) => useToastStore.getState().dismiss(id),
  clear: () => useToastStore.getState().clear(),
};
