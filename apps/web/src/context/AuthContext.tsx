import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { api, ApiError } from "../lib/api";
import type { User } from "../lib/types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    username: string,
    password: string,
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, check for existing token
  useEffect(() => {
    const storedToken = localStorage.getItem("hegemon-token");
    if (storedToken) {
      api.setToken(storedToken);
      setToken(storedToken);
      api
        .get<{ user: User }>("/auth/me")
        .then(({ user }) => {
          setUser(user);
        })
        .catch(() => {
          // Token is invalid, clear it
          api.setToken(null);
          setToken(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<{ token: string; user: User }>("/auth/login", {
      email,
      password,
    });
    api.setToken(data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (email: string, username: string, password: string) => {
      const data = await api.post<{ token: string; user: User }>(
        "/auth/register",
        { email, username, password },
      );
      api.setToken(data.token);
      setToken(data.token);
      setUser(data.user);
    },
    [],
  );

  const logout = useCallback(() => {
    api.setToken(null);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

export { ApiError };
