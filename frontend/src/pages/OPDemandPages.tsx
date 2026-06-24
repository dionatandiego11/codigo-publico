/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  ClipboardCheck,
  FileQuestion,
  GitFork,
  Hammer,
  Layers3,
  Link2,
  MapPin,
  MessageSquare,
  ScrollText,
  ThumbsUp,
  Vote
} from 'lucide-react';
import { useBudgetFilters, type ForkBudgetDemandData, type NewBudgetDemandData, type NewBudgetProposalData } from '../hooks';
import {
  canCreateDemand,
  canCreateProposal,
  canForkDemand,
  canGroupDemand,
  canSupportDemand,
  canTransitionDemand,
  type DemandTransition,
  type OPActionContext,
  type OPGate
} from '../lib/op-permissions';
import { Badge, MetricMini, NotFound, PercentBar, formatDate, statusClass } from '../shared/ui';
import type { BudgetDemand, BudgetProposal, OPVoting } from '../types';

const DEMAND_CATEGORIES = [
  'Saúde',
  'Educação',
  'Mobilidade',
  'Infraestrutura',
  'Saneamento',
  'Assistência social',
  'Cultura e esporte',
  'Segurança comunitária'
];

type PipelineStageId = 'all' | 'intake' | 'maturation' | 'ready' | 'matrix' | 'execution' | 'stalled';

interface PipelineStage {
  id: Exclude<PipelineStageId, 'all'>;
  label: string;
  shortLabel: string;
  description: string;
  statuses: BudgetDemand['status'][];
  icon: typeof CircleDashed;
  className: string;
}

const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 'intake',
    label: 'Entrada',
    shortLabel: 'Entrada',
    description: 'Demanda simples, apoio inicial e informação mínima.',
    statuses: ['Recebida', 'Engajamento inicial', 'Precisa de informações'],
    icon: CircleDashed,
    className: 'text-[var(--color-git-blue)] border-[rgba(56,189,248,0.22)] bg-[rgba(56,189,248,0.08)]'
  },
  {
    id: 'maturation',
    label: 'Maturação',
    shortLabel: 'Matura',
    description: 'Comunidade e maintainer territorial refinam o problema.',
    statuses: ['Maturação territorial', 'Validada territorialmente'],
    icon: Layers3,
    className: 'text-[var(--color-git-purple)] border-[rgba(192,132,252,0.22)] bg-[rgba(192,132,252,0.08)]'
  },
  {
    id: 'ready',
    label: 'Apta',
    shortLabel: 'Apta',
    description: 'Pronta para virar proposta e entrar na priorização.',
    statuses: ['Apta para priorização'],
    icon: ClipboardCheck,
    className: 'text-[var(--color-git-green)] border-[rgba(52,211,153,0.22)] bg-[rgba(52,211,153,0.08)]'
  },
  {
    id: 'matrix',
    label: 'Matriz',
    shortLabel: 'Matriz',
    description: 'Consolidada para o orçamento do ciclo.',
    statuses: ['Incluída na matriz orçamentária'],
    icon: CheckCircle2,
    className: 'text-[var(--color-git-teal)] border-[rgba(45,212,191,0.22)] bg-[rgba(45,212,191,0.08)]'
  },
  {
    id: 'execution',
    label: 'Execução',
    shortLabel: 'Execução',
    description: 'Aprovada e acompanhada como entrega pública.',
    statuses: ['Em execução', 'Concluída'],
    icon: Hammer,
    className: 'text-[var(--color-git-amber)] border-[rgba(251,191,36,0.22)] bg-[rgba(251,191,36,0.08)]'
  },
  {
    id: 'stalled',
    label: 'Retorno',
    shortLabel: 'Retorno',
    description: 'Agrupada, dormente ou arquivada para reorganização.',
    statuses: ['Agrupada', 'Dormente', 'Arquivada'],
    icon: FileQuestion,
    className: 'text-[var(--color-git-red)] border-[rgba(248,113,113,0.22)] bg-[rgba(248,113,113,0.08)]'
  }
];

const visiblePipelineStages = PIPELINE_STAGES.filter(stage => stage.id !== 'stalled');

