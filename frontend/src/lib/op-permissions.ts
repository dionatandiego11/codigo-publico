/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AdminContext } from './api';
import type { BudgetDemand, BudgetDemandStatus, BudgetProposal, OPCyclePhase, OPVoting } from '../types';

export type DemandTransition = 'mature' | 'request-info' | 'validate-territory' | 'mark-ready';

export interface OPGate {
  enabled: boolean;
  reason?: string;
}

export interface OPActionContext {
  isAuthenticated: boolean;
  cyclePhase?: OPCyclePhase;
  citizenTerritoryId?: string;
  citizenTerritoryName?: string;
  adminContext?: AdminContext | null;
}

const terminalDemandStatuses = new Set<BudgetDemandStatus>([
  'Agrupada',
  'Incluída na matriz orçamentária',
  'Em execução',
  'Concluída',
  'Dormente',
  'Arquivada'
]);

const transitionAllowedFrom: Record<DemandTransition, Set<BudgetDemandStatus>> = {
  mature: new Set(['Recebida', 'Engajamento inicial', 'Precisa de informações']),
  'request-info': new Set(['Recebida', 'Engajamento inicial', 'Maturação territorial', 'Validada territorialmente']),
  'validate-territory': new Set(['Recebida', 'Engajamento inicial', 'Precisa de informações', 'Maturação territorial']),
  'mark-ready': new Set(['Validada territorialmente'])
};

const enabled: OPGate = { enabled: true };

function disabled(reason: string): OPGate {
  return { enabled: false, reason };
}

function normalize(value?: string | null) {
  return (value ?? '').trim().toLowerCase();
}

function territoryMatches(
  targetId?: string,
  targetName?: string,
  candidateId?: string,
  candidateSlug?: string,
  candidateName?: string
) {
  const targetKeys = new Set([normalize(targetId), normalize(targetName)].filter(Boolean));
  if (targetKeys.size === 0) return false;
  return [candidateId, candidateSlug, candidateName].some(value => targetKeys.has(normalize(value)));
}

function phaseGate(ctx: OPActionContext, phase: OPCyclePhase, message: string): OPGate {
  if (!ctx.cyclePhase) return disabled('Ciclo do OP ainda não foi carregado.');
  return ctx.cyclePhase === phase ? enabled : disabled(message);
}

function citizenTerritoryGate(ctx: OPActionContext, territoryId?: string, territoryName?: string): OPGate {
  if (!ctx.isAuthenticated) return enabled;
  if (!ctx.citizenTerritoryId && !ctx.citizenTerritoryName) {
    return disabled('Vincule-se a um território para participar.');
  }
  if (!territoryMatches(territoryId, territoryName, ctx.citizenTerritoryId, undefined, ctx.citizenTerritoryName)) {
    return disabled('Esta ação é restrita a cidadãos vinculados a este território.');
  }
  return enabled;
}

export function hasTerritoryAuthority(ctx: OPActionContext, territoryId?: string, territoryName?: string) {
  const admin = ctx.adminContext;
  if (!admin) return false;
  if (admin.canManageAllTerritories || admin.canGeneral) return true;
  if (!admin.canTerritorial) return false;

  return admin.maintainers.some(item =>
    item.scope === 'territorial' &&
    territoryMatches(territoryId, territoryName, item.territoryId, item.territorySlug, item.territoryName)
  );
}

function maintainerGate(ctx: OPActionContext, territoryId?: string, territoryName?: string): OPGate {
  if (hasTerritoryAuthority(ctx, territoryId, territoryName)) return enabled;
  return disabled('Exige instância territorial deste território ou instância geral.');
}

function demandOpenGate(ctx: OPActionContext) {
  return phaseGate(ctx, 'Coleta', 'Demandas só ficam abertas na fase Coleta do ciclo.');
}

function votingOpenGate(ctx: OPActionContext) {
  return phaseGate(ctx, 'Votação', 'Votações só ficam abertas na fase Votação do ciclo.');
}

function terminalGate(demand: BudgetDemand) {
  return terminalDemandStatuses.has(demand.status)
    ? disabled('Demanda em estado terminal não pode ser movida por esta ação.')
    : enabled;
}

function firstBlocked(...gates: OPGate[]) {
  return gates.find(gate => !gate.enabled) ?? enabled;
}

