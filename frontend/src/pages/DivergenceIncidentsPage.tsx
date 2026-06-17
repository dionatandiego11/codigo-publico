/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AlertTriangle, ArrowRight, FileWarning, Gavel, Loader2, RefreshCw, ShieldAlert } from 'lucide-react';
import { useDivergenceIncidents } from '../hooks';
import { Badge, formatDate, PageTitle } from '../shared/ui';
import type { OPDivergenceIncident } from '../types';

export function DivergenceIncidentsPage({
  onGoProposals
}: {
  onGoProposals: () => void;
}) {
  const { incidents, status, refresh } = useDivergenceIncidents();
  const territoriesCount = new Set(incidents.map(incident => incident.territoryName)).size;

  return (
    <div className="space-y-5 fade-in">
      <PageTitle
        eyebrow="Transparência institucional"
        title="Divergências do OP"
        subtitle="Quando uma proposta priorizada pela população não avança por decisão política, o sistema registra o motivo publicamente."
      />

      <section className="glass-panel rounded-[20px] p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl border border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.08)] p-2">
            <ShieldAlert className="h-4 w-4 text-[var(--color-git-red)]" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-base font-bold text-white">Veto visível</h2>
            <p className="mt-1 text-xs leading-5 text-[var(--color-git-muted)]">
              O Legislativo pode divergir do resultado territorial, mas a divergência precisa deixar rastro: proposta, território, motivo, responsável e data.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Metric label="Incidentes" value={incidents.length} />
          <Metric label="Territórios" value={territoriesCount} />
        </div>
      </section>

      <section className="glass-panel rounded-[20px] overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--color-git-border)] bg-white/[0.02] p-4">
          <div className="min-w-0">
            <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-[var(--color-git-purple)]">
              Registro público
            </p>
            <h2 className="mt-1 font-display text-lg font-bold text-white">Incidentes registrados</h2>
          </div>
          <button onClick={() => void refresh()} className="btn-secondary btn-sm" title="Atualizar incidentes">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {status === 'loading' ? (
          <div className="flex items-center justify-center gap-2 p-8 text-sm text-[var(--color-git-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando incidentes…
          </div>
        ) : status === 'error' ? (
          <EmptyState
            icon={AlertTriangle}
            title="Não foi possível carregar"
            description="A API não respondeu ao registro de divergências. Tente atualizar em instantes."
          />
        ) : incidents.length === 0 ? (
          <EmptyState
            icon={FileWarning}
            title="Nenhuma divergência registrada"
            description="Quando houver veto político sobre proposta priorizada, ele aparecerá aqui."
          />
        ) : (
          <div className="divide-y divide-[var(--color-git-border)]">
            {incidents.map(incident => (
              <IncidentCard key={incident.id} incident={incident} />
            ))}
          </div>
        )}
      </section>

      <button
        onClick={onGoProposals}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-git-border2)] bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-[var(--color-git-text2)] transition hover:border-[var(--color-git-blue)] hover:text-white"
      >
        Ver propostas do OP
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function IncidentCard({ incident }: { incident: OPDivergenceIncident }) {
  return (
    <article className="p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="border border-[rgba(248,113,113,0.22)] bg-[rgba(248,113,113,0.08)] text-[var(--color-git-red)]">
          {incident.id}
        </Badge>
        <Badge className="chip-blue">{incident.territoryName}</Badge>
        <span className="font-mono text-[10px] font-bold text-[var(--color-git-muted)]">{incident.proposalId}</span>
      </div>

      <h3 className="mt-3 text-sm font-bold leading-snug text-white">{incident.proposalTitle}</h3>

      <div className="mt-3 rounded-xl border border-[rgba(248,113,113,0.18)] bg-[rgba(248,113,113,0.05)] p-3">
        <div className="flex items-start gap-2">
          <Gavel className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-git-red)]" />
          <p className="text-sm leading-6 text-[var(--color-git-text2)]">{incident.reason}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Info label="Responsável" value={incident.decidedByName} />
        <Info label="Papel" value={roleLabel(incident.decidedByRole)} />
      </div>

      <p className="mt-3 font-mono text-[10px] text-[var(--color-git-muted)]">
        Registrado em {formatDate(incident.createdAt)}
      </p>
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
      <p className="mt-1 truncate text-xs font-semibold text-[var(--color-git-text2)]">{value || 'Não informado'}</p>
    </div>
  );
}

function roleLabel(role: string) {
  if (role === 'sysadmin') return 'Maintainer técnico';
  if (role === 'legislative') return 'Maintainer geral';
  if (role === 'territorial_maintainer') return 'Maintainer territorial';
  return role || 'Institucional';
}
