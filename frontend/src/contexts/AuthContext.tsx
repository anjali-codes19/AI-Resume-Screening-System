import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";

import { authApi } from "../api/client";
import type { LoginPayload, RegisterPayload, User, UserRole } from "../types";

interface AuthContextValue {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<UserRole>;
  register: (role: UserRole, payload: RegisterPayload) => Promise<UserRole>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const TOKEN_KEY = "talentlens-token";
const USER_KEY = "talentlens-user";

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(
    window.localStorage.getItem(TOKEN_KEY),
  );
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = window.localStorage.getItem(USER_KEY);
    return storedUser ? (JSON.parse(storedUser) as User) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(token));

  useEffect(() => {
    let isMounted = true;

    async function hydrateSession() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const sessionUser = await authApi.me(token);
        if (!isMounted) {
          return;
        }
        setUser(sessionUser);
        window.localStorage.setItem(USER_KEY, JSON.stringify(sessionUser));
      } catch {
        if (!isMounted) {
          return;
        }
        setToken(null);
        setUser(null);
        window.localStorage.removeItem(TOKEN_KEY);
        window.localStorage.removeItem(USER_KEY);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void hydrateSession();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const value: AuthContextValue = {
    token,
    user,
    isAuthenticated: Boolean(token && user),
    isLoading,
    async login(payload) {
      const response = await authApi.login(payload);
      setToken(response.access_token);
      setUser(response.user);
      window.localStorage.setItem(TOKEN_KEY, response.access_token);
      window.localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      return response.user.role;
    },
    async register(role, payload) {
      const response = await authApi.register(role, payload);
      setToken(response.access_token);
      setUser(response.user);
      window.localStorage.setItem(TOKEN_KEY, response.access_token);
      window.localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      return response.user.role;
    },
    logout() {
      setToken(null);
      setUser(null);
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(USER_KEY);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
