/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { fallbackIssues } from '../app/fallback-data';
import { getIssues } from '../lib/api';
import { Issue, IssueStatus } from '../types';

export type NewIssueData = Omit<Issue, 'id' | 'createdAt' | 'status' | 'upvotes' | 'comments'>;

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

  const addIssue = (formData: NewIssueData) => {
    const nextNum = issues.length + 120;
    const newIssue: Issue = {
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

    setIssues(prev => [newIssue, ...prev]);
    return newIssue;
  };

  const triageIssue = (issueId: string, newStatus: IssueStatus) => {
    setIssues(prev =>
      prev.map(issue => (issue.id === issueId ? { ...issue, status: newStatus } : issue))
    );
  };

  return {
    issues,
    addIssue,
    triageIssue
  };
}
