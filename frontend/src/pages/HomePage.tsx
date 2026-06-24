/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArrowRight, CalendarDays, Filter, GitBranch, GitPullRequest, MapPin, ShieldAlert, UserPlus, Vote } from 'lucide-react';
import { useAuth } from '../auth';
import { useOPCycle } from '../hooks';
import type { OPCycle } from '../types';

interface FlowHomeProps {
  setPath: (path: string) => void;
}

export function FlowHome({ setPath }: FlowHomeProps) {
  const { citizen, isAuthenticated, openAuthModal } = useAuth();
  const { currentCycle, status } = useOPCycle();

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
                Orçamento participativo
              </p>
              <CycleCard cycle={currentCycle} status={status} />
              <div className="space-y-2">
                <QuickAction
                  icon={MapPin}
                  label="Abrir esteira"
                  description="Registrar e acompanhar demandas"
                  onClick={() => setPath('/demandas')}
                  color="blue"
                />
                <QuickAction
                  icon={Vote}
                  label="Votações do OP"
                  description="Priorize propostas aptas"
                  onClick={() => setPath('/votacoes')}
                  color="purple"
                />
                <QuickAction
                  icon={GitPullRequest}
                  label="Fiscalizar execução"
                  description="Acompanhe o que foi aprovado"
                  onClick={() => setPath('/fiscalizacao')}
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
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPath('/filtros')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-2 py-2 text-xs font-semibold text-[var(--color-git-muted)] transition hover:text-white"
                >
                  <Filter className="h-3.5 w-3.5" />
                  Filtros
                </button>
                <button
                  onClick={() => setPath('/incidentes')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-2 py-2 text-xs font-semibold text-[var(--color-git-muted)] transition hover:text-white"
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Divergências
                </button>
              </div>
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
                  <GitBranch className="h-7 w-7 text-[var(--color-git-blue)]" />
                </div>
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--color-git-blue)]">
                  Código Público
                </p>
                <h1 className="mt-2 font-display text-2xl font-bold leading-tight text-white">
                  Orçamento<br />em código aberto
                </h1>
              </div>

              {/* Descrição */}
              <p className="text-sm leading-6 text-[var(--color-git-muted)] text-center mb-6">
                Abra demandas do seu território, acompanhe a esteira das propostas, vote nas prioridades e fiscalize a execução do orçamento participativo.
              </p>

              <CycleCard cycle={currentCycle} status={status} />

              {/* Features resumidas */}
              <div className="space-y-2.5 mb-7">
                <Feature label="Um conselho territorial colegiado organiza cada território" />
                <Feature label="Demandas simples caminham por uma esteira pública antes da votação" />
                <Feature label="Envelope público separa piso territorial e carência" />
                <Feature label="Execução aprovada vira item fiscalizável" />
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
                onClick={() => setPath('/demandas')}
                className="mt-4 w-full text-center text-xs text-[var(--color-git-muted)] hover:text-[var(--color-git-text2)] transition underline-offset-2 hover:underline"
              >
                Explorar a esteira sem criar conta
              </button>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPath('/filtros')}
                  className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-[var(--color-git-muted)] transition hover:text-[var(--color-git-text2)]"
                >
                  <Filter className="h-3.5 w-3.5" />
                  Filtros
                </button>
                <button
                  onClick={() => setPath('/incidentes')}
                  className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-[var(--color-git-muted)] transition hover:text-[var(--color-git-text2)]"
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Divergências
                </button>
              </div>
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
  icon: typeof MapPin;
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

function CycleCard({
  cycle,
  status
}: {
  cycle?: OPCycle;
  status: 'loading' | 'ready' | 'empty' | 'fallback';
}) {
  const stateLabel = (() => {
    if (status === 'loading') return 'Carregando ciclo';
    if (status === 'fallback') return 'API indisponível';
    if (!cycle) return 'Sem ciclo ativo';
    return cycle.phase;
  })();

  return (
    <div className="mb-4 rounded-2xl border border-[var(--color-git-border2)] bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-[var(--color-git-blue)]">
            Ciclo atual do OP
          </p>
          <h2 className="mt-1 truncate text-sm font-bold text-white">
            {cycle?.label ?? 'Aguardando abertura institucional'}
          </h2>
        </div>
        <span className="shrink-0 rounded-full border border-[rgba(56,189,248,0.2)] bg-[rgba(56,189,248,0.08)] px-2 py-1 text-[10px] font-semibold text-[var(--color-git-blue)]">
          {stateLabel}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <CycleMetric
          icon={CalendarDays}
          label="Votação"
          value={cycle?.calendar ? formatDate(cycle.calendar.votingStart) : 'A definir'}
        />
        <CycleMetric
          icon={GitBranch}
          label="Envelope"
          value={cycle ? formatCurrency(cycle.envelopeTotal) : 'A definir'}
        />
      </div>
    </div>
  );
}

function CycleMetric({
  icon: Icon,
  label,
  value
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-[var(--color-git-border)] bg-black/10 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-git-muted)]">
        <Icon className="h-3 w-3 shrink-0" />
        <span className="truncate">{label}</span>
      </div>
      <p className="mt-1 truncate text-xs font-bold text-[var(--color-git-text2)]">{value}</p>
    </div>
  );
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  }).format(cents / 100);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(value));
}

function Feature({ label }: { label: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-git-blue)] shadow-[0_0_6px_rgba(56,189,248,0.6)]" />
      <p className="text-xs leading-5 text-[var(--color-git-text2)]">{label}</p>
    </div>
  );
}
