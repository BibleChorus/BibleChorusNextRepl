import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import { signOut } from "next-auth/react";
import type { User } from "@/types";
import { attachApiToken, isUsableToken } from "@/lib/client-auth";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => Promise<void>;
  getAuthToken: () => Promise<string | null>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);

function saveSession(user: User | null, token: string | null) {
  try {
    if (user && token) {
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  } catch {
    /* The current in-memory and cookie session still work. */
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshing = useRef<Promise<string | null> | null>(null);
  const login = useCallback((userData: User, authToken: string) => {
    if (!isUsableToken(authToken)) return;
    setUser(userData);
    setToken(authToken);
    saveSession(userData, authToken);
  }, []);
  const logout = useCallback(async () => {
    setUser(null);
    setToken(null);
    saveSession(null, null);
    await Promise.allSettled([
      fetch("/api/auth/logout", { method: "POST" }),
      signOut({ redirect: false }),
    ]);
  }, []);
  const getAuthToken = useCallback(async () => {
    if (isUsableToken(token)) return token;
    let stored: string | null = null;
    try {
      stored = localStorage.getItem("token");
    } catch {
      /* Storage unavailable. */
    }
    if (isUsableToken(stored)) return stored;
    if (!refreshing.current) {
      refreshing.current = fetch("/api/auth/session")
        .then(async (response) => {
          if (!response.ok) return null;
          const session = await response.json();
          if (!session.user || !isUsableToken(session.token)) return null;
          login(session.user, session.token);
          return session.token;
        })
        .catch(() => null)
        .finally(() => {
          refreshing.current = null;
        });
    }
    return refreshing.current;
  }, [token, login]);

  useEffect(() => {
    const interceptor = axios.interceptors.request.use(attachApiToken);
    let active = true;
    let stored: string | null = null;
    try {
      stored = localStorage.getItem("token");
    } catch {
      /* Storage unavailable. */
    }
    const headers: HeadersInit = isUsableToken(stored)
      ? { Authorization: `Bearer ${stored}` }
      : {};
    fetch("/api/auth/session", { headers })
      .then(async (response) => {
        if (!active) return;
        if (response.ok) {
          const session = await response.json();
          if (active && session.user && session.token)
            login(session.user, session.token);
        } else if (response.status === 401) {
          saveSession(null, null);
        } else if (isUsableToken(stored)) {
          // Preserve an existing session through a temporary service outage.
          try {
            const cached = localStorage.getItem("user");
            if (cached) {
              setUser(JSON.parse(cached));
              setToken(stored);
            }
          } catch {
            /* Invalid cached user. */
          }
        }
      })
      .catch(() => {
        if (active && isUsableToken(stored)) {
          try {
            const cached = localStorage.getItem("user");
            if (cached) {
              setUser(JSON.parse(cached));
              setToken(stored);
            }
          } catch {
            /* Storage unavailable. */
          }
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
      axios.interceptors.request.eject(interceptor);
    };
  }, [login]);

  const value = useMemo(
    () => ({ user, isLoading, login, logout, getAuthToken }),
    [user, isLoading, login, logout, getAuthToken],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
