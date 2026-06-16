/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { isBusinessError } from '../api/client';
import {
  castOPVote as apiCastOPVote,
  getOPVotings,
  openOPVotingForProposal
} from '../lib/api';
import type { BudgetProposal, OPVoting } from '../types';
import type { VoteSelection } from './useVotings';
import type { WriteSource } from './useIssues';

export interface OPVoteReceipt {
  id: string;
  selection: VoteSelection;
  receipt: string;
  txHash: string;
  source: WriteSource;
}

const buildTxHash = () =>
  '0x' + Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

export function useOPVotings() {
  const [opVotings, setOPVotings] = useState<OPVoting[]>([]);

  useEffect(() => {
    let isMounted = true;

    getOPVotings()
      .then(apiVotings => {
        if (isMounted) setOPVotings(apiVotings);
      })
      .catch(error => {
        console.warn('Não foi possível carregar votações do OP.', error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const openForProposal = async (proposal: BudgetProposal): Promise<{ voting: OPVoting; source: WriteSource }> => {
    try {
      const voting = await openOPVotingForProposal(proposal.id);
      setOPVotings(prev => [voting, ...prev.filter(item => item.proposalId !== voting.proposalId)]);
      return { voting, source: 'api' };
    } catch (error) {
      if (isBusinessError(error)) throw error;
      console.warn('Falha ao abrir votação OP na API; aplicando votação local.', error);
      const voting = buildLocalVoting(proposal);
      setOPVotings(prev => [voting, ...prev.filter(item => item.proposalId !== proposal.id)]);
      return { voting, source: 'local' };
    }
  };

  const castVote = async (votingId: string, selection: VoteSelection): Promise<OPVoteReceipt> => {
    try {
      const response = await apiCastOPVote(votingId, selection);
      setOPVotings(prev =>
        prev.map(voting =>
          voting.id === votingId
            ? {
                ...voting,
                ...response.voting,
                hasVoted: true,
                userVoteSelection: selection,
                voteReceipt: response.receiptCode
              }
            : voting
        )
      );
      return {
        id: votingId,
        selection,
        receipt: response.receiptCode,
        txHash: buildTxHash(),
        source: 'api'
      };
    } catch (error) {
      if (isBusinessError(error)) throw error;
      console.warn('Falha ao votar no OP pela API; aplicando voto local.', error);

      const receipt = `OP-LOCAL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      setOPVotings(prev =>
        prev.map(voting => {
          if (voting.id !== votingId) return voting;
          return {
            ...voting,
            hasVoted: true,
            userVoteSelection: selection,
            voteReceipt: receipt,
            votesYes: selection === 'Aprovo' ? voting.votesYes + 1 : voting.votesYes,
            votesNo: selection === 'Rejeito' ? voting.votesNo + 1 : voting.votesNo,
            votesAbstain: selection === 'Abstenção' ? voting.votesAbstain + 1 : voting.votesAbstain,
            quorumReached: voting.quorumReached + 1
          };
        })
      );

      return {
        id: votingId,
        selection,
        receipt,
        txHash: buildTxHash(),
        source: 'local'
      };
    }
  };

  return {
    opVotings,
    openForProposal,
    castVote
  };
}

function buildLocalVoting(proposal: BudgetProposal): OPVoting {
  const now = new Date();
  const deadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return {
    id: `OPV-local-${Date.now()}`,
    cycleId: proposal.cycleId,
    proposalId: proposal.id,
    territoryId: proposal.territoryId,
    territoryName: proposal.territoryName,
    title: proposal.title,
    summary: proposal.problemSummary || proposal.solutionScope,
    deadline: deadline.toISOString(),
    quorumNeeded: 1,
    quorumReached: 0,
    votesYes: 0,
    votesNo: 0,
    votesAbstain: 0,
    status: 'Aberta',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };
}
