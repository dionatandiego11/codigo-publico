/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { isBusinessError } from '../api/client';
import { fallbackPRs } from '../app/fallback-data';
import {
  createCivicPR as apiCreateCivicPR,
  createPRComment as apiCreatePRComment,
  getCivicPRs,
  mergePR as apiMergePR,
  MergePRResponse,
  updatePRStatus as apiUpdatePRStatus,
  upvotePR as apiUpvotePR
} from '../lib/api';
import { CivicPR, PRStatus } from '../types';
import type { WriteSource } from './useIssues';

export type NewCivicPRData = Omit<
  CivicPR,
  'id' | 'createdAt' | 'status' | 'upvotes' | 'comments' | 'reviews' | 'checks' | 'mergeTimeline'
> & {
  upvotes?: number;
};

interface UsePRsOptions {
  /** Merge simulado localmente (API indisponível ou sem permissão). */
  onPRMerged?: (pr: CivicPR) => void;
  /** Merge institucional efetivado pelo backend. */
  onPRMergedRemotely?: (response: MergePRResponse) => void;
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

  const buildLocalPR = (formData: NewCivicPRData): CivicPR => {
    const nextPRNum = prs.length + 50;
    const newPrId = `#${nextPRNum}`;

    return {
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
  };

  const addPR = async (formData: NewCivicPRData): Promise<{ pr: CivicPR; source: WriteSource }> => {
    try {
      const created = await apiCreateCivicPR({
        title: formData.title,
        repository: formData.repository,
        targetTitle: formData.targetTitle,
        affectedArticles: formData.affectedArticles,
        authorType: formData.authorType,
        citizenSummary: formData.citizenSummary,
        justification: formData.justification,
        diffs: formData.diffs,
        linkedIssueIds: formData.linkedIssueIds || []
      });

      setPrs(prev => [created, ...prev]);
      return { pr: created, source: 'api' };
    } catch (error) {
      if (isBusinessError(error)) throw error;
      console.warn('Falha ao registrar PR cívico na API; aplicando registro local.', error);
      const localPR = buildLocalPR(formData);
      setPrs(prev => [localPR, ...prev]);
      return { pr: localPR, source: 'local' };
    }
  };

  const commentOnPR = async (prId: string, content: string, authorName: string): Promise<WriteSource> => {
    let comment: CivicPR['comments'][number];
    let source: WriteSource = 'api';

    try {
      comment = await apiCreatePRComment(prId, content);
    } catch (error) {
      if (isBusinessError(error)) throw error;
      console.warn('Falha ao registrar comentário na API; aplicando comentário local.', error);
      source = 'local';
      comment = {
        id: `local-pr-c-${Date.now()}`,
        authorName,
        content,
        createdAt: new Date().toISOString()
      };
    }

    setPrs(prev =>
      prev.map(pr => (pr.id === prId ? { ...pr, comments: [...pr.comments, comment] } : pr))
    );

    return source;
  };

  const upvotePR = async (prId: string): Promise<WriteSource> => {
    try {
      const updated = await apiUpvotePR(prId);
      setPrs(prev => prev.map(pr => (pr.id === updated.id ? updated : pr)));
      return 'api';
    } catch (error) {
      if (isBusinessError(error)) throw error;
      console.warn('Falha ao registrar apoio na API; aplicando apoio local.', error);
      setPrs(prev =>
        prev.map(pr => (pr.id === prId ? { ...pr, upvotes: pr.upvotes + 1 } : pr))
      );
      return 'local';
    }
  };

  const applyLocalTriage = (prId: string, newStatus: PRStatus) => {
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

  const triagePR = async (prId: string, newStatus: PRStatus): Promise<WriteSource> => {
    // Incorporação ao texto oficial segue o rito formal: endpoint de merge
    // institucional, que aplica os diffs e gera a release legislativa.
    if (newStatus === 'Incorporado ao texto oficial') {
      try {
        const response = await apiMergePR(prId, {
          promulgatedBy: 'Console Administrativo — Código Público',
          formalApprovalReference: `Triagem administrativa de ${new Date().toLocaleDateString('pt-BR')}`
        });

        setPrs(prev => prev.map(pr => (pr.id === response.pr.id ? response.pr : pr)));
        options.onPRMergedRemotely?.(response);
        return 'api';
      } catch (error) {
        if (isBusinessError(error)) throw error;
        console.warn('Falha no merge institucional via API; aplicando merge local.', error);
        applyLocalTriage(prId, newStatus);
        return 'local';
      }
    }

    try {
      const updated = await apiUpdatePRStatus(prId, newStatus);
      setPrs(prev => prev.map(pr => (pr.id === updated.id ? updated : pr)));
      return 'api';
    } catch (error) {
      if (isBusinessError(error)) throw error;
      console.warn('Falha ao triar PR na API; aplicando triagem local.', error);
      applyLocalTriage(prId, newStatus);
      return 'local';
    }
  };

  return {
    prs,
    addPR,
    commentOnPR,
    upvotePR,
    triagePR
  };
}
