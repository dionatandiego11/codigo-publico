import { calcularOrcamentoTerritorios } from '../../demo/initialData';
import { CycleConfig, Demanda, Territorio } from '../../shared/domain/types';
import type { ApiBudgetDemand, ApiCycle, ApiCycleTerritoryEnvelope, ApiTerritory } from './api';

export function mapCycle(apiCycle: ApiCycle, territoryCount: number): CycleConfig {
  const regimento = apiCycle.regimento;
  const total = centsToReais(apiCycle.envelopeTotal);
  const territorialPool = Math.round(total * (100 - regimento.structuringPct) / 100);
  const equalPool = Math.round(territorialPool * regimento.equalSharePct / 100);
  const carenciaPool = Math.max(0, territorialPool - equalPool);
  const count = Math.max(1, territoryCount);

  return {
    id: apiCycle.id,
    ano: apiCycle.startsAt ? new Date(apiCycle.startsAt).getFullYear() : new Date().getFullYear(),
    nome: apiCycle.label,
    pisoIgualBase: Math.round(equalPool / count),
    parcelaCarenciaTotal: carenciaPool,
    limiarApoioPercentual: regimento.supportThresholdPct / 100,
    tamanhoConselho: regimento.councilSize,
    prazoDias: regimento.maturationWindow,
    faseAtual: mapCyclePhase(apiCycle.phase),
  };
}

export function mapCyclePhase(phase: string): CycleConfig['faseAtual'] {
  switch (phase) {
    case 'Rascunho':
    case 'Inscrições':
      return 'preparacao';
    case 'Coleta':
      return 'propostas';
    case 'Votação':
      return 'votacao';
    case 'Consolidação':
    case 'Institucionalização':
      return 'institucional';
    case 'Encerrado':
    case 'Cancelado':
      return 'execucao';
    default:
      return 'propostas';
  }
}

export function mapTerritories(
  apiTerritories: ApiTerritory[],
  envelopes: ApiCycleTerritoryEnvelope[],
  cycle: CycleConfig,
): Territorio[] {
  const base = apiTerritories.map((territory): Territorio => {
    const envelope = envelopes.find(item => item.territoryName === territory.name);
    return {
      id: territory.id,
      nome: territory.name,
      populacao: Math.max(territory.activeCitizensCount || 0, 1000),
      indiceCarencia: envelope?.carenciaWeight ? Math.min(1, envelope.carenciaWeight / 100) : 0.5,
      pisoIgual: envelope ? centsToReais(envelope.equal) : 0,
      parcelaCarencia: envelope ? centsToReais(envelope.carencia) : 0,
      totalOrcamento: envelope ? centsToReais(envelope.total) : 0,
    };
  });

  if (envelopes.length > 0) {
    return base;
  }

  return calcularOrcamentoTerritorios(base, cycle.pisoIgualBase, cycle.parcelaCarenciaTotal);
}

export function mapDemand(apiDemand: ApiBudgetDemand, territorios: Territorio[]): Demanda {
  const territorio = territorios.find(item => item.id === apiDemand.territoryId || item.nome === apiDemand.territoryName);
  const threshold = Math.max(1, apiDemand.supportThreshold || Math.round((territorio?.populacao ?? 1000) * 0.03));
  const status = apiDemand.status;

  return {
    id: apiDemand.id,
    titulo: apiDemand.title,
    descricao: apiDemand.description,
    status,
    territorioId: apiDemand.territoryId,
    escopoVotacao: apiDemand.category === 'Escopo municipal' ? 'municipal' : 'territorial',
    dataCriacao: dateOnly(apiDemand.createdAt),
    apoiosCount: apiDemand.supports,
    apoiosNecessarios: threshold,
    passouProtocolar: !['Precisa de informações', 'Arquivada', 'Dormente'].includes(status),
    passouPopular: apiDemand.supportReached || apiDemand.supports >= threshold,
    criteriaProtocolar: {
      vinculoValido: true,
      dadosMinimos: Boolean(apiDemand.title && apiDemand.description),
      interessePublico: !['Arquivada', 'Dormente'].includes(status),
    },
    comentarios: apiDemand.comments.map(comment => ({
      id: comment.id,
      autor: comment.authorName || 'Cidadão',
      texto: comment.content,
      data: dateOnly(comment.createdAt),
    })),
    events: apiDemand.events?.map(event => ({
      id: event.id,
      demandId: event.demandId,
      actorId: event.actorId,
      actorType: event.actorType as any,
      type: event.type,
      fromState: event.fromState,
      toState: event.toState,
      visibility: event.visibility as any,
      payload: event.payload,
      createdAt: event.createdAt,
    })),
    forkId: apiDemand.forkedFromDemandId,
    parentTitulo: apiDemand.forkedFromDemandId ? `Demanda ${apiDemand.forkedFromDemandId}` : undefined,
    agrupadaEmId: apiDemand.groupedIntoDemandId,
    admissibilidadeMarcar: [
      'Apta para priorização',
      'Em votação',
      'Aprovada',
      'Em planejamento',
      'Em execução',
      'Concluída',
      'Frustrada',
    ].includes(status)
      ? 'admissivel'
      : ['Não aprovada', 'Arquivada'].includes(status)
        ? 'inadmissivel'
        : 'pendente',
    statusExecucao: status === 'Em planejamento'
      ? 'planejamento'
      : status === 'Em execução'
        ? 'obra'
        : status === 'Concluída'
          ? 'concluido'
          : status === 'Frustrada'
            ? 'frustrado'
            : undefined,
  };
}

export function centsToReais(value: number) {
  return Math.round(value / 100);
}

export function dateOnly(value?: string) {
  if (!value) return new Date().toISOString().substring(0, 10);
  return value.substring(0, 10);
}

export function mapOPVoting(apiVoting: import('./api').ApiOPVoting): import('../../shared/domain/types').OPVoting {
  return {
    id: apiVoting.id,
    proposalId: apiVoting.proposalId,
    territoryId: apiVoting.territoryId,
    territoryName: apiVoting.territoryName,
    title: apiVoting.title,
    summary: apiVoting.summary,
    deadline: apiVoting.deadline,
    quorumNeeded: apiVoting.quorumNeeded,
    quorumReached: apiVoting.quorumReached,
    votesYes: apiVoting.votesYes,
    votesNo: apiVoting.votesNo,
    votesAbstain: apiVoting.votesAbstain,
    status: apiVoting.status as import('../../shared/domain/types').OPVoting['status'],
    scope: apiVoting.scope,
  };
}

export function mapRankingItem(apiItem: import('./api').ApiRankingItem): import('../../shared/domain/types').RankingItem {
  return {
    id: apiItem.id,
    cycleId: apiItem.cycleId,
    territoryId: apiItem.territoryId,
    territoryName: apiItem.territoryName,
    demandId: apiItem.demandId,
    proposalId: apiItem.proposalId,
    votingId: apiItem.votingId,
    proposalTitle: apiItem.proposalTitle,
    position: apiItem.position,
    votesYes: apiItem.votesYes,
    votesNo: apiItem.votesNo,
    votesAbstain: apiItem.votesAbstain,
    totalVotes: apiItem.totalVotes,
    approvalPct: apiItem.approvalPct,
    quorumReached: apiItem.quorumReached,
    approved: apiItem.approved,
    status: apiItem.status as import('../../shared/domain/types').RankingItem['status'],
    frustrationReason: apiItem.frustrationReason,
  };
}
