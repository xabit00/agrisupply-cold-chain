import { ApiResponse } from "@/lib/types";

class ApiClient {
  private baseUrl: string = "";


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
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => ({}));

      if (response.status === 401 && typeof window !== "undefined") {
        localStorage.removeItem("agri_supply_auth_session");
        if (!window.location.pathname.startsWith("/login")) {
          window.location.assign("/login");
        }
      }

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

