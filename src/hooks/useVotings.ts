/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { fallbackVotings } from '../app/fallback-data';
import { getVotings } from '../lib/api';
import { Voting } from '../types';

export type VoteSelection = NonNullable<Voting['userVoteSelection']>;

export interface LocalVoteReceipt {
  id: string;
  selection: VoteSelection;
  receipt: string;
  txHash: string;
}

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

  const castVote = (votingId: string, selection: VoteSelection): LocalVoteReceipt => {
    const receipt = `CP-2026-${Math.random().toString(36).substring(3, 7).toUpperCase()}-${Math.random().toString(36).substring(3, 7).toUpperCase()}`;
    const txHash = '0x' + Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

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
      txHash
    };
  };

  return {
    votacoes,
    castVote
  };
}
