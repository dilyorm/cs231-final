import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAdmin: boolean;
  isContributor: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("cs231_token"));
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem("cs231_user");
    return raw ? JSON.parse(raw) : null;
  });

  function login(newToken: string, newUser: User) {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("cs231_token", newToken);
    localStorage.setItem("cs231_user", JSON.stringify(newUser));
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem("cs231_token");
    localStorage.removeItem("cs231_user");
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAdmin: user?.role === "admin",
        isContributor: user?.role === "admin" || user?.role === "contributor",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
