import { LogIn, LogOut } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import LoginModal from '../auth/LoginModal';
import type { CycleConfig } from '../shared/domain/types';
import {
  type AppView,
  profileLabel,
  userProfile,
  visibleNavItems,
} from './navigation';

interface AppShellProps {
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  cycle: CycleConfig;
  children: ReactNode;
}

export default function AppShell({ activeView, setActiveView, cycle, children }: AppShellProps) {
  const { adminContext, isAuthenticated, logout, user } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const profile = userProfile(user?.role, adminContext);
  const navItems = visibleNavItems(profile);

  return (
    <div className="min-h-screen bg-[#f5f7f6] text-slate-900" id="app-root">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <button
            className="flex min-w-0 items-center gap-3 text-left"
            onClick={() => setActiveView('inicio')}
            aria-label="Ir para o início"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center bg-emerald-700 text-sm font-bold text-white">CP</span>
            <span className="min-w-0">
              <strong className="block truncate font-display text-sm font-bold text-slate-950">Código Público</strong>
              <span className="block truncate text-xs text-slate-500">Demandas de Brumadinho</span>
            </span>
          </button>

          <div className="flex items-center gap-3">
            <div className="hidden text-right md:block">
              <span className="block text-xs font-semibold text-slate-800">{cycle.nome}</span>
              <span className="block text-[11px] text-slate-500">Ciclo em andamento</span>
            </div>
            {isAuthenticated ? (
              <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                <button
                  onClick={() => setActiveView('usuario')}
                  className="hidden max-w-44 text-right sm:block hover:opacity-85 text-left"
                >
                  <span className="block truncate text-xs font-semibold text-slate-800">{user?.fullName}</span>
                  <span className="block text-[11px] text-emerald-700 hover:underline">{profileLabel(profile)}</span>
                </button>
                <button
                  onClick={logout}
                  className="grid h-9 w-9 place-items-center border border-slate-300 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
                  title="Sair"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="inline-flex h-9 items-center gap-2 bg-emerald-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-800"
              >
                <LogIn className="h-4 w-4" />
                Entrar
              </button>
            )}
          </div>
        </div>

        <div className="hidden md:block border-t border-slate-100">
          <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6" aria-label="Navegação principal">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`flex h-12 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-emerald-700 text-emerald-800'
                      : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-950'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 pb-24 md:pb-8">{children}</main>

      {/* Barra de Navegação Inferior para Telas Mobile */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-40 h-16 border-t border-slate-200 bg-white/95 pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur-md md:hidden"
        aria-label="Navegação móvel inferior"
      >
        <div className="flex h-full w-full justify-around items-center px-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex flex-col items-center justify-center gap-1 w-16 h-full text-[10px] font-bold transition-all ${
                  isActive
                    ? 'text-emerald-700 scale-105'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className={`h-5 w-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
