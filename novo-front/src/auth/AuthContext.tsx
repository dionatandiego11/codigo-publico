import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, tokenStorage } from '../shared/api/client';

export interface Citizen {
  id: string;
  fullName: string;
  territoryId?: string;
  territoryName?: string;
  role?: string;
}

export interface AdminContext {
  citizenId: string;
  fullName: string;
  role: string;
  roleLabel: string;
  levels: Array<'technical' | 'general' | 'territorial'>;
  canTechnical: boolean;
  canGeneral: boolean;
  canTerritorial: boolean;
  canManageAllTerritories: boolean;
  registeredTerritoryId?: string;
  registeredTerritoryName?: string;
}

interface AuthContextType {
  token: string | null;
  user: Citizen | null;
  adminContext: AdminContext | null;
  login: (cpf: string, password?: string, birthDate?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(tokenStorage.get());
  const [user, setUser] = useState<Citizen | null>(null);
  const [adminContext, setAdminContext] = useState<AdminContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      tokenStorage.set(token);
      void fetchSession();
    } else {
      tokenStorage.clear();
      setUser(null);
      setAdminContext(null);
      setIsLoading(false);
    }
  }, [token]);

  const fetchSession = async () => {
    try {
      const citizen = await api.get<Citizen>('/me');
      setUser(citizen);
      try {
        setAdminContext(await api.get<AdminContext>('/me/admin-context'));
      } catch {
        setAdminContext(null);
      }
    } catch (error) {
      console.error('Não foi possível carregar a sessão:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (cpf: string, password?: string, birthDate?: string) => {
    const payload: Record<string, string> = { cpf: cpf.replace(/\D/g, '') };
    if (password) payload.password = password;
    if (birthDate) payload.birthDate = birthDate;

    const data = await api.post<{ token: string; citizen: Citizen }>('/auth/login', payload);
    setUser(data.citizen);
    setToken(data.token);
  };

  const logout = () => {
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, adminContext, login, logout, isAuthenticated: Boolean(token), isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