export function OPDemandList({
  demands,
  onSelect
}: {
  demands: BudgetDemand[];
  onSelect: (demandId: string) => void;
}) {
  const [selectedStage, setSelectedStage] = useState<PipelineStageId>('all');
  const filteredDemands = selectedStage === 'all'
    ? demands
    : demands.filter(demand => stageForDemand(demand).id === selectedStage);
  const totalOpen = demands.filter(demand => !['Concluída', 'Arquivada', 'Agrupada'].includes(demand.status)).length;
  const readyCount = demands.filter(demand => demand.status === 'Apta para priorização').length;

  return (
    <div className="space-y-4">
      <section className="glass-panel rounded-[20px] overflow-hidden">
        <div className="border-b border-[var(--color-git-border)] bg-[rgba(255,255,255,0.02)] p-4">
          <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-[var(--color-git-blue)]">
            Esteira do OP
          </p>
          <h2 className="mt-1 font-display text-xl font-bold text-white">Demandas territoriais</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-git-muted)]">
            Acompanhe onde cada problema está na linha de produção do orçamento participativo.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 border-b border-[var(--color-git-border)] p-3">
          <PipelineMetric label="ativas" value={totalOpen} />
          <PipelineMetric label="aptas" value={readyCount} />
          <PipelineMetric label="total" value={demands.length} />
        </div>

        <div className="overflow-x-auto border-b border-[var(--color-git-border)] px-3 py-3">
          <div className="flex min-w-max gap-2">
            <StageFilterButton
              active={selectedStage === 'all'}
              label="Todas"
              count={demands.length}
              onClick={() => setSelectedStage('all')}
            />
            {PIPELINE_STAGES.map(stage => (
              <StageFilterButton
                key={stage.id}
                active={selectedStage === stage.id}
                label={stage.shortLabel}
                count={demands.filter(demand => stage.statuses.includes(demand.status)).length}
                onClick={() => setSelectedStage(stage.id)}
              />
            ))}
          </div>
        </div>

        <div className="divide-y divide-[var(--color-git-border)]">
          {filteredDemands.length === 0 && (
            <p className="p-6 text-sm leading-6 text-[var(--color-git-muted)]">
              Nenhuma demanda nesta etapa da esteira.
            </p>
          )}

          {filteredDemands.map(demand => (
            <DemandPipelineCard key={demand.id} demand={demand} onSelect={onSelect} />
          ))}
        </div>
      </section>
    </div>
  );
}

