import React, { createContext, useContext, useState, useEffect } from "react";
import { api, tokenStorage } from "../services/api";

export interface Citizen {
  id: string;
  fullName: string;
  territoryId?: string;
  territoryName?: string;
  role?: string;
}

interface AuthContextType {
  token: string | null;
  user: Citizen | null;
  login: (cpf: string, password?: string, birthDate?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(tokenStorage.get());
  const [user, setUser] = useState<Citizen | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      tokenStorage.set(token);
      fetchMe();
    } else {
      tokenStorage.clear();
      setUser(null);
      setIsLoading(false);
    }
  }, [token]);

  const fetchMe = async () => {
    try {
      // The backend /me endpoint might return just the citizen data directly or nested.
      const data = await api.get<Citizen>("/me");
      setUser(data);
    } catch (error) {
      console.error("Failed to fetch user:", error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (cpf: string, password?: string, birthDate?: string) => {
    const payload: any = { cpf: cpf.replace(/\D/g, "") };
    if (password) payload.password = password;
    if (birthDate) payload.birthDate = birthDate;

    const data = await api.post<{ token: string; citizen: Citizen }>("/auth/login", payload);
    setUser(data.citizen);
    setToken(data.token);
  };

  const logout = () => {
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
