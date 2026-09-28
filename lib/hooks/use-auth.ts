"use client";

import { useAuthStore } from "@/stores/auth.store";

export function useAuth() {
  const { user, isAuthenticated, logout } = useAuthStore();
  return {
    user,
    isAuthenticated,
    role: user?.role,
    logout,
  };
}
