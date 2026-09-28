import { ApiResponse } from "@/lib/types";
import { AUTH_COOKIE_NAME } from "@/lib/constants/roles";

class ApiClient {
  private baseUrl: string = "";

  private getAuthHeader(): Record<string, string> {
    if (typeof window === "undefined") return {};
    const token = localStorage.getItem("token");
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    // Cookie fallback
    const match = document.cookie
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${AUTH_COOKIE_NAME}=`));
    if (match) {
      const cookieToken = match.split("=")[1];
      return { Authorization: `Bearer ${cookieToken}` };
    }
    return {};
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...this.getAuthHeader(),
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          data: null as unknown as T,
          error: data.error || data.message || `Request failed with status ${response.status}`,
        };
      }

      return data as ApiResponse<T>;
    } catch (error) {
      const isAbort = error instanceof DOMException && error.name === "AbortError";
      return {
        success: false,
        data: null as unknown as T,
        error: isAbort ? "Request timed out after 15 seconds" : (error instanceof Error ? error.message : "Network error"),
      };
    }
  }

  get<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  post<T>(endpoint: string, body?: unknown, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(endpoint: string, body?: unknown, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export const apiClient = new ApiClient();

