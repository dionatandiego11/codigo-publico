/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { AlertTriangle, CalendarDays, CheckCircle2, Gavel, Loader2, Plus, Save, ShieldCheck, XCircle } from 'lucide-react';
import {
  advanceOPCycle,
  cancelOPCycle,
  configureOPCycle,
  createOPCycle,
  getOPCycles,
  getOPCycleTerritoryEnvelopes,
  type AdminContext,
  type CycleConfigData,
  type InstitutionalDecisionData,
  type InstitutionalDecisionGround,
  type InstitutionalDecisionResult
} from '../lib/api';
import { useToast } from '../shared/feedback/ToastContext';
import { Badge, PageTitle, statusClass } from '../shared/ui';
import type { BudgetProposal, OPCycle, OPCyclePhase, OPCycleTerritoryEnvelope } from '../types';

const PHASE_ORDER: OPCyclePhase[] = [
  'Rascunho',
  'Inscrições',
  'Coleta',
  'Votação',
  'Consolidação',
  'Institucionalização',
  'Encerrado'
];

function nextPhase(phase: OPCyclePhase): OPCyclePhase | null {
  const i = PHASE_ORDER.indexOf(phase);
  return i >= 0 && i < PHASE_ORDER.length - 1 ? PHASE_ORDER[i + 1] : null;
}

function isTerminal(phase: OPCyclePhase): boolean {
  return phase === 'Encerrado' || phase === 'Cancelado';
}

export function CycleAdminPanel({
  adminContext,
  proposals,
  onDecideInstitutional,
  onViewFilters,
  onViewIncidents
}: {
  adminContext: AdminContext | null;
  proposals: BudgetProposal[];
  onDecideInstitutional: (
    proposalId: string,
    data: InstitutionalDecisionData
  ) => Promise<InstitutionalDecisionResult>;
  onViewFilters: () => void;
  onViewIncidents: () => void;
}) {
  const { pushToast } = useToast();
  const [cycles, setCycles] = useState<OPCycle[] | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    void getOPCycles()
      .then(setCycles)
      .catch(() => setCycles([]));
  };

  useEffect(refresh, []);

  const active = cycles?.find(c => !isTerminal(c.phase));

  const reject = (error: unknown) => {
    const message = error instanceof Error ? error.message : 'Falha inesperada.';
    pushToast('error', `Ação recusada: ${message}`);
  };

  const handleAdvance = (cycle: OPCycle) => {
    const next = nextPhase(cycle.phase);
    if (!next) return;
    setBusy(true);
    void advanceOPCycle(cycle.id)
      .then(updated => {
        pushToast('success', `Ciclo avançou para ${updated.phase}.`);
        refresh();
      })
      .catch(reject)
      .finally(() => setBusy(false));
  };

  const handleCancel = (cycle: OPCycle, reason: string) => {
    setBusy(true);
    void cancelOPCycle(cycle.id, reason)
      .then(() => {
        pushToast('info', 'Ciclo cancelado.');
        refresh();
      })
      .catch(reject)
      .finally(() => setBusy(false));
  };

  const handleCreate = (data: CycleConfigData) => {
    setBusy(true);
    void createOPCycle(data)
      .then(created => {
        pushToast('success', `Ciclo "${created.label}" criado em Rascunho.`);
        refresh();
      })
      .catch(reject)
      .finally(() => setBusy(false));
  };

  const handleConfigure = (cycle: OPCycle, data: CycleConfigData) => {
    setBusy(true);
    void configureOPCycle(cycle.id, data)
      .then(updated => {
        pushToast('success', `Ciclo "${updated.label}" configurado.`);
        refresh();
      })
      .catch(reject)
      .finally(() => setBusy(false));
  };

  return (
    <div className="space-y-6 fade-in">
      <PageTitle
        eyebrow="Console do OP"
        title="Ciclo do Orçamento Participativo"
        subtitle="Abertura e condução do ciclo. Ações exigem a instância geral (Legislativo / Maintainer Geral)."
      />

      {cycles === null ? (
        <div className="glass-panel flex items-center justify-center gap-2 p-8 rounded-[20px] text-sm text-[var(--color-git-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando ciclos…
        </div>
      ) : active ? (
        <ActiveCycleCard
          cycle={active}
          busy={busy}
          onAdvance={handleAdvance}
          onCancel={handleCancel}
          onConfigure={handleConfigure}
        />
      ) : (
        <CreateCycleForm busy={busy} onCreate={handleCreate} />
      )}

      {cycles && cycles.length > 0 && <CycleHistory cycles={cycles} />}
      <InstitutionalFilterPanel
        adminContext={adminContext}
        proposals={proposals}
        onDecide={onDecideInstitutional}
        onViewFilters={onViewFilters}
        onViewIncidents={onViewIncidents}
      />
    </div>
  );
}

