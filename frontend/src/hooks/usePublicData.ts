/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
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
  getReleases,
  getRepositories,
  getTerritories,
  PublicStats
} from '../lib/api';
import {
  Citizen,
  CitizenDashboardData,
  CivicPR,
  ExecutionTracker,
  LawArticle,
  Release,
  Territory
} from '../types';

export type CitizenVoteReceipt = CitizenDashboardData['votedList'][number];

interface UsePublicDataOptions {
  isAuthenticated?: boolean;
  citizen?: Citizen | null;
}

function dashboardCitizenId(citizen: Citizen): string {
  if (citizen.id.startsWith('CP-')) return citizen.id;
  return `CP-CITIZEN-${citizen.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

function profileFromCitizen(
  citizen: Citizen,
  previous?: CitizenDashboardData
): CitizenDashboardData {
  const citizenId = dashboardCitizenId(citizen);
  const shouldKeepLists = previous?.citizenId === citizenId;

  return {
    name: citizen.fullName,
    email: citizen.email ?? '',
    territoryId: citizen.territoryId ?? previous?.territoryId ?? '',
    territoryName: citizen.territoryName ?? previous?.territoryName,
    registeredAt: citizen.createdAt,
    citizenId,
    createdIssues: shouldKeepLists ? previous.createdIssues : [],
    createdPRs: shouldKeepLists ? previous.createdPRs ?? [] : [],
    votedList: shouldKeepLists ? previous.votedList : [],
    supportedPRs: shouldKeepLists ? previous.supportedPRs : []
  };
}

export function usePublicData(options: UsePublicDataOptions = {}) {
  const { isAuthenticated = false, citizen = null } = options;

  const [artigos, setArtigos] = useState<LawArticle[]>(fallbackArticles);
  const [releases, setReleases] = useState<Release[]>(fallbackReleases);
  const [trackers, setTrackers] = useState<ExecutionTracker[]>(fallbackExecutions);
  const [territories, setTerritories] = useState<Territory[]>(fallbackTerritories);
  const [repositories, setRepositories] = useState(fallbackRepositories);
  const [stats, setStats] = useState<PublicStats>(fallbackStats);
  const [notifications] = useState(fallbackNotifications);
  const [userProfile, setUserProfile] = useState<CitizenDashboardData>(fallbackCitizenDashboard);

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
          apiRepositories
        ] = await Promise.all([
          getOrganicLawArticles(),
          getReleases(),
          getExecutions(),
          getPublicStats(),
          getTerritories(),
          getRepositories()
        ]);

        if (!isMounted) return;

        setArtigos(apiArtigos);
        setReleases(apiReleases);
        setTrackers(apiTrackers);
        setStats(apiStats);
        setTerritories(apiTerritories);
        setRepositories(apiRepositories);
      } catch (error) {
        console.warn('Não foi possível carregar dados públicos da API; mantendo fallback local.', error);
      }
    }

    loadPublicData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Painel pessoal: carregado da API apenas com sessão ativa.
  useEffect(() => {
    if (!isAuthenticated) {
      setUserProfile(fallbackCitizenDashboard);
      return;
    }

    if (citizen) {
      setUserProfile(previous => profileFromCitizen(citizen, previous));
    }

    let isMounted = true;

    getCitizenDashboard()
      .then(dashboard => {
        if (isMounted) setUserProfile(dashboard);
      })
      .catch(error => {
        console.warn('Não foi possível carregar o painel do cidadão; mantendo dados locais.', error);
      });

    return () => {
      isMounted = false;
    };
  }, [
    isAuthenticated,
    citizen?.id,
    citizen?.fullName,
    citizen?.email,
    citizen?.territoryId,
    citizen?.territoryName,
    citizen?.createdAt
  ]);

  const addVoteReceipt = (receipt: CitizenVoteReceipt) => {
    setUserProfile(prev => ({
      ...prev,
      votedList: [receipt, ...prev.votedList]
    }));
  };

  // Após um merge institucional real, o texto da lei e as releases mudam no
  // backend; recarrega ambos para refletir o estado oficial.
  const refreshNormativeState = useCallback(async () => {
    try {
      const [apiArtigos, apiReleases] = await Promise.all([
        getOrganicLawArticles(),
        getReleases()
      ]);

      setArtigos(apiArtigos);
      setReleases(apiReleases);
    } catch (error) {
      console.warn('Não foi possível recarregar o estado normativo após o merge.', error);
    }
  }, []);

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
    applyMergedPR,
    refreshNormativeState
  };
}
