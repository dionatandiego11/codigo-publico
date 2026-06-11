/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { isBusinessError } from '../api/client';
import { fallbackIssues } from '../app/fallback-data';
import {
  createIssue as apiCreateIssue,
  createIssueComment as apiCreateIssueComment,
  getIssues,
  updateIssueStatus as apiUpdateIssueStatus,
  upvoteIssue as apiUpvoteIssue
} from '../lib/api';
import { Issue, IssueStatus } from '../types';

export type NewIssueData = Omit<Issue, 'id' | 'createdAt' | 'status' | 'upvotes' | 'comments'>;

/** Indica se a escrita foi persistida na API ou apenas simulada localmente. */
export type WriteSource = 'api' | 'local';

export function useIssues() {
  const [issues, setIssues] = useState<Issue[]>(fallbackIssues);

  useEffect(() => {
    let isMounted = true;

    async function loadIssues() {
      try {
        const apiIssues = await getIssues();
        if (isMounted) setIssues(apiIssues);
      } catch (error) {
        console.warn('Não foi possível carregar issues da API; mantendo fallback local.', error);
      }
    }

    loadIssues();

    return () => {
      isMounted = false;
    };
  }, []);

  const buildLocalIssue = (formData: NewIssueData): Issue => {
    const nextNum = issues.length + 120;
    return {
      id: `#${nextNum}`,
      title: formData.title,
      type: formData.type,
      territory: formData.territory,
      theme: formData.theme,
      description: formData.description,
      authorName: formData.authorName,
      createdAt: new Date().toISOString(),
      status: 'Aberta',
      upvotes: 1,
      comments: [],
      assignedDepartment: formData.assignedDepartment,
      relatedArticleId: formData.relatedArticleId,
      relatedRepository: formData.relatedRepository
    };
  };

  const addIssue = async (formData: NewIssueData): Promise<{ issue: Issue; source: WriteSource }> => {
    try {
      const created = await apiCreateIssue({
        title: formData.title,
        type: formData.type,
        territory: formData.territory,
        theme: formData.theme,
        description: formData.description,
        assignedDepartment: formData.assignedDepartment,
        relatedArticleId: formData.relatedArticleId,
        relatedRepository: formData.relatedRepository
      });

      setIssues(prev => [created, ...prev]);
      return { issue: created, source: 'api' };
    } catch (error) {
      if (isBusinessError(error)) throw error;
      console.warn('Falha ao registrar issue na API; aplicando registro local.', error);
      const localIssue = buildLocalIssue(formData);
      setIssues(prev => [localIssue, ...prev]);
      return { issue: localIssue, source: 'local' };
    }
  };

  const commentOnIssue = async (issueId: string, content: string, authorName: string): Promise<WriteSource> => {
    let comment: Issue['comments'][number];
    let source: WriteSource = 'api';

    try {
      comment = await apiCreateIssueComment(issueId, content);
    } catch (error) {
      if (isBusinessError(error)) throw error;
      console.warn('Falha ao registrar comentário na API; aplicando comentário local.', error);
      source = 'local';
      comment = {
        id: `ic-local-${Date.now()}`,
        authorName,
        content,
        createdAt: new Date().toISOString()
      };
    }

    setIssues(prev =>
      prev.map(issue =>
        issue.id === issueId ? { ...issue, comments: [...issue.comments, comment] } : issue
      )
    );

    return source;
  };

  const upvoteIssue = async (issueId: string): Promise<WriteSource> => {
    try {
      const updated = await apiUpvoteIssue(issueId);
      setIssues(prev => prev.map(issue => (issue.id === updated.id ? updated : issue)));
      return 'api';
    } catch (error) {
      if (isBusinessError(error)) throw error;
      console.warn('Falha ao registrar apoio na API; aplicando apoio local.', error);
      setIssues(prev =>
        prev.map(issue =>
          issue.id === issueId ? { ...issue, upvotes: issue.upvotes + 1 } : issue
        )
      );
      return 'local';
    }
  };

  const applyLocalTriage = (issueId: string, newStatus: IssueStatus) => {
    setIssues(prev =>
      prev.map(issue => (issue.id === issueId ? { ...issue, status: newStatus } : issue))
    );
  };

  const triageIssue = async (issueId: string, newStatus: IssueStatus): Promise<WriteSource> => {
    try {
      const updated = await apiUpdateIssueStatus(issueId, newStatus);
      setIssues(prev => prev.map(issue => (issue.id === updated.id ? updated : issue)));
      return 'api';
    } catch (error) {
      if (isBusinessError(error)) throw error;
      console.warn('Falha ao triar issue na API; aplicando triagem local.', error);
      applyLocalTriage(issueId, newStatus);
      return 'local';
    }
  };

  return {
    issues,
    addIssue,
    commentOnIssue,
    upvoteIssue,
    triageIssue
  };
}
