/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { fallbackVotings } from '../app/fallback-data';
import { castVote as apiCastVote, getVotings } from '../lib/api';
import { Voting } from '../types';
import type { WriteSource } from './useIssues';

export type VoteSelection = NonNullable<Voting['userVoteSelection']>;

export interface LocalVoteReceipt {
  id: string;
  selection: VoteSelection;
  receipt: string;
  txHash: string;
  source: WriteSource;
}

const buildTxHash = () =>
  '0x' + Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

export function useVotings() {
  const [votacoes, setVotacoes] = useState<Voting[]>(fallbackVotings);

  useEffect(() => {
    let isMounted = true;

    async function loadVotings() {
      try {
        const apiVotings = await getVotings();
        if (isMounted) setVotacoes(apiVotings);
      } catch (error) {
        console.warn('Não foi possível carregar votações da API; mantendo fallback local.', error);
      }
    }

    loadVotings();

    return () => {
      isMounted = false;
    };
  }, []);

  const castVote = async (votingId: string, selection: VoteSelection): Promise<LocalVoteReceipt> => {
    try {
      const response = await apiCastVote(votingId, selection);

      setVotacoes(prev =>
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
      console.warn('Falha ao registrar voto na API; aplicando voto local.', error);

      const receipt = `CP-2026-${Math.random().toString(36).substring(3, 7).toUpperCase()}-${Math.random().toString(36).substring(3, 7).toUpperCase()}`;

      setVotacoes(prev =>
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
    votacoes,
    castVote
  };
}
