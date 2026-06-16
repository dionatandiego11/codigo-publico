/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, type ReactNode } from 'react';
import { CalendarDays, CheckCircle2, Loader2, Plus, ShieldCheck, XCircle } from 'lucide-react';
import {
  advanceOPCycle,
  cancelOPCycle,
  createOPCycle,
  getOPCycles,
  type CycleConfigData
} from '../lib/api';
import { useToast } from '../shared/feedback/ToastContext';
import { Badge, PageTitle, statusClass } from '../shared/ui';
import type { OPCycle, OPCyclePhase } from '../types';

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

export function CycleAdminPanel() {
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
        <ActiveCycleCard cycle={active} busy={busy} onAdvance={handleAdvance} onCancel={handleCancel} />
      ) : (
        <CreateCycleForm busy={busy} onCreate={handleCreate} />
      )}

      {cycles && cycles.length > 0 && <CycleHistory cycles={cycles} />}
    </div>
  );
}

function ActiveCycleCard({
  cycle,
  busy,
  onAdvance,
  onCancel
}: {
  cycle: OPCycle;
  busy: boolean;
  onAdvance: (cycle: OPCycle) => void;
  onCancel: (cycle: OPCycle, reason: string) => void;
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
            Configure início e prazo da LOA antes de abrir o ciclo (recrie com as datas, ou o avanço será recusado).
          </p>
        )}

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