function DemandPipelineCard({
  demand,
  onSelect
}: {
  demand: BudgetDemand;
  onSelect: (demandId: string) => void;
}) {
  const stage = stageForDemand(demand);
  const StageIcon = stage.icon;

  return (
    <button
      onClick={() => onSelect(demand.id)}
      className="block w-full p-4 text-left transition hover:bg-white/5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] font-bold text-[var(--color-git-muted)]">{demand.id}</span>
            <Badge className={statusClass(demand.status)}>{demand.status}</Badge>
            <Badge className="chip-blue">{demand.territoryName}</Badge>
          </div>
          <h3 className="mt-2 text-sm font-bold leading-snug text-white">{demand.title}</h3>
        </div>
        <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${stage.className}`}>
          <StageIcon className="h-4 w-4" />
        </span>
      </div>

      {demand.description && (
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--color-git-muted)]">{demand.description}</p>
      )}

      <div className="mt-3">
        <PipelineDots status={demand.status} />
      </div>

      <div className="mt-3 rounded-xl border border-[var(--color-git-border)] bg-black/10 p-3">
        <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--color-git-muted)]">
          Próxima ação
        </p>
        <p className="mt-1 text-xs font-semibold leading-5 text-[var(--color-git-text2)]">{nextActionLabel(demand)}</p>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-[var(--color-git-muted)]">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1">
            <ThumbsUp className="h-3.5 w-3.5" />
            {demand.supports}/{demand.supportThreshold}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            {demand.comments.length}
          </span>
        </div>
        <span>{formatDate(demand.updatedAt)}</span>
      </div>
    </button>
  );
}

function PipelineMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[var(--color-git-border)] bg-black/10 p-3 text-center">
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--color-git-muted)]">{label}</p>
    </div>
  );
}

function StageFilterButton({
  active,
  label,
  count,
  onClick
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={
        active
          ? 'inline-flex items-center gap-2 rounded-full border border-[rgba(56,189,248,0.35)] bg-[rgba(56,189,248,0.12)] px-3 py-2 text-xs font-bold text-[var(--color-git-blue)]'
          : 'inline-flex items-center gap-2 rounded-full border border-[var(--color-git-border2)] bg-white/[0.03] px-3 py-2 text-xs font-semibold text-[var(--color-git-muted)] transition hover:text-white'
      }
    >
      <span>{label}</span>
      <span className="rounded-full bg-black/20 px-1.5 py-0.5 font-mono text-[9px]">{count}</span>
    </button>
  );
}

export function OPDemandComposer({
  isAuthenticated,
  currentTerritory,
  actionContext,
  onLogin,
  onSubmit
}: {
  isAuthenticated: boolean;
  currentTerritory?: { id: string; name: string; zone?: string };
  actionContext: OPActionContext;
  onLogin: () => void;
  onSubmit: (data: NewBudgetDemandData) => void;
}) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(DEMAND_CATEGORIES[0]);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const createGate = canCreateDemand(actionContext);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!createGate.enabled) return;
    if (!isAuthenticated) {
      onLogin();
      return;
    }
    if (!title.trim() || !currentTerritory?.id || !category) return;

    onSubmit({
      territoryId: currentTerritory.id,
      title: title.trim(),
      category,
      location: location.trim(),
      description: description.trim()
    });

    setTitle('');
    setLocation('');
    setDescription('');
  };

  return (
    <form onSubmit={submit} className="glass-panel p-4 rounded-[20px]">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[rgba(56,189,248,0.22)] bg-[rgba(56,189,248,0.08)] text-[var(--color-git-blue)]">
          <CircleDashed className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-[var(--color-git-blue)]">
            Entrada da esteira
          </p>
          <h3 className="mt-1 font-display text-base font-bold text-white">Registrar demanda simples</h3>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="rounded-xl border border-[var(--color-git-border)] bg-white/[0.02] p-3">
          <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-[var(--color-git-muted)]">
            Território da demanda
          </p>
          {currentTerritory ? (
            <div className="mt-1 flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-white">{currentTerritory.name}</p>
              {currentTerritory.zone && <Badge className="chip-blue">{currentTerritory.zone}</Badge>}
            </div>
          ) : (
            <p className="mt-1 text-sm leading-6 text-[var(--color-git-muted)]">
              Entre com um cadastro vinculado a bairro, comunidade ou distrito para registrar demanda territorial.
            </p>
          )}
        </div>

        <input
          value={title}
          onChange={event => setTitle(event.target.value)}
          placeholder="Ex: Falta médico no PSF do bairro"
          className="field"
        />

        <select
          value={category}
          onChange={event => setCategory(event.target.value)}
          className="field"
        >
          {DEMAND_CATEGORIES.map(option => <option key={option}>{option}</option>)}
        </select>

        <input
          value={location}
          onChange={event => setLocation(event.target.value)}
          placeholder="Local de referência, unidade ou rua"
          className="field"
        />

        <textarea
          value={description}
          onChange={event => setDescription(event.target.value)}
          placeholder="Contexto opcional: quando acontece, quem é afetado, evidências iniciais"
          rows={4}
          className="field resize-none"
        />

        <button className="btn-primary w-full disabled:opacity-45" disabled={!createGate.enabled}>
          {isAuthenticated ? 'Registrar demanda' : 'Entrar para registrar'}
        </button>
        <GateHint gate={createGate} />
      </div>
    </form>
  );
}

export function OPDemandDetailPage({
  demand,
  demands,
  proposals,
  votings,
  onBack,
  onSupport,
  onComment,
  onTransition,
  onGroup,
  onFork,
  onCreateProposal,
  onViewProposals,
  onViewVotings,
  onViewFilters,
  actionContext
}: {
  demand?: BudgetDemand;
  demands: BudgetDemand[];
  proposals: BudgetProposal[];
  votings: OPVoting[];
  onBack: () => void;
  onSupport: (demandId: string) => void;
  onComment: (demandId: string, content: string) => void;
  onTransition: (
    demandId: string,
    transition: 'mature' | 'request-info' | 'validate-territory' | 'mark-ready',
    reason?: string
  ) => void;
  onGroup: (sourceId: string, targetDemandId: string, reason: string) => void;
  onFork: (sourceId: string, data: ForkBudgetDemandData) => void;
  onCreateProposal: (demand: BudgetDemand, data: NewBudgetProposalData) => void;
  onViewProposals: () => void;
  onViewVotings: () => void;
  onViewFilters: () => void;
  actionContext: OPActionContext;
}) {
  const [comment, setComment] = useState('');
  const [groupTargetId, setGroupTargetId] = useState('');
  const [groupReason, setGroupReason] = useState('');
  const [forkTitle, setForkTitle] = useState('');
  const [forkDescription, setForkDescription] = useState('');
  const [forkReason, setForkReason] = useState('');
  const [proposalScope, setProposalScope] = useState('');
  const [proposalCost, setProposalCost] = useState('');

  if (!demand) {
    return <NotFound title="Demanda não encontrada" onBack={onBack} />;
  }

  const supportGate = canSupportDemand(actionContext, demand);
  const groupGate = canGroupDemand(actionContext, demand);
  const forkGate = canForkDemand(actionContext, demand);
  const proposalGate = canCreateProposal(actionContext, demand);
  const transitionGates: Record<DemandTransition, OPGate> = {
    mature: canTransitionDemand(actionContext, demand, 'mature'),
    'request-info': canTransitionDemand(actionContext, demand, 'request-info'),
    'validate-territory': canTransitionDemand(actionContext, demand, 'validate-territory'),
    'mark-ready': canTransitionDemand(actionContext, demand, 'mark-ready')
  };
  const filterGate = Object.values(transitionGates).some(gate => gate.enabled)
    ? { enabled: true }
    : firstDisabledGate(Object.values(transitionGates));

  const groupCandidates = demands.filter(item =>
    item.id !== demand.id &&
    item.cycleId === demand.cycleId &&
    item.territoryId === demand.territoryId &&
    item.status !== 'Agrupada'
  );

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!comment.trim()) return;
    onComment(demand.id, comment.trim());
    setComment('');
  };

  const submitGroup = (event: FormEvent) => {
    event.preventDefault();
    if (!groupGate.enabled) return;
    if (!groupTargetId || !groupReason.trim()) return;
    onGroup(demand.id, groupTargetId, groupReason.trim());
    setGroupTargetId('');
    setGroupReason('');
  };

  const submitFork = (event: FormEvent) => {
    event.preventDefault();
    if (!forkGate.enabled) return;
    if (!forkTitle.trim()) return;
    onFork(demand.id, {
      title: forkTitle.trim(),
      description: forkDescription.trim() || undefined,
      category: demand.category,
      location: demand.location,
      reason: forkReason.trim() || undefined
    });
    setForkTitle('');
    setForkDescription('');
    setForkReason('');
  };

  const submitProposal = (event: FormEvent) => {
    event.preventDefault();
    if (!proposalGate.enabled) return;
    const estimatedCost = Number(proposalCost.replace(/\D/g, ''));
    if (!proposalScope.trim() || estimatedCost <= 0) return;

    onCreateProposal(demand, {
      title: demand.title,
      problemSummary: demand.description,
      solutionScope: proposalScope.trim(),
      estimatedCostCents: estimatedCost * 100,
      category: demand.category
    });

    setProposalScope('');
    setProposalCost('');
  };

  return (
    <div className="space-y-6 fade-in">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-git-text2)] hover:text-white transition">
        <ArrowRight className="h-4 w-4 rotate-180" />
        Voltar
      </button>

      <section className="glass-panel p-6 rounded-[20px]">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="chip-blue">{demand.id}</Badge>
          <Badge className={statusClass(demand.status)}>{demand.status}</Badge>
          <Badge className="chip-purple">{demand.category}</Badge>
        </div>

        <h1 className="mt-4 font-display text-2xl font-bold text-white">{demand.title}</h1>
        {demand.description && (
          <p className="mt-3 text-sm leading-7 text-[var(--color-git-muted)]">{demand.description}</p>
        )}

        <DemandStageOverview demand={demand} />

        <DemandProcessChapters
          demand={demand}
          proposals={proposals}
          votings={votings}
          onViewProposals={onViewProposals}
          onViewVotings={onViewVotings}
          onViewFilters={onViewFilters}
        />

        <div className="mt-5 grid grid-cols-2 gap-3">
          <MetricMini label="apoios" value={demand.supports} />
          <MetricMini label="comentários" value={demand.comments.length} />
        </div>

        <div className="mt-4 rounded-xl border border-[var(--color-git-border)] bg-white/[0.02] p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-[var(--color-git-muted)]">
              Apoio mínimo
            </p>
            <p className="text-xs font-bold text-[var(--color-git-text2)]">
              {demand.supports}/{demand.supportThreshold}
            </p>
          </div>
          <PercentBar value={demand.supports} total={demand.supportThreshold} />
        </div>

        <div className="mt-5 rounded-xl border border-[var(--color-git-border)] bg-white/[0.02] p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-git-text2)]">
            <MapPin className="h-4 w-4 text-[var(--color-git-blue)]" />
            {demand.territoryName}
          </div>
          <p className="mt-1 text-xs text-[var(--color-git-muted)]">
            {demand.location || 'Local específico ainda não informado'}
          </p>
        </div>

        <button
          onClick={() => onSupport(demand.id)}
          disabled={!supportGate.enabled}
          className="btn-primary mt-5 disabled:opacity-45"
        >
          <ThumbsUp className="h-4 w-4" />
          {actionContext.isAuthenticated ? 'Apoiar demanda' : 'Entrar para apoiar'}
        </button>
        <GateHint gate={supportGate} />
      </section>

      <section className="glass-panel p-5 rounded-[20px]">
        <h2 className="font-display text-lg font-bold text-white">Filtro territorial</h2>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <GateButton gate={transitionGates.mature} onClick={() => onTransition(demand.id, 'mature')}>
            Maturar
          </GateButton>
          <GateButton gate={transitionGates['request-info']} onClick={() => onTransition(demand.id, 'request-info', 'Precisa complementar informações.')}>
            Pedir info
          </GateButton>
          <GateButton gate={transitionGates['validate-territory']} onClick={() => onTransition(demand.id, 'validate-territory')}>
            Validar
          </GateButton>
          <GateButton gate={transitionGates['mark-ready']} onClick={() => onTransition(demand.id, 'mark-ready')} primary>
            Apta
          </GateButton>
        </div>
        <GateHint gate={filterGate} />
      </section>

      <section className="glass-panel p-5 rounded-[20px]">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-[var(--color-git-blue)]" />
          <h2 className="font-display text-lg font-bold text-white">Agrupamento e forks</h2>
        </div>

        {demand.links.length > 0 && (
          <div className="mt-4 space-y-2">
            {demand.links.map(link => (
              <div key={`${link.type}-${link.demandId}`} className="rounded-xl border border-[var(--color-git-border2)] bg-white/[0.02] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="chip-blue">{relationLabel(link.type)}</Badge>
                  <Badge className={statusClass(link.demandStatus)}>{link.demandStatus}</Badge>
                </div>
                <p className="mt-2 text-sm font-bold text-white">{link.demandId} — {link.demandTitle}</p>
                {link.reason && <p className="mt-1 text-xs text-[var(--color-git-muted)]">{link.reason}</p>}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={submitGroup} className="mt-4 space-y-2">
          <select
            value={groupTargetId}
            onChange={event => setGroupTargetId(event.target.value)}
            disabled={!groupGate.enabled}
            className="field"
          >
            <option value="">Agrupar em demanda existente</option>
            {groupCandidates.map(item => (
              <option key={item.id} value={item.id}>{item.id} — {item.title}</option>
            ))}
          </select>
          <input
            value={groupReason}
            onChange={event => setGroupReason(event.target.value)}
            placeholder="Justificativa do agrupamento"
            disabled={!groupGate.enabled}
            className="field"
          />
          <button
            disabled={!groupGate.enabled || !groupTargetId || !groupReason.trim()}
            className="btn-secondary btn-sm w-full justify-center disabled:opacity-45"
          >
            Agrupar
          </button>
          <GateHint gate={groupGate} />
        </form>

        <form onSubmit={submitFork} className="mt-5 space-y-2 border-t border-[var(--color-git-border)] pt-4">
          <div className="flex items-center gap-2">
            <GitFork className="h-4 w-4 text-[var(--color-git-green)]" />
            <p className="text-sm font-bold text-white">Novo fork</p>
          </div>
          <input
            value={forkTitle}
            onChange={event => setForkTitle(event.target.value)}
            placeholder="Título da alternativa"
            disabled={!forkGate.enabled}
            className="field"
          />
          <textarea
            value={forkDescription}
            onChange={event => setForkDescription(event.target.value)}
            placeholder="Descrição da alternativa"
            rows={3}
            disabled={!forkGate.enabled}
            className="field resize-none"
          />
          <input
            value={forkReason}
            onChange={event => setForkReason(event.target.value)}
            placeholder="Motivo do fork"
            disabled={!forkGate.enabled}
            className="field"
          />
          <button
            disabled={!forkGate.enabled || !forkTitle.trim()}
            className="btn-primary btn-sm w-full justify-center disabled:opacity-45"
          >
            {actionContext.isAuthenticated ? 'Criar fork' : 'Entrar e criar fork'}
          </button>
          <GateHint gate={forkGate} />
        </form>
      </section>

      <section className="glass-panel p-5 rounded-[20px]">
        <div className="flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-[var(--color-git-green)]" />
          <h2 className="font-display text-lg font-bold text-white">Gerar proposta</h2>
        </div>
        <form onSubmit={submitProposal} className="mt-4 space-y-2">
          <textarea
            value={proposalScope}
            onChange={event => setProposalScope(event.target.value)}
            placeholder="Escopo da solução possível"
            rows={4}
            disabled={!proposalGate.enabled}
            className="field resize-none"
          />
          <input
            value={proposalCost}
            onChange={event => setProposalCost(event.target.value)}
            placeholder="Custo estimado em reais"
            inputMode="numeric"
            disabled={!proposalGate.enabled}
            className="field"
          />
          <button
            disabled={!proposalGate.enabled || !proposalScope.trim() || Number(proposalCost.replace(/\D/g, '')) <= 0}
            className="btn-primary btn-sm w-full justify-center disabled:opacity-45"
          >
            Criar proposta apta
          </button>
          <GateHint gate={proposalGate} />
        </form>
      </section>

      <section className="glass-panel p-5 rounded-[20px]">
        <h2 className="font-display text-lg font-bold text-white">Maturação territorial</h2>
        <div className="mt-4 space-y-3">
          {demand.comments.length === 0 && (
            <p className="text-sm text-[var(--color-git-muted)]">Nenhum comentário publicado.</p>
          )}
          {demand.comments.map(item => (
            <div key={item.id} className="rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.02)] p-4">
              <p className="text-sm font-semibold text-white">{item.authorName}</p>
              <p className="mt-1 text-sm text-[var(--color-git-text2)]">{item.content}</p>
              <p className="mt-2 font-mono text-[10px] text-[var(--color-git-muted)]">{formatDate(item.createdAt)}</p>
            </div>
          ))}
        </div>

        <form onSubmit={submit} className="mt-4 flex gap-2">
          <input
            value={comment}
            onChange={event => setComment(event.target.value)}
            placeholder="Complementar informação"
            className="field min-w-0 flex-1"
          />
          <button className="btn-primary btn-sm shrink-0">Enviar</button>
        </form>
      </section>
    </div>
  );
}

function DemandProcessChapters({
  demand,
  proposals,
  votings,
  onViewProposals,
  onViewVotings,
  onViewFilters
}: {
  demand: BudgetDemand;
  proposals: BudgetProposal[];
  votings: OPVoting[];
  onViewProposals: () => void;
  onViewVotings: () => void;
  onViewFilters: () => void;
}) {
  const linkedProposals = proposals.filter(proposal => proposal.demandId === demand.id);
  const linkedProposalIds = new Set(linkedProposals.map(proposal => proposal.id));
  const linkedVotings = votings.filter(voting => linkedProposalIds.has(voting.proposalId));
  const { filters, status } = useBudgetFilters({ demandId: demand.id });

  return (
    <div className="mt-5 rounded-2xl border border-[var(--color-git-border)] bg-black/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-[var(--color-git-muted)]">
            Processo vivo
          </p>
          <h2 className="mt-1 text-sm font-bold text-white">Capítulos ligados a esta demanda</h2>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <ProcessChapter
          icon={ScrollText}
          label="Proposta"
          count={linkedProposals.length}
          empty="Ainda não há proposta criada a partir desta demanda."
          onView={linkedProposals.length > 0 ? onViewProposals : undefined}
        >
          {linkedProposals.map(proposal => (
            <ChapterItem key={proposal.id} title={`${proposal.id} — ${proposal.title}`} status={proposal.status}>
              <span>{formatCurrency(proposal.estimatedCostCents)}</span>
              <span>{formatDate(proposal.updatedAt)}</span>
            </ChapterItem>
          ))}
        </ProcessChapter>

        <ProcessChapter
          icon={Vote}
          label="Votação"
          count={linkedVotings.length}
          empty="Nenhuma votação territorial foi aberta para esta demanda."
          onView={linkedVotings.length > 0 ? onViewVotings : undefined}
        >
          {linkedVotings.map(voting => (
            <ChapterItem key={voting.id} title={`${voting.id} — ${voting.title}`} status={voting.status}>
              <span>{voting.quorumReached}/{voting.quorumNeeded} participações</span>
              <span>{formatDate(voting.deadline)}</span>
            </ChapterItem>
          ))}
        </ProcessChapter>

        <ProcessChapter
          icon={AlertTriangle}
          label="Filtros"
          count={filters.length}
          empty={status === 'loading' ? 'Carregando filtros desta demanda…' : 'Nenhum circuit breaker registrado para esta demanda.'}
          onView={filters.length > 0 ? onViewFilters : undefined}
        >
          {filters.map(filter => (
            <ChapterItem key={filter.id} title={`${filter.id} — ${filter.message}`} status={filter.status}>
              <span>{verdictLabel(filter.verdict)}</span>
              <span>{returnPathLabel(filter.returnPath)}</span>
            </ChapterItem>
          ))}
        </ProcessChapter>
      </div>
    </div>
  );
}

function ProcessChapter({
  icon: Icon,
  label,
  count,
  empty,
  onView,
  children
}: {
  icon: typeof ScrollText;
  label: string;
  count: number;
  empty: string;
  onView?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-git-border)] bg-white/[0.02] p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className="h-4 w-4 shrink-0 text-[var(--color-git-blue)]" />
          <p className="text-sm font-bold text-white">{label}</p>
          <Badge className="border border-[var(--color-git-border2)] bg-black/20 text-[var(--color-git-muted2)]">
            {count}
          </Badge>
        </div>
        {onView && (
          <button onClick={onView} className="btn-secondary btn-sm shrink-0">
            Ver
          </button>
        )}
      </div>
      {count > 0 ? (
        <div className="mt-3 space-y-2">{children}</div>
      ) : (
        <p className="mt-3 text-xs leading-5 text-[var(--color-git-muted)]">{empty}</p>
      )}
    </div>
  );
}

function ChapterItem({
  title,
  status,
  children
}: {
  title: string;
  status: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[var(--color-git-border2)] bg-black/10 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={statusClass(status)}>{status}</Badge>
      </div>
      <p className="mt-2 text-xs font-bold leading-5 text-white">{title}</p>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[var(--color-git-muted)]">
        {children}
      </div>
    </div>
  );
}

function DemandStageOverview({ demand }: { demand: BudgetDemand }) {
  const stage = stageForDemand(demand);
  const StageIcon = stage.icon;

  return (
    <div className="mt-5 rounded-2xl border border-[var(--color-git-border)] bg-white/[0.02] p-4">
      <div className="flex items-start gap-3">
        <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${stage.className}`}>
          <StageIcon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-[var(--color-git-muted)]">
            Etapa atual
          </p>
          <h2 className="mt-1 text-sm font-bold text-white">{stage.label}</h2>
          <p className="mt-1 text-xs leading-5 text-[var(--color-git-muted)]">{stage.description}</p>
        </div>
      </div>

      <div className="mt-4">
        <PipelineDots status={demand.status} showLabels />
      </div>

      <div className="mt-4 rounded-xl border border-[rgba(56,189,248,0.16)] bg-[rgba(56,189,248,0.05)] p-3">
        <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--color-git-blue)]">
          Próxima ação
        </p>
        <p className="mt-1 text-sm leading-5 text-[var(--color-git-text2)]">{nextActionLabel(demand)}</p>
      </div>
    </div>
  );
}

