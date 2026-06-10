/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import {
  fallbackArticles,
  fallbackCitizenDashboard,
  fallbackExecutions,
  fallbackNotifications,
  fallbackReleases,
  fallbackRepositories,
  fallbackStats,
  fallbackTerritories
} from '../app/fallback-data';
import {
  getCitizenDashboard,
  getExecutions,
  getOrganicLawArticles,
  getPublicStats,
  getRepositories,
  getReleases,
  getTerritories,
  PublicStats
} from '../lib/api';
import { CivicPR, ExecutionTracker, LawArticle, Release, Territory } from '../types';

type CitizenDashboard = typeof fallbackCitizenDashboard;
export type CitizenVoteReceipt = CitizenDashboard['votedList'][number];

export function usePublicData() {
  const [artigos, setArtigos] = useState<LawArticle[]>(fallbackArticles);
  const [releases, setReleases] = useState<Release[]>(fallbackReleases);
  const [trackers, setTrackers] = useState<ExecutionTracker[]>(fallbackExecutions);
  const [territories, setTerritories] = useState<Territory[]>(fallbackTerritories);
  const [repositories, setRepositories] = useState(fallbackRepositories);
  const [stats, setStats] = useState<PublicStats>(fallbackStats);
  const [notifications] = useState(fallbackNotifications);
  const [userProfile, setUserProfile] = useState(fallbackCitizenDashboard);

  useEffect(() => {
    let isMounted = true;

    async function loadPublicData() {
      try {
        const [
          apiArtigos,
          apiReleases,
          apiTrackers,
          apiStats,
          apiTerritories,
          apiRepositories,
          apiCitizenDashboard
        ] = await Promise.all([
          getOrganicLawArticles(),
          getReleases(),
          getExecutions(),
          getPublicStats(),
          getTerritories(),
          getRepositories(),
          getCitizenDashboard()
        ]);

        if (!isMounted) return;

        setArtigos(apiArtigos);
        setReleases(apiReleases);
        setTrackers(apiTrackers);
        setStats(apiStats);
        setTerritories(apiTerritories);
        setRepositories(apiRepositories);
        setUserProfile(apiCitizenDashboard);
      } catch (error) {
        console.warn('Não foi possível carregar dados públicos da API; mantendo fallback local.', error);
      }
    }

    loadPublicData();

    return () => {
      isMounted = false;
    };
  }, []);

  const addVoteReceipt = (receipt: CitizenVoteReceipt) => {
    setUserProfile(prev => ({
      ...prev,
      votedList: [receipt, ...prev.votedList]
    }));
  };

  const applyMergedPR = (targetPr: CivicPR) => {
    if (!targetPr.diffs || targetPr.diffs.length === 0) return;

    const firstDiff = targetPr.diffs[0];

    setArtigos(prev =>
      prev.map(art => {
        if (art.number === firstDiff.articleNumber) {
          return {
            ...art,
            content: firstDiff.afterText,
            amendmentNumber: `Emenda Cívica Merged ${targetPr.id}`,
            version: 'v2026.1-merged-pop'
          };
        }

        return art;
      })
    );

    const nextRelease: Release = {
      id: 'v2026.1-pop',
      title: `Release Especial — Incorporação Popular ${targetPr.id}`,
      date: '10/06/2026',
      repositoryName: 'Lei Orgânica Municipal',
      changelog: [
        `Incorporação do PR Cívico ${targetPr.id} regulando: "${targetPr.title}"`,
        `Atualização do Artigo ${firstDiff.articleNumber} no kernel municipal.`,
        'Saneamento estático de todas as licitações correlacionadas via CI Jurídico'
      ],
      incorporatedPRIds: [targetPr.id],
      affectedArticlesCount: 1,
      officialDocumentUrl: 'Diário Oficial Online — SEI nº 29A9',
      promulgatedBy: 'Mesa Organizadora Popular e Cidadania Ativa'
    };

    setReleases(prev => [nextRelease, ...prev]);
  };

  return {
    artigos,
    releases,
    trackers,
    territories,
    repositories,
    stats,
    notifications,
    userProfile,
    addVoteReceipt,
    applyMergedPR
  };
}
