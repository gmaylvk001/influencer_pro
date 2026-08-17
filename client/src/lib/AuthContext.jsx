import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { auth as authApi, getToken, setToken } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isImpersonating, setIsImpersonating] = useState(false);

  const refreshUser = useCallback(async () => {
    const token = getToken();
    setIsImpersonating(!!localStorage.getItem("adminToken"));
    
    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      const u = await authApi.me();
      setUser(u);
      setLoading(false);
      return u;
    } catch {
      setToken(null);
      setUser(null);
      setLoading(false);
      return null;
    }
  }, []);

  const impersonate = useCallback((token, u) => {
    const currentToken = getToken();
    if (currentToken) {
      localStorage.setItem("adminToken", currentToken);
    }
    setToken(token);
    setUser(u);
    setIsImpersonating(true);
  }, []);

  const stopImpersonating = useCallback(() => {
    const adminToken = localStorage.getItem("adminToken");
    if (adminToken) {
      setToken(adminToken);
      localStorage.removeItem("adminToken");
    }
    setIsImpersonating(false);
    refreshUser();
  }, [refreshUser]);

  const logout = useCallback(() => {
    setToken(null);
    localStorage.removeItem("adminToken");
    setIsImpersonating(false);
    setUser(null);
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const value = {
    user,
    accountType: user?.accountType ?? null,
    loading,
    isImpersonating,
    refreshUser,
    impersonate,
    stopImpersonating,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
