/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, GitFork, Link2, MapPin, MessageSquare, Plus, ScrollText, ThumbsUp } from 'lucide-react';
import type { ForkBudgetDemandData, NewBudgetDemandData, NewBudgetProposalData } from '../hooks';
import { Badge, MetricMini, NotFound, PercentBar, formatDate, statusClass } from '../shared/ui';
import type { BudgetDemand, Territory } from '../types';

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

export function OPDemandList({
  demands,
  onSelect
}: {
  demands: BudgetDemand[];
  onSelect: (demandId: string) => void;
}) {
  return (
    <div className="glass-panel rounded-[20px] overflow-hidden">
      <div className="border-b border-[var(--color-git-border)] bg-[rgba(255,255,255,0.02)] p-4">
        <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-[var(--color-git-blue)]">
          Esteira do OP
        </p>
        <h2 className="mt-1 font-display text-lg font-bold text-white">Demandas territoriais</h2>
      </div>

      <div className="divide-y divide-[var(--color-git-border)]">
        {demands.length === 0 && (
          <p className="p-6 text-sm leading-6 text-[var(--color-git-muted)]">
            Nenhuma demanda registrada neste ciclo.
          </p>
        )}

        {demands.map(demand => (
          <button
            key={demand.id}
            onClick={() => onSelect(demand.id)}
            className="block w-full p-4 text-left transition hover:bg-white/5"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] font-bold text-[var(--color-git-muted)]">{demand.id}</span>
              <Badge className={statusClass(demand.status)}>{demand.status}</Badge>
              <Badge className="chip-blue">{demand.territoryName}</Badge>
            </div>
            <h3 className="mt-2 text-sm font-bold text-white">{demand.title}</h3>
            {demand.description && (
              <p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--color-git-muted)]">{demand.description}</p>
            )}
            <div className="mt-3 flex items-center gap-4 text-[11px] text-[var(--color-git-muted)]">
              <span className="inline-flex items-center gap-1">
                <ThumbsUp className="h-3.5 w-3.5" />
                {demand.supports}
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                {demand.comments.length}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function OPDemandComposer({
  territories,
  onSubmit
}: {
  territories: Territory[];
  onSubmit: (data: NewBudgetDemandData) => void;
}) {
  const [title, setTitle] = useState('');
  const [territoryId, setTerritoryId] = useState(territories[0]?.id ?? '');
  const [category, setCategory] = useState(DEMAND_CATEGORIES[0]);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !territoryId || !category) return;

    onSubmit({
      territoryId,
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
      <div className="flex items-center gap-2">
        <Plus className="h-4 w-4 text-[var(--color-git-blue)] icon-glow-blue" />
        <h3 className="font-display text-base font-bold text-white">Nova demanda</h3>
      </div>

      <div className="mt-4 space-y-3">
        <input
          value={title}
          onChange={event => setTitle(event.target.value)}
          placeholder="Ex: Falta médico no PSF do bairro"
          className="field"
        />

        <select
          value={territoryId}
          onChange={event => setTerritoryId(event.target.value)}
          className="field"
        >
          <option value="">Selecione o território</option>
          {territories.map(option => (
            <option key={option.id} value={option.id}>{option.name}</option>
          ))}
        </select>

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

        <button className="btn-primary w-full">Registrar demanda</button>
      </div>
    </form>
  );
}

export function OPDemandDetailPage({
  demand,
  demands,
  onBack,
  onSupport,
  onComment,
  onTransition,
  onGroup,
  onFork,
  onCreateProposal
}: {
  demand?: BudgetDemand;
  demands: BudgetDemand[];
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
    if (!groupTargetId || !groupReason.trim()) return;
    onGroup(demand.id, groupTargetId, groupReason.trim());
    setGroupTargetId('');
    setGroupReason('');
  };

  const submitFork = (event: FormEvent) => {
    event.preventDefault();
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

        <button onClick={() => onSupport(demand.id)} className="btn-primary mt-5">
          <ThumbsUp className="h-4 w-4" />
          Apoiar demanda
        </button>
      </section>

      <section className="glass-panel p-5 rounded-[20px]">
        <h2 className="font-display text-lg font-bold text-white">Filtro territorial</h2>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => onTransition(demand.id, 'mature')}
            className="btn-secondary btn-sm justify-center"
          >
            Maturar
          </button>
          <button
            onClick={() => onTransition(demand.id, 'request-info', 'Precisa complementar informações.')}
            className="btn-secondary btn-sm justify-center"
          >
            Pedir info
          </button>
          <button
            onClick={() => onTransition(demand.id, 'validate-territory')}
            className="btn-secondary btn-sm justify-center"
          >
            Validar
          </button>
          <button
            onClick={() => onTransition(demand.id, 'mark-ready')}
            className="btn-primary btn-sm justify-center"
          >
            Apta
          </button>
        </div>
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
            className="field"
          />
          <button className="btn-secondary btn-sm w-full justify-center">
            Agrupar
          </button>
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
            className="field"
          />
          <textarea
            value={forkDescription}
            onChange={event => setForkDescription(event.target.value)}
            placeholder="Descrição da alternativa"
            rows={3}
            className="field resize-none"
          />
          <input
            value={forkReason}
            onChange={event => setForkReason(event.target.value)}
            placeholder="Motivo do fork"
            className="field"
          />
          <button className="btn-primary btn-sm w-full justify-center">
            Criar fork
          </button>
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
            className="field resize-none"
          />
          <input
            value={proposalCost}
            onChange={event => setProposalCost(event.target.value)}
            placeholder="Custo estimado em reais"
            inputMode="numeric"
            className="field"
          />
          <button className="btn-primary btn-sm w-full justify-center">
            Criar proposta apta
          </button>
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