function PipelineDots({ status, showLabels = false }: { status: BudgetDemand['status']; showLabels?: boolean }) {
  const currentIndex = pipelineStepIndex(status);
  const stalled = stageForStatus(status).id === 'stalled';

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-5 gap-1.5">
        {visiblePipelineStages.map((stage, index) => {
          const reached = !stalled && index <= currentIndex;
          const active = !stalled && index === currentIndex;
          return (
            <div
              key={stage.id}
              className={
                reached
                  ? active
                    ? 'h-2 rounded-full bg-[var(--color-git-blue)] shadow-[0_0_10px_rgba(56,189,248,0.55)]'
                    : 'h-2 rounded-full bg-[var(--color-git-green)]'
                  : 'h-2 rounded-full bg-white/[0.08]'
              }
            />
          );
        })}
      </div>
      {showLabels && (
        <div className="grid grid-cols-5 gap-1.5">
          {visiblePipelineStages.map(stage => (
            <span key={stage.id} className="truncate text-center font-mono text-[8px] uppercase tracking-wide text-[var(--color-git-muted)]">
              {stage.shortLabel}
            </span>
          ))}
        </div>
      )}
      {stalled && (
        <p className="text-[10px] leading-4 text-[var(--color-git-amber)]">
          Esta demanda saiu do fluxo principal e precisa de retorno, agrupamento ou reabertura.
        </p>
      )}
    </div>
  );
}