function ActiveCycleCard({
  cycle,
  busy,
  onAdvance,
  onCancel,
  onConfigure
}: {
  cycle: OPCycle;
  busy: boolean;
  onAdvance: (cycle: OPCycle) => void;
  onCancel: (cycle: OPCycle, reason: string) => void;
  onConfigure: (cycle: OPCycle, data: CycleConfigData) => void;
}) {
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');
  const next = nextPhase(cycle.phase);
  const needsSchedule = cycle.phase === 'Rascunho' && (!cycle.startsAt || !cycle.loaDeadline);

  return (
    <div className="glass-panel rounded-[20px] overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-[var(--color-git-blue)] via-[var(--color-git-purple)] to-[var(--color-git-green)]" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-[var(--color-git-blue)]">Ciclo ativo</p>
            <h2 className="mt-1 truncate font-display text-xl font-bold text-white">{cycle.label}</h2>
          </div>
          <Badge className={statusClass(cycle.phase)}>{cycle.phase}</Badge>
        </div>

        {/* Trilho de fases */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {PHASE_ORDER.map(phase => {
            const reached = PHASE_ORDER.indexOf(phase) <= PHASE_ORDER.indexOf(cycle.phase);
            return (
              <span
                key={phase}
                className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                  reached
                    ? 'bg-[rgba(56,189,248,0.12)] text-[var(--color-git-blue)] border border-[rgba(56,189,248,0.25)]'
                    : 'bg-white/[0.02] text-[var(--color-git-muted)] border border-[var(--color-git-border)]'
                }`}
              >
                {phase}
              </span>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Metric label="Envelope" value={formatCurrency(cycle.envelopeTotal)} />
          <Metric
            label="Votação"
            value={cycle.calendar ? formatDate(cycle.calendar.votingStart) : 'A definir'}
          />
        </div>

        {needsSchedule && (
          <p className="mt-4 rounded-xl border border-[rgba(251,191,36,0.25)] bg-[rgba(251,191,36,0.06)] p-3 text-xs text-[var(--color-git-amber)]">
            Configure início e prazo da LOA antes de abrir o ciclo. Sem agenda válida, o avanço será recusado.
          </p>
        )}

        {cycle.phase === 'Rascunho' && (
          <CycleConfigForm
            cycle={cycle}
            busy={busy}
            onSubmit={data => onConfigure(cycle, data)}
          />
        )}

        <TerritoryEnvelopeBreakdown cycleId={cycle.id} refreshKey={cycle.updatedAt} />

        <div className="mt-5 flex flex-col gap-2">
          {next && (
            <button
              onClick={() => onAdvance(cycle)}
              disabled={busy}
              className="btn-primary w-full disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              {cycle.phase === 'Rascunho' ? 'Abrir ciclo' : `Avançar para ${next}`}
            </button>
          )}

          {!cancelling ? (
            <button
              onClick={() => setCancelling(true)}
              disabled={busy}
              className="btn-secondary w-full text-[var(--color-git-red)] disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" />
              Cancelar ciclo
            </button>
          ) : (
            <div className="rounded-xl border border-[var(--color-git-border2)] bg-white/[0.02] p-3 space-y-2">
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Justificativa do cancelamento (obrigatória)"
                rows={2}
                className="w-full rounded-lg border border-[var(--color-git-border2)] bg-black/20 p-2 text-xs text-white placeholder:text-[var(--color-git-muted)] focus:border-[var(--color-git-blue)] focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => onCancel(cycle, reason.trim())}
                  disabled={busy || reason.trim() === ''}
                  className="btn-secondary flex-1 text-[var(--color-git-red)] disabled:opacity-40"
                >
                  Confirmar
                </button>
                <button onClick={() => setCancelling(false)} disabled={busy} className="btn-secondary flex-1">
                  Voltar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateCycleForm({ busy, onCreate }: { busy: boolean; onCreate: (data: CycleConfigData) => void }) {
  const [label, setLabel] = useState('');
  const [envelopeReais, setEnvelopeReais] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [loaDeadline, setLoaDeadline] = useState('');

  const toISO = (date: string) => (date ? new Date(`${date}T00:00:00Z`).toISOString() : undefined);
  const canSubmit = label.trim() !== '' && envelopeReais !== '' && !busy;

  const submit = () => {
    onCreate({
      label: label.trim(),
      envelopeTotal: Math.round(Number(envelopeReais) * 100),
      startsAt: toISO(startsAt),
      loaDeadline: toISO(loaDeadline)
    });
  };

  return (
    <div className="glass-panel rounded-[20px] p-5">
      <div className="mb-4 flex items-center gap-2">
        <Plus className="h-4 w-4 text-[var(--color-git-green)]" />
        <h2 className="font-display text-base font-bold text-white">Abrir novo ciclo</h2>
      </div>
      <p className="mb-4 text-xs leading-5 text-[var(--color-git-muted)]">
        Nenhum ciclo ativo. Crie um (entra em Rascunho); informe as datas para poder abri-lo.
        O regimento usa os valores padrão (ajustáveis depois).
      </p>

      <div className="space-y-3">
        <Field label="Identificação do ciclo">
          <input
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="Ex.: OP 2026"
            className={inputClass}
          />
        </Field>
        <Field label="Envelope total (R$)">
          <input
            type="number"
            min="0"
            value={envelopeReais}
            onChange={e => setEnvelopeReais(e.target.value)}
            placeholder="Ex.: 1000000"
            className={inputClass}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Início (inscrições)">
            <input type="date" value={startsAt} onChange={e => setStartsAt(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Prazo da LOA">
            <input type="date" value={loaDeadline} onChange={e => setLoaDeadline(e.target.value)} className={inputClass} />
          </Field>
        </div>
      </div>

      <button onClick={submit} disabled={!canSubmit} className="btn-primary mt-5 w-full disabled:opacity-50">
        <ShieldCheck className="h-4 w-4" />
        Criar ciclo
      </button>
    </div>
  );
}

function CycleConfigForm({
  cycle,
  busy,
  onSubmit
}: {
  cycle: OPCycle;
  busy: boolean;
  onSubmit: (data: CycleConfigData) => void;
}) {
  const [label, setLabel] = useState(cycle.label);
  const [envelopeReais, setEnvelopeReais] = useState(String(cycle.envelopeTotal / 100));
  const [startsAt, setStartsAt] = useState(toDateInput(cycle.startsAt));
  const [loaDeadline, setLoaDeadline] = useState(toDateInput(cycle.loaDeadline));

  const canSubmit = label.trim() !== '' && envelopeReais !== '' && !busy;

  const submit = () => {
    onSubmit({
      label: label.trim(),
      regimento: cycle.regimento,
      envelopeTotal: Math.round(Number(envelopeReais) * 100),
      startsAt: toISO(startsAt),
      loaDeadline: toISO(loaDeadline)
    });
  };

  return (
    <div className="mt-4 rounded-xl border border-[var(--color-git-border2)] bg-white/[0.02] p-3">
      <div className="mb-3 flex items-center gap-2">
        <Save className="h-4 w-4 text-[var(--color-git-blue)]" />
        <h3 className="font-display text-sm font-bold text-white">Configurar rascunho</h3>
      </div>

      <div className="space-y-3">
        <Field label="Identificação">
          <input value={label} onChange={event => setLabel(event.target.value)} className={inputClass} />
        </Field>
        <Field label="Envelope total (R$)">
          <input
            type="number"
            min="0"
            value={envelopeReais}
            onChange={event => setEnvelopeReais(event.target.value)}
            className={inputClass}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Início">
            <input type="date" value={startsAt} onChange={event => setStartsAt(event.target.value)} className={inputClass} />
          </Field>
          <Field label="Prazo LOA">
            <input type="date" value={loaDeadline} onChange={event => setLoaDeadline(event.target.value)} className={inputClass} />
          </Field>
        </div>
      </div>

      <button onClick={submit} disabled={!canSubmit} className="btn-secondary btn-sm mt-4 w-full justify-center disabled:opacity-50">
        <Save className="h-4 w-4" />
        Salvar configuração
      </button>
    </div>
  );
}

function toISO(date: string) {
  return date ? new Date(`${date}T00:00:00Z`).toISOString() : undefined;
}

function toDateInput(value?: string | null) {
  return value ? value.slice(0, 10) : '';
}

function TerritoryEnvelopeBreakdown({ cycleId, refreshKey }: { cycleId: string; refreshKey: string }) {
  const [envelopes, setEnvelopes] = useState<OPCycleTerritoryEnvelope[] | null>(null);

  useEffect(() => {
    let mounted = true;
    setEnvelopes(null);

    getOPCycleTerritoryEnvelopes(cycleId)
      .then(items => {
        if (mounted) setEnvelopes(items);
      })
      .catch(error => {
        console.warn('Não foi possível carregar sub-envelopes territoriais.', error);
        if (mounted) setEnvelopes([]);
      });

    return () => {
      mounted = false;
    };
  }, [cycleId, refreshKey]);

  return (
    <section className="mt-4 rounded-xl border border-[var(--color-git-border2)] bg-white/[0.02] p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-[var(--color-git-green)]">
            Sub-envelope territorial
          </p>
          <h3 className="mt-1 text-sm font-bold text-white">Divisão congelada do ciclo</h3>
        </div>
        {envelopes === null && <Loader2 className="h-4 w-4 animate-spin text-[var(--color-git-muted)]" />}
      </div>

      {envelopes !== null && envelopes.length === 0 ? (
        <p className="text-xs leading-5 text-[var(--color-git-muted)]">
          Configure um envelope positivo para gerar a divisão territorial.
        </p>
      ) : (
        <div className="space-y-2">
          {(envelopes ?? []).map(envelope => (
            <div
              key={envelope.territoryId}
              className="rounded-lg border border-[var(--color-git-border)] bg-black/10 p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-bold text-white">{envelope.territoryName}</p>
                <p className="shrink-0 font-mono text-xs font-bold text-[var(--color-git-green)]">
                  {formatCurrency(envelope.total)}
                </p>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] text-[var(--color-git-muted)]">
                <span>Piso {formatCurrency(envelope.equal)}</span>
                <span>Carência {formatCurrency(envelope.carencia)}</span>
                <span>Peso {envelope.carenciaWeight}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function CycleHistory({ cycles }: { cycles: OPCycle[] }) {
  return (
    <div className="glass-panel rounded-[20px] p-5">
      <h3 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--color-git-muted)]">
        Histórico de ciclos
      </h3>
      <div className="space-y-2">
        {cycles.map(cycle => (
          <div
            key={cycle.id}
            className="flex items-center justify-between gap-2 rounded-xl border border-[var(--color-git-border)] bg-white/[0.02] px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{cycle.label}</p>
              <p className="font-mono text-[10px] text-[var(--color-git-muted)]">{formatCurrency(cycle.envelopeTotal)}</p>
            </div>
            <Badge className={statusClass(cycle.phase)}>{cycle.phase}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

type DecisionMode = 'admit' | 'filter' | 'veto';

interface DecisionDraft {
  mode: DecisionMode;
  ground: InstitutionalDecisionGround;
  reason: string;
}

const FORMAL_GROUNDS: Array<{ value: InstitutionalDecisionGround; label: string }> = [
  { value: 'inconstitucional', label: 'Inconstitucional' },
  { value: 'fora_da_competencia', label: 'Fora da competência municipal' },
  { value: 'sem_fonte_de_custeio', label: 'Sem fonte de custeio' },
  { value: 'excede_envelope', label: 'Excede o envelope do ciclo' },
  { value: 'depende_de_outro_ente', label: 'Depende de outro ente federativo' }
];

const DEFAULT_DRAFT: DecisionDraft = { mode: 'admit', ground: '', reason: '' };

function InstitutionalFilterPanel({
  adminContext,
  proposals,
  onDecide,
  onViewFilters,
  onViewIncidents
}: {
  adminContext: AdminContext | null;
  proposals: BudgetProposal[];
  onDecide: (proposalId: string, data: InstitutionalDecisionData) => Promise<InstitutionalDecisionResult>;
  onViewFilters: () => void;
  onViewIncidents: () => void;
}) {
  const { pushToast } = useToast();
  const [drafts, setDrafts] = useState<Record<string, DecisionDraft>>({});
  const [busyProposalId, setBusyProposalId] = useState<string | null>(null);
  const prioritized = proposals.filter(proposal => proposal.status === 'Priorizada');
  const canDecide = Boolean(adminContext?.canGeneral);

  const draftFor = (proposalId: string) => drafts[proposalId] ?? DEFAULT_DRAFT;
  const patchDraft = (proposalId: string, patch: Partial<DecisionDraft>) => {
    setDrafts(prev => ({ ...prev, [proposalId]: { ...draftFor(proposalId), ...patch } }));
  };

  const submit = (event: FormEvent, proposal: BudgetProposal) => {
    event.preventDefault();
    const draft = draftFor(proposal.id);
    const reason = draft.reason.trim();
    if (!canDecide || !reason) return;
    if (draft.mode === 'filter' && !draft.ground) return;

    const data: InstitutionalDecisionData = {
      approve: draft.mode === 'admit',
      ground: draft.mode === 'filter' ? draft.ground : '',
      reason
    };

    setBusyProposalId(proposal.id);
    void onDecide(proposal.id, data)
      .then(result => {
        const incident = result.incidentId ? ` Incidente ${result.incidentId} registrado.` : '';
        pushToast(result.incidentId ? 'warning' : 'success', `${result.message}.${incident}`);
        setDrafts(prev => {
          const next = { ...prev };
          delete next[proposal.id];
          return next;
        });
      })
      .catch(error => {
        const message = error instanceof Error ? error.message : 'Falha inesperada.';
        pushToast('error', `Filtro institucional recusado: ${message}`);
      })
      .finally(() => setBusyProposalId(null));
  };

  return (
    <section className="glass-panel rounded-[20px] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="rounded-xl border border-[rgba(192,132,252,0.2)] bg-[rgba(192,132,252,0.08)] p-2">
            <Gavel className="h-4 w-4 text-[var(--color-git-purple)]" />
          </div>
          <div className="min-w-0">
            <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-[var(--color-git-purple)]">
              Filtro institucional
            </p>
            <h2 className="mt-1 font-display text-lg font-bold text-white">Matriz municipal do OP</h2>
            <p className="mt-1 text-xs leading-5 text-[var(--color-git-muted)]">
              Propostas priorizadas pela votação territorial entram aqui para cumprir o rito formal antes da matriz.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          <button onClick={onViewFilters} className="btn-secondary btn-sm">
            Filtros
          </button>
          <button onClick={onViewIncidents} className="btn-secondary btn-sm">
            Incidentes
          </button>
        </div>
      </div>

      {!canDecide && (
        <p className="mt-4 rounded-xl border border-[rgba(251,191,36,0.25)] bg-[rgba(251,191,36,0.06)] p-3 text-xs leading-5 text-[var(--color-git-amber)]">
          Esta decisão exige Maintainer Geral ou papel institucional do Legislativo.
        </p>
      )}

      <div className="mt-4 space-y-3">
        {prioritized.length === 0 && (
          <p className="rounded-xl border border-[var(--color-git-border)] bg-white/[0.02] p-4 text-sm leading-6 text-[var(--color-git-muted)]">
            Nenhuma proposta priorizada aguardando filtro institucional.
          </p>
        )}

        {prioritized.map(proposal => {
          const draft = draftFor(proposal.id);
          const blocked = !canDecide || !draft.reason.trim() || (draft.mode === 'filter' && !draft.ground);
          const busy = busyProposalId === proposal.id;

          return (
            <article key={proposal.id} className="rounded-xl border border-[var(--color-git-border)] bg-white/[0.02] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="chip-purple">{proposal.id}</Badge>
                <Badge className={statusClass(proposal.status)}>{proposal.status}</Badge>
                <Badge className="chip-blue">{proposal.territoryName}</Badge>
              </div>
              <h3 className="mt-2 text-sm font-bold text-white">{proposal.title}</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--color-git-muted)]">{proposal.solutionScope}</p>
              <p className="mt-2 font-mono text-[10px] text-[var(--color-git-muted)]">
                {formatCurrency(proposal.estimatedCostCents)}
              </p>

              <form onSubmit={event => submit(event, proposal)} className="mt-4 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <DecisionModeButton
                    selected={draft.mode === 'admit'}
                    onClick={() => patchDraft(proposal.id, { mode: 'admit', ground: '' })}
                  >
                    Admitir
                  </DecisionModeButton>
                  <DecisionModeButton
                    selected={draft.mode === 'filter'}
                    onClick={() => patchDraft(proposal.id, { mode: 'filter' })}
                  >
                    Devolver
                  </DecisionModeButton>
                  <DecisionModeButton
                    selected={draft.mode === 'veto'}
                    onClick={() => patchDraft(proposal.id, { mode: 'veto', ground: '' })}
                  >
                    Divergência
                  </DecisionModeButton>
                </div>

                {draft.mode === 'filter' && (
                  <select
                    value={draft.ground}
                    onChange={event => patchDraft(proposal.id, { ground: event.target.value as InstitutionalDecisionGround })}
                    className={inputClass}
                    disabled={!canDecide || busy}
                  >
                    <option value="">Fundamento formal</option>
                    {FORMAL_GROUNDS.map(ground => (
                      <option key={ground.value} value={ground.value}>{ground.label}</option>
                    ))}
                  </select>
                )}

                {draft.mode === 'veto' && (
                  <p className="flex gap-2 rounded-lg border border-[rgba(248,113,113,0.18)] bg-[rgba(248,113,113,0.05)] px-3 py-2 text-xs leading-5 text-[var(--color-git-red)]">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    Divergência institucional registra incidente público de accountability.
                  </p>
                )}

                <textarea
                  value={draft.reason}
                  onChange={event => patchDraft(proposal.id, { reason: event.target.value })}
                  placeholder="Justificativa pública obrigatória"
                  rows={3}
                  disabled={!canDecide || busy}
                  className={`${inputClass} resize-none`}
                />

                <button disabled={blocked || busy} className="btn-primary btn-sm w-full justify-center disabled:opacity-45">
                  {busy ? 'Registrando decisão…' : actionLabel(draft.mode)}
                </button>
              </form>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function DecisionModeButton({
  selected,
  onClick,
  children
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-2 py-2 text-[11px] font-bold transition ${
        selected
          ? 'border-[rgba(56,189,248,0.35)] bg-[rgba(56,189,248,0.1)] text-[var(--color-git-blue)]'
          : 'border-[var(--color-git-border2)] bg-black/10 text-[var(--color-git-muted)] hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

function actionLabel(mode: DecisionMode) {
  switch (mode) {
    case 'admit':
      return 'Admitir na matriz';
    case 'filter':
      return 'Devolver com fundamento';
    case 'veto':
      return 'Registrar divergência';
  }
}

const inputClass =
  'w-full rounded-lg border border-[var(--color-git-border2)] bg-black/20 px-3 py-2 text-sm text-white placeholder:text-[var(--color-git-muted)] focus:border-[var(--color-git-blue)] focus:outline-none';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--color-git-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-git-border)] bg-black/10 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-git-muted)]">
        <CalendarDays className="h-3 w-3 shrink-0" />
        <span className="truncate">{label}</span>
      </div>
      <p className="mt-1 truncate text-xs font-bold text-[var(--color-git-text2)]">{value}</p>
    </div>
  );
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(cents / 100);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value));
}
