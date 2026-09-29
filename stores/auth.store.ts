import { create } from "zustand";
import type { User, AuthSession } from "@/lib/types";
import { AUTH_STORAGE_KEY } from "@/lib/constants/roles";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setSession: (session: AuthSession) => void;
  logout: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  setSession: (session) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: session.user }));
      localStorage.removeItem("token");
    }
    set({ user: session.user, isAuthenticated: true, isInitialized: true });
  },
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem("token");
    }
    set({ user: null, isAuthenticated: false, isInitialized: true });
  },
  initialize: async () => {
    if (typeof window === "undefined") return;
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store", credentials: "same-origin" });
      const body = await response.json();
      if (!response.ok || !body.success || !body.data) throw new Error("Session unavailable");
      const user = body.data as User;
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user }));
      localStorage.removeItem("token");
      set({ user, isAuthenticated: true, isInitialized: true });
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem("token");
      set({ user: null, isAuthenticated: false, isInitialized: true });
    }
  },
}));