function stageForDemand(demand: BudgetDemand) {
  return stageForStatus(demand.status);
}

function stageForStatus(status: BudgetDemand['status']) {
  return PIPELINE_STAGES.find(stage => stage.statuses.includes(status)) ?? PIPELINE_STAGES[0];
}

function pipelineStepIndex(status: BudgetDemand['status']) {
  const stage = stageForStatus(status);
  const index = visiblePipelineStages.findIndex(item => item.id === stage.id);
  return index >= 0 ? index : 0;
}

function nextActionLabel(demand: BudgetDemand) {
  switch (demand.status) {
    case 'Recebida':
      return 'Moradores podem apoiar e confirmar que o problema pertence ao território.';
    case 'Engajamento inicial':
      return demand.supportReached
        ? 'Apoio mínimo atingido: iniciar maturação territorial.'
        : 'Buscar apoio do território para provar relevância coletiva.';
    case 'Precisa de informações':
      return 'Complementar local, evidências, impacto e informações mínimas.';
    case 'Maturação territorial':
      return 'Organizar causa, urgência e alternativas possíveis com a comunidade.';
    case 'Validada territorialmente':
      return 'Maintainer territorial pode marcar como apta para priorização.';
    case 'Apta para priorização':
      return 'Criar proposta com escopo e custo estimado para entrar na votação.';
    case 'Incluída na matriz orçamentária':
      return 'Aguardar incorporação institucional no rito do orçamento.';
    case 'Em execução':
      return 'Fiscalizar prazo, evidências e entrega pelo Executivo.';
    case 'Concluída':
      return 'Registrar aprendizado para calibrar o próximo ciclo.';
    case 'Agrupada':
      return 'Acompanhar a demanda principal que concentrou este problema.';
    case 'Dormente':
      return 'Reativar ou reformular no próximo ciclo do OP.';
    case 'Arquivada':
      return 'Consultar o motivo e abrir nova demanda se o contexto mudou.';
  }
}

