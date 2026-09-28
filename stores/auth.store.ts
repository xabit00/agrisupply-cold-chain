import { create } from "zustand";
import { User, AuthSession } from "@/lib/types";
import { AUTH_STORAGE_KEY } from "@/lib/constants/roles";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setSession: (session: AuthSession) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  setSession: (session) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      localStorage.setItem("token", session.token);
    }
    set({ user: session.user, token: session.token, isAuthenticated: true });
  },
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem("token");
    }
    set({ user: null, token: null, isAuthenticated: false });
  },
  initialize: () => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        try {
          const session = JSON.parse(stored) as AuthSession;
          set({ user: session.user, token: session.token, isAuthenticated: true });
        } catch {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }
    }
  },
}));
