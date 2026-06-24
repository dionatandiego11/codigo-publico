/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, type FormEvent } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, FileWarning, Filter, Loader2, RefreshCw, Route, Send, XCircle } from 'lucide-react';
import { useAuth } from '../auth';
import { useAdminContext, useBudgetFilters } from '../hooks';
import { appealBudgetFilter, decideBudgetFilterAppeal } from '../lib/api';
import { useToast } from '../shared/feedback/ToastContext';
import { Badge, formatDate, PageTitle, statusClass } from '../shared/ui';
import type { BudgetFilter } from '../types';

export function BudgetFiltersPage({
  onGoDemands
}: {
  onGoDemands: () => void;
}) {
  const { isAuthenticated, openAuthModal } = useAuth();
  const { adminContext } = useAdminContext(isAuthenticated);
  const { pushToast } = useToast();
  const { filters, status, refresh } = useBudgetFilters();
  const territoriesCount = new Set(filters.map(filter => filter.territoryName)).size;
  const totalBlocked = filters.length;
  const canDecideAppeals = Boolean(adminContext?.canGeneral);

  const handleAppeal = (filter: BudgetFilter, reason: string) => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    void appealBudgetFilter(filter.id, reason)
      .then(appeal => {
        pushToast('success', `Recurso ${appeal.id} registrado.`);
        void refresh();
      })
      .catch(error => {
        const message = error instanceof Error ? error.message : 'Falha inesperada.';
        pushToast('error', `Recurso recusado: ${message}`);
      });
  };

  const handleDecideAppeal = async (filter: BudgetFilter, approve: boolean, reason: string) => {
    if (!filter.appealId) {
      pushToast('error', 'Este filtro não possui recurso associado.');
      return;
    }

    const appeal = await decideBudgetFilterAppeal(filter.appealId, { approve, reason });
    pushToast('success', approve ? `Recurso ${appeal.id} deferido.` : `Recurso ${appeal.id} indeferido.`);
    await refresh();
  };

  return (
    <div className="space-y-5 fade-in">
      <PageTitle
        eyebrow="Circuit breaker"
        title="Filtros do OP"
        subtitle="Registro público das propostas que não avançaram, com fundamento, custo, envelope e caminho de retorno."
      />

      <section className="glass-panel rounded-[20px] p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl border border-[rgba(251,191,36,0.22)] bg-[rgba(251,191,36,0.08)] p-2">
            <Filter className="h-4 w-4 text-[var(--color-git-amber)]" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-base font-bold text-white">Não é veto silencioso</h2>
            <p className="mt-1 text-xs leading-5 text-[var(--color-git-muted)]">
              Quando uma demanda trava por orçamento, competência ou legalidade, o sistema registra o motivo e indica como ela pode voltar à esteira.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Metric label="Filtros" value={totalBlocked} />
          <Metric label="Territórios" value={territoriesCount} />
        </div>
      </section>

      <section className="glass-panel rounded-[20px] overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--color-git-border)] bg-white/[0.02] p-4">
          <div className="min-w-0">
            <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-[var(--color-git-amber)]">
              Histórico público
            </p>
            <h2 className="mt-1 font-display text-lg font-bold text-white">Demandas filtradas</h2>
          </div>
          <button onClick={() => void refresh()} className="btn-secondary btn-sm" title="Atualizar filtros">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {status === 'loading' ? (
          <div className="flex items-center justify-center gap-2 p-8 text-sm text-[var(--color-git-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando filtros…
          </div>
        ) : status === 'error' ? (
          <EmptyState
            icon={AlertTriangle}
            title="Não foi possível carregar"
            description="A API não respondeu ao histórico de filtros. Tente atualizar em instantes."
          />
        ) : filters.length === 0 ? (
          <EmptyState
            icon={FileWarning}
            title="Nenhum filtro registrado"
            description="Quando o circuit breaker barrar uma proposta, o registro aparecerá aqui."
          />
        ) : (
          <div className="divide-y divide-[var(--color-git-border)]">
            {filters.map(filter => (
              <FilterCard
                key={filter.id}
                filter={filter}
                isAuthenticated={isAuthenticated}
                onLogin={openAuthModal}
                onAppeal={handleAppeal}
                canDecideAppeals={canDecideAppeals}
                onDecideAppeal={handleDecideAppeal}
              />
            ))}
          </div>
        )}
      </section>

      <button
        onClick={onGoDemands}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-git-border2)] bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-[var(--color-git-text2)] transition hover:border-[var(--color-git-blue)] hover:text-white"
      >
        Ver demandas do OP
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function FilterCard({
  filter,
  isAuthenticated,
  onLogin,
  onAppeal,
  canDecideAppeals,
  onDecideAppeal
}: {
  filter: BudgetFilter;
  isAuthenticated: boolean;
  onLogin: () => void;
  onAppeal: (filter: BudgetFilter, reason: string) => void;
  canDecideAppeals: boolean;
  onDecideAppeal: (filter: BudgetFilter, approve: boolean, reason: string) => Promise<void>;
}) {
  const [appealing, setAppealing] = useState(false);
  const [reason, setReason] = useState('');
  const [decisionMode, setDecisionMode] = useState<'approve' | 'reject' | null>(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);
  const [decisionError, setDecisionError] = useState('');
  const canSubmit = reason.trim().length >= 10;
  const canAppeal = !filter.appealId && filter.status !== 'Superado';
  const hasOpenAppeal = filter.appealStatus === 'Aberto' || filter.status === 'Em recurso';
  const canSubmitDecision = Boolean(decisionMode) && decisionReason.trim().length >= 10 && !decisionSubmitting;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit || !canAppeal) return;
    onAppeal(filter, reason.trim());
    setReason('');
    setAppealing(false);
  };

  const submitDecision = (event: FormEvent) => {
    event.preventDefault();
    if (!decisionMode || !canSubmitDecision) return;

    setDecisionSubmitting(true);
    setDecisionError('');
    void onDecideAppeal(filter, decisionMode === 'approve', decisionReason.trim())
      .then(() => {
        setDecisionMode(null);
        setDecisionReason('');
      })
      .catch(error => {
        const message = error instanceof Error ? error.message : 'Falha inesperada.';
        setDecisionError(message);
      })
      .finally(() => setDecisionSubmitting(false));
  };

  return (
    <article className="p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="border border-[rgba(251,191,36,0.22)] bg-[rgba(251,191,36,0.08)] text-[var(--color-git-amber)]">
          {filter.id}
        </Badge>
        <Badge className="chip-blue">{filter.territoryName}</Badge>
        <Badge className={statusClass(filter.status)}>{filter.status}</Badge>
      </div>

      <h3 className="mt-3 text-sm font-bold leading-snug text-white">{filter.demandTitle || filter.demandId}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--color-git-muted)]">{filter.message}</p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Info label="Custo estimado" value={formatCurrency(filter.estimatedCostCents)} />
        <Info label="Envelope disponível" value={formatCurrency(filter.availableCents)} />
      </div>

      <div className="mt-3 rounded-xl border border-[rgba(56,189,248,0.16)] bg-[rgba(56,189,248,0.05)] p-3">
        <div className="flex items-start gap-2">
          <Route className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-git-blue)]" />
          <div className="min-w-0">
            <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--color-git-blue)]">
              Caminho de retorno
            </p>
            <p className="mt-1 text-sm leading-5 text-[var(--color-git-text2)]">{returnPathLabel(filter.returnPath)}</p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-[10px] text-[var(--color-git-muted)]">
        <span>{verdictLabel(filter.verdict)}</span>
        <span>{formatDate(filter.createdAt)}</span>
      </div>

      {filter.appealNote && (
        <div className="mt-3 rounded-xl border border-[rgba(251,191,36,0.18)] bg-[rgba(251,191,36,0.05)] p-3">
          <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--color-git-amber)]">
            {filter.appealStatus ? `Recurso ${filter.appealStatus.toLowerCase()}` : 'Recurso aberto'}
          </p>
          <p className="mt-1 text-sm leading-5 text-[var(--color-git-text2)]">{filter.appealNote}</p>
        </div>
      )}

      {filter.appealDecisionReason && (
        <div className="mt-3 rounded-xl border border-[rgba(34,197,94,0.18)] bg-[rgba(34,197,94,0.05)] p-3">
          <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--color-git-green)]">
            Decisão do recurso
          </p>
          <p className="mt-1 text-sm leading-5 text-[var(--color-git-text2)]">{filter.appealDecisionReason}</p>
          {filter.appealDecidedAt && (
            <p className="mt-2 text-[10px] text-[var(--color-git-muted)]">{formatDate(filter.appealDecidedAt)}</p>
          )}
        </div>
      )}

      {canDecideAppeals && hasOpenAppeal && filter.appealId && (
        <form onSubmit={submitDecision} className="mt-4 space-y-3 rounded-xl border border-[rgba(56,189,248,0.16)] bg-[rgba(56,189,248,0.04)] p-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDecisionMode('approve')}
              className={decisionMode === 'approve' ? 'btn-primary btn-sm flex-1 justify-center' : 'btn-secondary btn-sm flex-1 justify-center'}
            >
              <CheckCircle2 className="h-4 w-4" />
              Deferir recurso
            </button>
            <button
              type="button"
              onClick={() => setDecisionMode('reject')}
              className={decisionMode === 'reject' ? 'btn-primary btn-sm flex-1 justify-center' : 'btn-secondary btn-sm flex-1 justify-center'}
            >
              <XCircle className="h-4 w-4" />
              Indeferir
            </button>
          </div>

          {decisionMode && (
            <>
              <textarea
                value={decisionReason}
                onChange={event => setDecisionReason(event.target.value)}
                placeholder="Justificativa pública da instância geral"
                rows={3}
                className="w-full resize-none rounded-lg border border-[var(--color-git-border2)] bg-black/20 p-3 text-sm text-white placeholder:text-[var(--color-git-muted)] focus:border-[var(--color-git-blue)] focus:outline-none"
              />
              <div className="flex gap-2">
                <button disabled={!canSubmitDecision} className="btn-primary btn-sm flex-1 justify-center disabled:opacity-45">
                  {decisionSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Confirmar decisão
                </button>
                <button type="button" onClick={() => setDecisionMode(null)} className="btn-secondary btn-sm flex-1 justify-center">
                  Cancelar
                </button>
              </div>
              {decisionError && <p className="text-[10px] leading-4 text-[var(--color-git-red)]">{decisionError}</p>}
              {!canSubmitDecision && !decisionError && (
                <p className="text-[10px] leading-4 text-[var(--color-git-muted)]">
                  A decisão exige uma justificativa pública com ao menos 10 caracteres.
                </p>
              )}
            </>
          )}
        </form>
      )}

      {!appealing ? (
        <button
          onClick={() => (isAuthenticated ? setAppealing(true) : onLogin())}
          disabled={!canAppeal}
          className="btn-secondary btn-sm mt-4 w-full justify-center disabled:opacity-45"
        >
          <Send className="h-4 w-4" />
          {canAppeal ? 'Recorrer do filtro' : filter.status === 'Em recurso' ? 'Recurso em andamento' : 'Recurso já registrado'}
        </button>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-2 rounded-xl border border-[var(--color-git-border2)] bg-white/[0.02] p-3">
          <textarea
            value={reason}
            onChange={event => setReason(event.target.value)}
            placeholder="Explique por que o território discorda ou quais informações corrigem o filtro"
            rows={3}
            className="w-full resize-none rounded-lg border border-[var(--color-git-border2)] bg-black/20 p-3 text-sm text-white placeholder:text-[var(--color-git-muted)] focus:border-[var(--color-git-blue)] focus:outline-none"
          />
          <div className="flex gap-2">
            <button disabled={!canSubmit} className="btn-primary btn-sm flex-1 justify-center disabled:opacity-45">
              Enviar recurso
            </button>
            <button type="button" onClick={() => setAppealing(false)} className="btn-secondary btn-sm flex-1 justify-center">
              Cancelar
            </button>
          </div>
          {!canSubmit && (
            <p className="text-[10px] leading-4 text-[var(--color-git-muted)]">
              Informe ao menos 10 caracteres para registrar o recurso.
            </p>
          )}
        </form>
      )}
    </article>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description
}: {
  icon: typeof AlertTriangle;
  title: string;
  description: string;
}) {
  return (
    <div className="p-8 text-center">
      <Icon className="mx-auto h-8 w-8 text-[var(--color-git-muted)]" />
      <h3 className="mt-3 font-display text-lg font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--color-git-muted)]">{description}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[var(--color-git-border)] bg-white/[0.03] p-3">
      <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--color-git-muted)]">{label}</p>
      <p className="mt-1 text-xl font-bold text-white">{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-git-border)] bg-black/10 p-3">
      <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--color-git-muted)]">{label}</p>
      <p className="mt-1 truncate text-xs font-semibold text-[var(--color-git-text2)]">{value}</p>
    </div>
  );
}

function returnPathLabel(path: string) {
  switch (path) {
    case 'fasear':
      return 'Dividir em fases ou levar para ciclo plurianual.';
    case 'reivindicacao_externa':
      return 'Encaminhar como reivindicação externa a outro ente.';
    case 'pactuacao':
      return 'Pactuar fonte de custeio ou responsabilidade antes de prosseguir.';
    case 'reformular':
      return 'Reformular a proposta para voltar à maturação territorial.';
    default:
      return path || 'Retornar à maturação territorial.';
  }
}

function verdictLabel(verdict: string) {
  switch (verdict) {
    case 'excede_envelope':
      return 'Excede sub-envelope';
    case 'fora_da_competencia':
      return 'Fora da competência municipal';
    case 'depende_de_outro_ente':
      return 'Depende de outro ente ou fonte';
    case 'inconstitucional':
      return 'Incompatível com regra legal';
    default:
      return verdict;
  }
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  }).format(cents / 100);
}
