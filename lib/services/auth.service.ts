import { apiClient } from "./api-client";
import { AuthSession, User } from "@/lib/types";
import { LoginFormData } from "@/lib/validators/auth.schema";

export const authService = {
  async login(credentials: LoginFormData) {
    return apiClient.post<AuthSession>("/api/auth/login", credentials);
  },

  async getCurrentUser() {
    return apiClient.get<User>("/api/auth/me");
  },
};
