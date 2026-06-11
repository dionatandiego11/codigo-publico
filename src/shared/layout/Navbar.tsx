import { GitBranch, LogIn, LogOut, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '../../auth';
import { useApiHealth, type ApiHealthStatus } from '../../hooks';


interface NavbarProps {
  currentPath: string;
  setPath: (path: string) => void;
}

const healthBadge: Record<ApiHealthStatus, { label: string; className: string }> = {
  checking: { label: 'verificando', className: 'text-[var(--color-git-muted)]' },
  online: { label: 'api online', className: 'text-[var(--color-git-green)]' },
  degraded: { label: 'api degradada', className: 'text-[var(--color-git-amber)]' },
  offline: { label: 'modo local', className: 'text-[var(--color-git-red)]' }
};

export default function Navbar({ currentPath, setPath }: NavbarProps) {
  const { citizen, isAuthenticated, openAuthModal, logout } = useAuth();
  const apiHealth = useApiHealth();

  return (
    <header className="sticky top-0 z-40 glass-header px-4 py-3">
      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3">
        {/* Logo */}
        <button onClick={() => setPath('/')} className="group flex items-center gap-2.5 min-w-0 text-left">
          <div className="relative flex-shrink-0">
            <div
              className="w-8 h-8 rounded-[10px] flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
                boxShadow: '0 0 16px rgba(56,189,248,0.5), 0 4px 8px rgba(0,0,0,0.4)',
              }}
            >
              <GitBranch className="w-4 h-4 text-white" fill="white" />
            </div>
            {/* pulse ring */}
            <div
              className="absolute inset-0 rounded-[10px] animate-pulse-glow"
              style={{ boxShadow: '0 0 0 3px rgba(56,189,248,0.15)' }}
            />
          </div>
          <div>
            <h1 className="text-base font-bold leading-none tracking-tight text-[var(--color-git-text)] group-hover:gradient-text-blue transition-all">
              Código Público
            </h1>
            <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--color-git-muted)] leading-none mt-0.5">
              {healthBadge[apiHealth].label}
            </p>
          </div>
        </button>

        {/* Account pill */}
        {isAuthenticated && citizen ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPath('/minha-area')}
              className="group flex items-center gap-2 rounded-full border border-[var(--color-git-border2)] bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-[var(--color-git-text2)] transition-all duration-300 hover:border-[rgba(56,189,248,0.4)] hover:bg-[rgba(56,189,248,0.06)] hover:shadow-[0_0_16px_rgba(56,189,248,0.15)]"
            >
              <span className="status-dot status-dot-green" />
              <ShieldCheck className="h-3.5 w-3.5 text-[var(--color-git-green)] icon-glow-green" />
              <span className="max-w-[5rem] truncate">{citizen.fullName.split(' ')[0]}</span>
            </button>
            <button
               onClick={logout}
               className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-git-border2)] text-[var(--color-git-muted)] hover:border-[var(--color-git-red)] hover:text-[var(--color-git-red)]"
               title="Sair"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={openAuthModal}
            className="group flex items-center gap-2 rounded-full border border-[var(--color-git-border2)] bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-[var(--color-git-text2)] transition-all duration-300 hover:border-[rgba(56,189,248,0.4)] hover:bg-[rgba(56,189,248,0.06)] hover:shadow-[0_0_16px_rgba(56,189,248,0.15)]"
          >
            <LogIn className="h-3.5 w-3.5 text-[var(--color-git-blue)]" />
            <span>Entrar</span>
          </button>
        )}
      </div>
    </header>
  );
}
