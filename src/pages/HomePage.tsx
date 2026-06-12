/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArrowRight, BookOpen, GitPullRequest, Scale, UserPlus, Vote } from 'lucide-react';
import { useAuth } from '../auth';

interface FlowHomeProps {
  setPath: (path: string) => void;
}

export function FlowHome({ setPath }: FlowHomeProps) {
  const { citizen, isAuthenticated, openAuthModal } = useAuth();

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-2 py-8 fade-in">
      <div className="w-full max-w-sm">

        {isAuthenticated && citizen ? (
          /* ── Estado: Logado ── */
          <div className="glass-panel rounded-[24px] overflow-hidden">
            {/* Faixa de status */}
            <div className="h-1 w-full bg-gradient-to-r from-[var(--color-git-blue)] via-[var(--color-git-purple)] to-[var(--color-git-green)]" />

            <div className="px-6 pt-6 pb-5">
              {/* Avatar e saudação */}
              <div className="flex items-center gap-4 mb-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-git-blue)] to-[var(--color-git-purple)] text-[#04060d] font-bold text-lg shadow-[0_0_20px_rgba(56,189,248,0.35)]">
                  {citizen.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-[var(--color-git-muted)]">
                    Cidadão autenticado
                  </p>
                  <p className="mt-0.5 truncate text-base font-bold text-white leading-snug">
                    {citizen.fullName}
                  </p>
                  {citizen.territoryName && (
                    <p className="mt-0.5 text-xs text-[var(--color-git-muted)]">
                      {citizen.territoryName}
                    </p>
                  )}
                </div>
              </div>

              {/* Divisor */}
              <div className="border-t border-[var(--color-git-border)] mb-5" />

              {/* Ações rápidas */}
              <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-[var(--color-git-muted)] mb-3">
                Por onde começar
              </p>
              <div className="space-y-2">
                <QuickAction
                  icon={Scale}
                  label="Lei Orgânica"
                  description="Leia e acompanhe o texto vigente"
                  onClick={() => setPath('/repositorios/lei-organica/texto')}
                  color="blue"
                />
                <QuickAction
                  icon={Vote}
                  label="Votações abertas"
                  description="Sua voz nas consultas populares"
                  onClick={() => setPath('/votacoes')}
                  color="purple"
                />
                <QuickAction
                  icon={GitPullRequest}
                  label="Propostas (PRs)"
                  description="Acompanhe e vote em propostas"
                  onClick={() => setPath('/repositorios/lei-organica/prs')}
                  color="green"
                />
              </div>

              {/* Minha área */}
              <button
                onClick={() => setPath('/minha-area')}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-git-border2)] bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-[var(--color-git-text2)] transition hover:border-[var(--color-git-blue)] hover:text-white"
              >
                Ver minha área
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* ── Estado: Não logado ── */
          <div className="glass-panel rounded-[24px] overflow-hidden">
            {/* Faixa de status */}
            <div className="h-1 w-full bg-gradient-to-r from-[var(--color-git-blue)] via-[var(--color-git-purple)] to-[var(--color-git-green)]" />

            <div className="px-6 pt-8 pb-6">
              {/* Marca */}
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(56,189,248,0.25)] bg-[rgba(56,189,248,0.08)] shadow-[0_0_30px_rgba(56,189,248,0.15)]">
                  <BookOpen className="h-7 w-7 text-[var(--color-git-blue)]" />
                </div>
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--color-git-blue)]">
                  Código Público
                </p>
                <h1 className="mt-2 font-display text-2xl font-bold leading-tight text-white">
                  Democracia no<br />código aberto
                </h1>
              </div>

              {/* Descrição */}
              <p className="text-sm leading-6 text-[var(--color-git-muted)] text-center mb-6">
                Acompanhe a Lei Orgânica, participe de votações populares e proponha alterações normativas — tudo com transparência e rastreabilidade.
              </p>

              {/* Features resumidas */}
              <div className="space-y-2.5 mb-7">
                <Feature label="Leia e acompanhe o texto oficial das leis municipais" />
                <Feature label="Vote em consultas populares com recibo verificável" />
                <Feature label="Crie ou apoie propostas de alteração normativa" />
                <Feature label="Fiscalize a execução das leis aprovadas" />
              </div>

              {/* CTAs */}
              <div className="space-y-3">
                <button
                  onClick={openAuthModal}
                  className="btn-primary w-full py-3 text-sm font-bold"
                >
                  <UserPlus className="h-4 w-4" />
                  Cadastrar
                </button>
                <button
                  onClick={openAuthModal}
                  className="btn-secondary w-full py-3 text-sm font-semibold"
                >
                  Já tenho conta — Entrar
                </button>
              </div>

              {/* Explorar sem login */}
              <button
                onClick={() => setPath('/repositorios')}
                className="mt-4 w-full text-center text-xs text-[var(--color-git-muted)] hover:text-[var(--color-git-text2)] transition underline-offset-2 hover:underline"
              >
                Explorar sem criar conta
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Sub-componentes ── */

function QuickAction({
  icon: Icon,
  label,
  description,
  onClick,
  color
}: {
  icon: typeof Scale;
  label: string;
  description: string;
  onClick: () => void;
  color: 'blue' | 'purple' | 'green';
}) {
  const palette = {
    blue: {
      bg: 'bg-[rgba(56,189,248,0.08)] border-[rgba(56,189,248,0.18)]',
      icon: 'text-[var(--color-git-blue)]',
      hover: 'hover:border-[rgba(56,189,248,0.4)] hover:bg-[rgba(56,189,248,0.12)]'
    },
    purple: {
      bg: 'bg-[rgba(192,132,252,0.08)] border-[rgba(192,132,252,0.18)]',
      icon: 'text-[var(--color-git-purple)]',
      hover: 'hover:border-[rgba(192,132,252,0.4)] hover:bg-[rgba(192,132,252,0.12)]'
    },
    green: {
      bg: 'bg-[rgba(52,211,153,0.08)] border-[rgba(52,211,153,0.18)]',
      icon: 'text-[var(--color-git-green)]',
      hover: 'hover:border-[rgba(52,211,153,0.4)] hover:bg-[rgba(52,211,153,0.12)]'
    }
  }[color];

  return (
    <button
      onClick={onClick}
      className={`group w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${palette.bg} ${palette.hover}`}
    >
      <span className={`shrink-0 ${palette.icon}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-white leading-snug">{label}</span>
        <span className="block text-[11px] text-[var(--color-git-muted)] leading-tight mt-0.5">{description}</span>
      </span>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--color-git-muted)] transition group-hover:text-white group-hover:translate-x-0.5" />
    </button>
  );
}

function Feature({ label }: { label: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-git-blue)] shadow-[0_0_6px_rgba(56,189,248,0.6)]" />
      <p className="text-xs leading-5 text-[var(--color-git-text2)]">{label}</p>
    </div>
  );
}
