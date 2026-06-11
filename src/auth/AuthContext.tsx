/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';
import { ApiError, tokenStorage } from '../api/client';
import {
  getMe,
  loginCitizen,
  registerCitizen,
  type RegisterCitizenData
} from '../lib/api';
import type { Citizen } from '../types';

type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

/**
 * Ação cívica adiada até o login (padrão Command): quando o cidadão
 * tenta escrever sem sessão, a ação fica enfileirada e é executada
 * automaticamente assim que a autenticação é concluída.
 */
type PendingAction = (citizen: Citizen) => void;

interface AuthContextValue {
  citizen: Citizen | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  login: (cpf: string, birthDate: string) => Promise<Citizen>;
  register: (data: RegisterCitizenData) => Promise<Citizen>;
  logout: () => void;
  requireAuth: (action: PendingAction) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [citizen, setCitizen] = useState<Citizen | null>(null);
  const [status, setStatus] = useState<AuthStatus>(() =>
    tokenStorage.get() ? 'loading' : 'anonymous'
  );
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const pendingActionRef = useRef<PendingAction | null>(null);

  // Restaura a sessão a partir do token persistido.
  useEffect(() => {
    if (!tokenStorage.get()) return;

    let isMounted = true;

    getMe()
      .then(me => {
        if (!isMounted) return;
        setCitizen(me);
        setStatus('authenticated');
      })
      .catch(error => {
        if (!isMounted) return;
        if (error instanceof ApiError && error.status === 401) {
          tokenStorage.clear();
        }
        setStatus('anonymous');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const completeAuthentication = useCallback((token: string, authenticated: Citizen) => {
    tokenStorage.set(token);
    setCitizen(authenticated);
    setStatus('authenticated');
    setAuthModalOpen(false);

    const pending = pendingActionRef.current;
    pendingActionRef.current = null;
    if (pending) {
      pending(authenticated);
    }
  }, []);

  const login = useCallback(async (cpf: string, birthDate: string) => {
    const response = await loginCitizen(cpf, birthDate);
    completeAuthentication(response.token, response.citizen);
    return response.citizen;
  }, [completeAuthentication]);

  const register = useCallback(async (data: RegisterCitizenData) => {
    const response = await registerCitizen(data);
    completeAuthentication(response.token, response.citizen);
    return response.citizen;
  }, [completeAuthentication]);

  const logout = useCallback(() => {
    tokenStorage.clear();
    pendingActionRef.current = null;
    setCitizen(null);
    setStatus('anonymous');
  }, []);

  const requireAuth = useCallback((action: PendingAction) => {
    if (citizen) {
      action(citizen);
      return;
    }

    pendingActionRef.current = action;
    setAuthModalOpen(true);
  }, [citizen]);

  const openAuthModal = useCallback(() => setAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => {
    pendingActionRef.current = null;
    setAuthModalOpen(false);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    citizen,
    status,
    isAuthenticated: citizen !== null,
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal,
    login,
    register,
    logout,
    requireAuth
  }), [citizen, status, isAuthModalOpen, openAuthModal, closeAuthModal, login, register, logout, requireAuth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de <AuthProvider>.');
  }

  return context;
}
