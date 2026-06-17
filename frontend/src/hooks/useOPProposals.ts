/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { isBusinessError } from '../api/client';
import {
  createOPProposalFromDemand,
  decideOPProposalInstitutional,
  getOPProposals,
  type CreateBudgetProposalData,
  type InstitutionalDecisionData,
  type InstitutionalDecisionResult
} from '../lib/api';
import type { BudgetDemand, BudgetProposal, BudgetProposalStatus, OPVoting } from '../types';
import type { WriteSource } from './shared';

export type NewBudgetProposalData = CreateBudgetProposalData;

export function useOPProposals() {
  const [proposals, setProposals] = useState<BudgetProposal[]>([]);

  const refresh = async () => {
    const apiProposals = await getOPProposals();
    setProposals(apiProposals);
  };

  useEffect(() => {
    let isMounted = true;

    getOPProposals()
      .then(apiProposals => {
        if (isMounted) setProposals(apiProposals);
      })
      .catch(error => {
        console.warn('Não foi possível carregar propostas do OP.', error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const createFromDemand = async (
    demand: BudgetDemand,
    data: NewBudgetProposalData
  ): Promise<{ proposal: BudgetProposal; source: WriteSource }> => {
    try {
      const proposal = await createOPProposalFromDemand(demand.id, data);
      setProposals(prev => [proposal, ...prev]);
      return { proposal, source: 'api' };
    } catch (error) {
      if (isBusinessError(error)) throw error;
      console.warn('Falha ao criar proposta na API; aplicando proposta local.', error);
      const localProposal = buildLocalProposal(demand, data);
      setProposals(prev => [localProposal, ...prev]);
      return { proposal: localProposal, source: 'local' };
    }
  };

  const applyVotingResolution = (voting: OPVoting) => {
    const status: BudgetProposalStatus = votingApproved(voting) ? 'Priorizada' : 'Retornada para maturação';
    setProposals(prev =>
      prev.map(proposal =>
        proposal.id === voting.proposalId
          ? { ...proposal, status, updatedAt: voting.updatedAt }
          : proposal
      )
    );
  };

  const decideInstitutional = async (
    proposalId: string,
    data: InstitutionalDecisionData
  ): Promise<InstitutionalDecisionResult> => {
    const result = await decideOPProposalInstitutional(proposalId, data);
    setProposals(prev =>
      prev.map(proposal =>
        proposal.id === result.proposalId
          ? { ...proposal, status: result.proposalStatus as BudgetProposalStatus, updatedAt: new Date().toISOString() }
          : proposal
      )
    );
    return result;
  };

  return {
    proposals,
    createFromDemand,
    refresh,
    applyVotingResolution,
    decideInstitutional
  };
}

function votingApproved(voting: OPVoting) {
  return voting.quorumReached >= voting.quorumNeeded && voting.votesYes > voting.votesNo;
}

function buildLocalProposal(demand: BudgetDemand, data: NewBudgetProposalData): BudgetProposal {
  const now = new Date().toISOString();

  return {
    id: `P-local-${Date.now()}`,
    cycleId: demand.cycleId,
    demandId: demand.id,
    territoryId: demand.territoryId,
    territoryName: demand.territoryName,
    title: data.title?.trim() || demand.title,
    problemSummary: data.problemSummary?.trim() || demand.description,
    solutionScope: data.solutionScope,
    estimatedCostCents: data.estimatedCostCents,
    category: data.category?.trim() || demand.category,
    authorName: 'Sessão local',
    status: 'Apta para votação',
    createdAt: now,
    updatedAt: now
  };
}
