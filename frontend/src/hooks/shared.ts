/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Tipos neutros compartilhados pelos hooks. Antes viviam nos hooks legados
// (useIssues/useVotings); centralizados aqui para o OP não depender do modelo
// "GitHub das leis", agora removido.

// Origem do efeito de uma escrita: confirmada pela API ou aplicada localmente
// (modo offline/fallback).
export type WriteSource = 'api' | 'local';

// Opção de voto do OP — espelha as opções aceitas pelo backend.
export type VoteSelection = 'Aprovo' | 'Rejeito' | 'Abstenção';