export function canCreateDemand(ctx: OPActionContext): OPGate {
  return firstBlocked(
    demandOpenGate(ctx),
    ctx.isAuthenticated && !ctx.citizenTerritoryId && !ctx.citizenTerritoryName
      ? disabled('Vincule-se ao seu território antes de registrar demanda.')
      : enabled
  );
}

export function canSupportDemand(ctx: OPActionContext, demand: BudgetDemand): OPGate {
  return firstBlocked(
    demandOpenGate(ctx),
    citizenTerritoryGate(ctx, demand.territoryId, demand.territoryName)
  );
}

export function canTransitionDemand(ctx: OPActionContext, demand: BudgetDemand, transition: DemandTransition): OPGate {
  if (transition === 'mark-ready') {
    return firstBlocked(
      demandOpenGate(ctx),
      maintainerGate(ctx, demand.territoryId, demand.territoryName),
      demand.status !== 'Validada territorialmente'
        ? disabled('A demanda precisa estar validada territorialmente.')
        : enabled,
      !demand.supportReached
        ? disabled('Apoio mínimo do território ainda não foi atingido.')
        : enabled
    );
  }

  return firstBlocked(
    demandOpenGate(ctx),
    maintainerGate(ctx, demand.territoryId, demand.territoryName),
    terminalGate(demand),
    transitionAllowedFrom[transition].has(demand.status)
      ? enabled
      : disabled(`Transição indisponível a partir de "${demand.status}".`)
  );
}

export function canGroupDemand(ctx: OPActionContext, demand: BudgetDemand): OPGate {
  return firstBlocked(
    demandOpenGate(ctx),
    maintainerGate(ctx, demand.territoryId, demand.territoryName),
    terminalGate(demand),
    demand.groupedIntoDemandId || demand.status === 'Agrupada'
      ? disabled('Esta demanda já foi agrupada.')
      : enabled
  );
}

export function canForkDemand(ctx: OPActionContext, demand: BudgetDemand): OPGate {
  return firstBlocked(
    demandOpenGate(ctx),
    citizenTerritoryGate(ctx, demand.territoryId, demand.territoryName),
    terminalGate(demand),
    demand.groupedIntoDemandId || demand.status === 'Agrupada'
      ? disabled('Crie forks a partir da demanda canônica.')
      : enabled
  );
}

export function canCreateProposal(ctx: OPActionContext, demand: BudgetDemand): OPGate {
  return firstBlocked(
    demandOpenGate(ctx),
    maintainerGate(ctx, demand.territoryId, demand.territoryName),
    demand.status !== 'Apta para priorização'
      ? disabled('Somente demanda apta para priorização pode virar proposta.')
      : enabled
  );
}

export function canOpenVoting(ctx: OPActionContext, proposal: BudgetProposal): OPGate {
  return firstBlocked(
    votingOpenGate(ctx),
    maintainerGate(ctx, proposal.territoryId, proposal.territoryName),
    proposal.status !== 'Apta para votação'
      ? disabled('Somente proposta apta pode abrir votação.')
      : enabled
  );
}

export function canVote(ctx: OPActionContext, voting: OPVoting): OPGate {
  const deadline = new Date(voting.deadline);
  const deadlineExpired = !Number.isNaN(deadline.getTime()) && Date.now() > deadline.getTime();

  return firstBlocked(
    votingOpenGate(ctx),
    voting.status !== 'Aberta' ? disabled('Esta votação não está aberta.') : enabled,
    deadlineExpired ? disabled('Prazo de votação encerrado.') : enabled,
    citizenTerritoryGate(ctx, voting.territoryId, voting.territoryName)
  );
}

export function canResolveVoting(ctx: OPActionContext, voting: OPVoting): OPGate {
  const deadline = new Date(voting.deadline);
  const deadlineExpired = !Number.isNaN(deadline.getTime()) && Date.now() >= deadline.getTime();

  return firstBlocked(
    voting.status !== 'Aberta' ? disabled('Esta votação já foi encerrada.') : enabled,
    !deadlineExpired ? disabled('A votação só pode ser encerrada após o prazo final.') : enabled,
    maintainerGate(ctx, voting.territoryId, voting.territoryName)
  );
}