function GateButton({
  gate,
  onClick,
  primary = false,
  children
}: {
  gate: OPGate;
  onClick: () => void;
  primary?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!gate.enabled}
      title={gate.reason}
      className={`${primary ? 'btn-primary' : 'btn-secondary'} btn-sm justify-center disabled:opacity-45`}
    >
      {children}
    </button>
  );
}

function firstDisabledGate(gates: OPGate[]): OPGate {
  return gates.find(gate => !gate.enabled) ?? { enabled: true };
}

function GateHint({ gate }: { gate: OPGate }) {
  if (gate.enabled || !gate.reason) return null;
  return (
    <p className="mt-2 rounded-lg border border-[rgba(251,191,36,0.18)] bg-[rgba(251,191,36,0.05)] px-3 py-2 text-xs leading-5 text-[var(--color-git-amber)]">
      {gate.reason}
    </p>
  );
}

function relationLabel(type: BudgetDemand['links'][number]['type']) {
  switch (type) {
    case 'grouped_into':
      return 'agrupada em';
    case 'grouped_from':
      return 'agrupou';
    case 'fork':
      return 'fork';
    case 'forked_from':
      return 'fork de';
  }
}

function returnPathLabel(path: string) {
  switch (path) {
    case 'fasear':
      return 'Fasear ou levar para ciclo plurianual';
    case 'reivindicacao_externa':
      return 'Reivindicação externa';
    case 'pactuacao':
      return 'Pactuar fonte ou responsabilidade';
    case 'reformular':
      return 'Reformular proposta';
    default:
      return path || 'Retornar à maturação';
  }
}

function verdictLabel(verdict: string) {
  switch (verdict) {
    case 'excede_envelope':
      return 'Excede sub-envelope';
    case 'fora_da_competencia':
      return 'Fora da competência municipal';
    case 'depende_de_outro_ente':
      return 'Depende de outro ente';
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
