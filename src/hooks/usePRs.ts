/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { fallbackPRs } from '../app/fallback-data';
import { getCivicPRs } from '../lib/api';
import { CivicPR, PRStatus } from '../types';

export type NewCivicPRData = Omit<
  CivicPR,
  'id' | 'createdAt' | 'status' | 'upvotes' | 'comments' | 'reviews' | 'checks' | 'mergeTimeline'
> & {
  upvotes?: number;
};

interface UsePRsOptions {
  onPRMerged?: (pr: CivicPR) => void;
}

export function usePRs(options: UsePRsOptions = {}) {
  const [prs, setPrs] = useState<CivicPR[]>(fallbackPRs);

  useEffect(() => {
    let isMounted = true;

    async function loadPRs() {
      try {
        const apiPRs = await getCivicPRs();
        if (isMounted) setPrs(apiPRs);
      } catch (error) {
        console.warn('Não foi possível carregar PRs da API; mantendo fallback local.', error);
      }
    }

    loadPRs();

    return () => {
      isMounted = false;
    };
  }, []);

  const addPR = (formData: NewCivicPRData) => {
    const nextPRNum = prs.length + 50;
    const newPrId = `#${nextPRNum}`;

    const newPR: CivicPR = {
      id: newPrId,
      title: formData.title,
      repository: formData.repository,
      targetTitle: formData.targetTitle,
      affectedArticles: formData.affectedArticles,
      authorName: formData.authorName,
      authorType: formData.authorType,
      status: 'Aberto para debate',
      citizenSummary: formData.citizenSummary,
      justification: formData.justification,
      diffs: formData.diffs,
      linkedIssueIds: formData.linkedIssueIds || [],
      upvotes: formData.upvotes || 1,
      comments: [
        {
          id: `comment-init-${Date.now()}`,
          authorName: 'Sistema',
          content: 'PR cívico inicializado com testes de Admissibilidade da esteira de CI em progresso.',
          createdAt: new Date().toISOString()
        }
      ],
      reviews: [],
      checks: [
        {
          id: 'chk-c-1',
          name: 'Simetria Constitucional',
          description: 'Validação frente à Constituição Federal e Estadual.',
          status: 'Aprovado',
          feedback: 'O tema de fomento à participação direta do munícipe é harmônico aos artigos 1º e 29 da CF/88.'
        },
        {
          id: 'chk-c-2',
          name: 'Lei de Responsabilidade Fiscal',
          description: 'Impacto nos limites de despesas correntes do município.',
          status: 'Atenção',
          feedback: 'Requer revisão técnica preliminar caso gere despesa com infraestrutura de rede municipal.'
        }
      ],
      createdAt: new Date().toISOString(),
      mergeTimeline: [
        {
          title: 'Abertura de Proposta Popular',
          date: 'Hoje',
          completed: true,
          description: 'Protocolo eletrônico computado no Código Público.'
        },
        {
          title: 'Testes Estáticos (CI Jurídico)',
          date: 'Hoje',
          completed: true,
          description: 'Checks de integridade constitucional validados.'
        },
        {
          title: 'Parecer Técnico da Câmara',
          date: 'Pendente',
          completed: false,
          description: 'Revisores legislativos analisam a viabilidade orgânica.'
        },
        {
          title: 'Merge na Branch Principal',
          date: 'Pendente',
          completed: false,
          description: 'Sancionada e incorporada ao texto oficial da lei.'
        }
      ]
    };

    setPrs(prev => [newPR, ...prev]);
    return newPR;
  };

  const triagePR = (prId: string, newStatus: PRStatus) => {
    const targetPR = prs.find(pr => pr.id === prId);

    setPrs(prev =>
      prev.map(pr => {
        if (pr.id !== prId) return pr;

        const updatedMergeTimeline = pr.mergeTimeline.map(step => {
          if (newStatus === 'Incorporado ao texto oficial') {
            return { ...step, completed: true };
          }

          if (newStatus === 'Em votação' && step.title === 'Parecer Técnico da Câmara') {
            return { ...step, completed: true };
          }

          return step;
        });

        return {
          ...pr,
          status: newStatus,
          mergeTimeline: updatedMergeTimeline
        };
      })
    );

    if (newStatus === 'Incorporado ao texto oficial' && targetPR) {
      options.onPRMerged?.(targetPR);
    }
  };

  return {
    prs,
    addPR,
    triagePR
  };
}
