/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { isBusinessError } from '../api/client';
import {
  createOPDemand,
  createOPDemandComment,
  forkOPDemand,
  getOPDemands,
  groupOPDemand,
  markOPDemandReady,
  matureOPDemand,
  requestOPDemandInfo,
  validateOPDemandTerritory,
  supportOPDemand
} from '../lib/api';
import type { BudgetDemand } from '../types';
import type { WriteSource } from './shared';

export type NewBudgetDemandData = Pick<BudgetDemand, 'territoryId' | 'title' | 'description' | 'location' | 'category'>;
export type ForkBudgetDemandData = Pick<BudgetDemand, 'title'> & Partial<Pick<BudgetDemand, 'description' | 'location' | 'category'>> & { reason?: string };

export function useOPDemands() {
  const [demands, setDemands] = useState<BudgetDemand[]>([]);

  useEffect(() => {
    let isMounted = true;

    getOPDemands()
      .then(apiDemands => {
        if (isMounted) setDemands(apiDemands);
      })
      .catch(error => {
        console.warn('Não foi possível carregar demandas do OP.', error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const addDemand = async (formData: NewBudgetDemandData): Promise<{ demand: BudgetDemand; source: WriteSource }> => {
    try {
      const created = await createOPDemand(formData);
      setDemands(prev => [created, ...prev]);
      return { demand: created, source: 'api' };
    } catch (error) {
      if (isBusinessError(error)) throw error;
      console.warn('Falha ao registrar demanda na API; aplicando registro local.', error);
      const localDemand = buildLocalDemand(formData);
      setDemands(prev => [localDemand, ...prev]);
      return { demand: localDemand, source: 'local' };
    }
  };

  const supportDemand = async (demandId: string): Promise<WriteSource> => {
    try {
      const updated = await supportOPDemand(demandId);
      setDemands(prev => prev.map(demand => (demand.id === updated.id ? updated : demand)));
      return 'api';
    } catch (error) {
      if (isBusinessError(error)) throw error;
      console.warn('Falha ao apoiar demanda na API; aplicando apoio local.', error);
      setDemands(prev =>
        prev.map(demand =>
          demand.id === demandId ? withSupportProgress({ ...demand, supports: demand.supports + 1 }) : demand
        )
      );
      return 'local';
    }
  };

  const commentOnDemand = async (demandId: string, content: string, authorName: string): Promise<WriteSource> => {
    try {
      const comment = await createOPDemandComment(demandId, content);
      setDemands(prev =>
        prev.map(demand =>
          demand.id === demandId ? { ...demand, comments: [...demand.comments, comment] } : demand
        )
      );
      return 'api';
    } catch (error) {
      if (isBusinessError(error)) throw error;
      console.warn('Falha ao comentar demanda na API; aplicando comentário local.', error);
      setDemands(prev =>
        prev.map(demand =>
          demand.id === demandId
            ? {
                ...demand,
                comments: [
                  ...demand.comments,
                  {
                    id: `odc-local-${Date.now()}`,
                    authorName,
                    content,
                    createdAt: new Date().toISOString()
                  }
                ]
              }
            : demand
        )
      );
      return 'local';
    }
  };

  const transitionDemand = async (
    demandId: string,
    transition: 'mature' | 'request-info' | 'validate-territory' | 'mark-ready',
    reason?: string
  ): Promise<WriteSource> => {
    try {
      const updated = await runTransition(demandId, transition, reason);
      setDemands(prev => prev.map(demand => (demand.id === updated.id ? updated : demand)));
      return 'api';
    } catch (error) {
      if (isBusinessError(error)) throw error;
      console.warn('Falha ao mover demanda na API; aplicando transição local.', error);
      setDemands(prev =>
        prev.map(demand =>
          demand.id === demandId ? { ...demand, status: localStatusFor(transition) } : demand
        )
      );
      return 'local';
    }
  };

  const groupDemand = async (sourceId: string, targetDemandId: string, reason: string): Promise<WriteSource> => {
    try {
      const updated = await groupOPDemand(sourceId, targetDemandId, reason);
      setDemands(prev => prev.map(demand => (demand.id === updated.id ? updated : demand)));
      return 'api';
    } catch (error) {
      if (isBusinessError(error)) throw error;
      console.warn('Falha ao agrupar demanda na API; aplicando agrupamento local.', error);
      setDemands(prev =>
        prev.map(demand =>
          demand.id === sourceId ? { ...demand, status: 'Agrupada', groupedIntoDemandId: targetDemandId } : demand
        )
      );
      return 'local';
    }
  };

  const forkDemand = async (sourceId: string, data: ForkBudgetDemandData): Promise<{ demand: BudgetDemand; source: WriteSource }> => {
    try {
      const fork = await forkOPDemand(sourceId, data);
      setDemands(prev => [fork, ...prev]);
      return { demand: fork, source: 'api' };
    } catch (error) {
      if (isBusinessError(error)) throw error;
      console.warn('Falha ao criar fork na API; aplicando fork local.', error);
      const parent = demands.find(demand => demand.id === sourceId);
      const fork = buildLocalFork(sourceId, data, parent);
      setDemands(prev => [fork, ...prev]);
      return { demand: fork, source: 'local' };
    }
  };

  return {
    demands,
    addDemand,
    supportDemand,
    commentOnDemand,
    transitionDemand,
    groupDemand,
    forkDemand
  };
}

function withSupportProgress(demand: BudgetDemand): BudgetDemand {
  const total = Math.max(1, demand.supportThreshold);
  const progress = Math.min(100, Math.round((demand.supports / total) * 10000) / 100);

  return {
    ...demand,
    supportProgressPercent: progress,
    supportReached: demand.supports >= total
  };
}

function buildLocalDemand(formData: NewBudgetDemandData): BudgetDemand {
  const now = new Date().toISOString();

  return {
    id: `D-local-${Date.now()}`,
    cycleId: 'local',
    territoryId: formData.territoryId,
    territoryName: formData.territoryId,
    title: formData.title,
    description: formData.description ?? '',
    location: formData.location ?? '',
    category: formData.category,
    authorName: 'Sessão local',
    status: 'Recebida',
    supports: 1,
    supportThreshold: 1,
    supportProgressPercent: 100,
    supportReached: true,
    links: [],
    comments: [],
    createdAt: now,
    updatedAt: now
  };
}

function buildLocalFork(sourceId: string, data: ForkBudgetDemandData, parent?: BudgetDemand): BudgetDemand {
  const now = new Date().toISOString();

  return {
    id: `D-fork-local-${Date.now()}`,
    cycleId: parent?.cycleId ?? 'local',
    territoryId: parent?.territoryId ?? 'local',
    territoryName: parent?.territoryName ?? 'Sessão local',
    title: data.title,
    description: data.description ?? parent?.description ?? '',
    location: data.location ?? parent?.location ?? '',
    category: data.category ?? parent?.category ?? 'Infraestrutura',
    authorName: 'Sessão local',
    status: 'Recebida',
    supports: 1,
    supportThreshold: 1,
    supportProgressPercent: 100,
    supportReached: true,
    forkedFromDemandId: sourceId,
    links: [],
    comments: [],
    createdAt: now,
    updatedAt: now
  };
}

function runTransition(
  demandId: string,
  transition: 'mature' | 'request-info' | 'validate-territory' | 'mark-ready',
  reason?: string
) {
  switch (transition) {
    case 'mature':
      return matureOPDemand(demandId, reason);
    case 'request-info':
      return requestOPDemandInfo(demandId, reason ?? 'Precisa complementar informações.');
    case 'validate-territory':
      return validateOPDemandTerritory(demandId, reason);
    case 'mark-ready':
      return markOPDemandReady(demandId, reason);
  }
}

function localStatusFor(transition: 'mature' | 'request-info' | 'validate-territory' | 'mark-ready') {
  switch (transition) {
    case 'mature':
      return 'Maturação territorial';
    case 'request-info':
      return 'Precisa de informações';
    case 'validate-territory':
      return 'Validada territorialmente';
    case 'mark-ready':
      return 'Apta para priorização';
  }
}
