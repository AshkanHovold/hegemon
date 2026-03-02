const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4100";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem("hegemon-token", token);
    } else {
      localStorage.removeItem("hegemon-token");
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem("hegemon-token");
    }
    return this.token;
  }

  async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };
    const currentToken = this.getToken();
    if (currentToken) {
      headers.Authorization = `Bearer ${currentToken}`;
    }
    const res = await fetch(`${API_URL}${path}`, { ...options, headers });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(res.status, body.error || "Request failed");
    }
    return res.json();
  }

  get<T>(path: string) {
    return this.fetch<T>(path);
  }

  post<T>(path: string, body?: unknown, extraHeaders?: Record<string, string>) {
    return this.fetch<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      headers: extraHeaders,
    });
  }

  patch<T>(path: string, body: unknown) {
    return this.fetch<T>(path, { method: "PATCH", body: JSON.stringify(body) });
  }

  delete<T>(path: string) {
    return this.fetch<T>(path, { method: "DELETE" });
  }
}

export const api = new ApiClient();
