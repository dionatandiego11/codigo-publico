/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Activity,
  AlertCircle,
  BookOpen,
  GitBranch,
  GitPullRequest,
  History,
  Vote
} from 'lucide-react';

export interface RepositorySummary {
  slug: string;
  name: string;
  description: string;
  version: string;
  docsCount: number;
  activeIssues: number;
  activePRs: number;
  releasesCount: number;
  status: string;
  category: string;
}

export type RepoTab = 'texto' | 'issues' | 'prs' | 'votacoes' | 'branches' | 'releases' | 'fiscalizacao';

export const repoTabs: { id: RepoTab; label: string; icon: typeof BookOpen }[] = [
  { id: 'texto', label: 'Texto', icon: BookOpen },
  { id: 'issues', label: 'Issues', icon: AlertCircle },
  { id: 'prs', label: 'PRs', icon: GitPullRequest },
  { id: 'votacoes', label: 'Votações', icon: Vote },
  { id: 'branches', label: 'Branches', icon: GitBranch },
  { id: 'releases', label: 'Releases', icon: History },
  { id: 'fiscalizacao', label: 'Fiscalização', icon: Activity }
];

export function repoPath(slug: string, tab: RepoTab = 'texto') {
  return `/repositorios/${encodeURIComponent(slug)}/${tab}`;
}

export function isRepoTab(value: string | undefined): value is RepoTab {
  return repoTabs.some(tab => tab.id === value);
}

export function isOrganicLawRepository(repo: RepositorySummary) {
  return repo.slug === 'lei-organica' || repo.name.toLowerCase().includes('lei orgânica');
}

export function textMatchesRepository(value: string | undefined, repo: RepositorySummary) {
  const normalized = (value ?? '').toLowerCase();
  if (isOrganicLawRepository(repo)) {
    return normalized === '' || normalized.includes('lei orgânica') || normalized.includes('lei organica');
  }

  return normalized.includes(repo.name.toLowerCase()) || normalized.includes(repo.slug.replaceAll('-', ' '));
}
