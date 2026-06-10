/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Navbar } from './shared/layout';
import HomeView from './features/home';
import { OrganicLawViewer, ArticleDetailView } from './features/organic-law';
import RepositoryHub from './features/repositories';
import IssueTracker from './features/issues';
import CivicPRHub from './features/civic-prs';
import ReleasesView from './features/releases';
import FiscalizacaoView from './features/executions';
import MeuTerritorioView from './features/territories';
import MinhaAreaView from './features/citizen-area';
import DadosPublicosView from './features/open-data';
import AdminPanel from './features/admin';
import {
  useIssues,
  usePRs,
  usePublicData,
  useVotings
} from './hooks';
import type { VoteSelection } from './hooks';

export default function App() {
  const [currentPath, setPath] = useState<string>('/');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);

  const {
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
  } = usePublicData();
  const { issues, addIssue, triageIssue } = useIssues();
  const { prs, addPR, triagePR } = usePRs({ onPRMerged: applyMergedPR });
  const { votacoes, castVote } = useVotings();

  // Notification action router
  const handleRequestNotificationPR = (prId: string) => {
    setPath('/prs');
    // We can auto-select this specific PR ID
    const matchedPr = prs.find(p => p.id === prId);
    if (matchedPr) {
      // Small timeout to allow transition
      setTimeout(() => {
        const prCard = document.getElementById(`pr-card-${prId.replace('#', '')}`);
        if (prCard) {
          prCard.click();
        }
      }, 50);
    }
  };

  // Submitting a new issue from the form
  const handleAddNewIssue = (formData: any) => {
    addIssue(formData);
    setPath('/issues');
  };

  // Submitting a new PR from the form
  const handleAddNewPR = (formData: any) => {
    addPR(formData);
    setPath('/prs');
  };

  // User casting a vote on public box
  const handleCastVote = (votingId: string, selection: VoteSelection) => {
    const receipt = castVote(votingId, selection);
    addVoteReceipt(receipt);
  };

  // Moderation / triage helper functions inside Backdoor Console
  const handleTriageIssue = (issueId: string, newStatus: any) => {
    triageIssue(issueId, newStatus);
  };

  const handleTriagePR = (prId: string, newStatus: any) => {
    triagePR(prId, newStatus);
  };

  const handleForceRunChecks = () => {
    // Toggle check indicators
    console.log("Forcing compliance checks.");
  };

  const handleSelectArticleDetail = (articleId: string) => {
    setSelectedArticleId(articleId);
    setPath(`/lei-organica/artigo/${articleId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-indigo-600 selection:text-white antialiased font-sans">
      <Navbar
        currentPath={currentPath}
        initialNotifications={notifications}
        setPath={(newPath) => {
          setPath(newPath);
          setSelectedArticleId(null);
        }}
        onRequestOpenNotification={handleRequestNotificationPR}
      />

      {/* Primary content router workspace card wrapper with center spacing constraints */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 md:p-8">
        {currentPath === '/' && (
          <HomeView
            setPath={setPath}
            stats={stats}
          />
        )}

        {currentPath === '/lei-organica' && (
          <OrganicLawViewer
            artigos={artigos}
            setPath={setPath}
            onSelectArticle={(art) => handleSelectArticleDetail(art.id)}
            onInitiatePRFromArticle={(articleNum) => {
              setPath('/prs');
            }}
          />
        )}

        {currentPath.startsWith('/lei-organica/artigo/') && selectedArticleId && (() => {
          const matchedArt = artigos.find(a => a.id === selectedArticleId);
          if (!matchedArt) return <p className="p-8 text-center text-slate-400 text-xs">Artigo não encontrado.</p>;
          return (
            <ArticleDetailView
              article={matchedArt}
              allIssues={issues}
              allPRs={prs}
              onBack={() => {
                setPath('/lei-organica');
                setSelectedArticleId(null);
              }}
              onInitiatePR={() => {
                setPath('/prs');
              }}
              setPath={setPath}
              onNavigateToPR={(prId) => {
                setPath('/prs');
                setTimeout(() => {
                  const prCard = document.getElementById(`pr-card-${prId.replace('#', '')}`);
                  if (prCard) prCard.click();
                }, 50);
              }}
              onNavigateToIssue={(issueId) => {
                setPath('/issues');
                setTimeout(() => {
                  const issueRow = document.getElementById(`issue-row-${issueId.replace('#', '')}`);
                  if (issueRow) issueRow.click();
                }, 50);
              }}
            />
          );
        })()}

        {currentPath === '/repositorios' && (
          <RepositoryHub
            repositories={repositories}
            setPath={setPath}
            onSelectRep={(slug) => setPath(`/repositorios/${slug}`)}
          />
        )}

        {currentPath === '/issues' && (
          <IssueTracker
            issues={issues}
            artigos={artigos}
            repos={repositories}
            territories={territories}
            onBackToHome={() => setPath('/')}
            onSubmitNewIssue={handleAddNewIssue}
            onNavigateToPR={(prId) => {
              setPath('/prs');
              setTimeout(() => {
                const prCard = document.getElementById(`pr-card-${prId.replace('#', '')}`);
                if (prCard) {
                  prCard.click();
                }
              }, 50);
            }}
          />
        )}

        {currentPath === '/prs' && (
          <CivicPRHub
            prs={prs}
            artigos={artigos}
            votacoes={votacoes}
            allIssues={issues}
            onBackToHome={() => setPath('/')}
            onSubmitNewPR={handleAddNewPR}
            onCastVote={handleCastVote}
          />
        )}

        {currentPath === '/votacoes' && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-5">
              <h2 className="font-display text-2xl font-extrabold text-slate-900 tracking-tight">
                Votações Urbanas e Consultas Ativas
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                Utilize as abas superiores do PR Cívico para examinar os projetos e votar diretamente no painel da Urna Virtual.
              </p>
            </div>
            <CivicPRHub
              prs={prs}
              artigos={artigos}
              votacoes={votacoes}
              allIssues={issues}
              onBackToHome={() => setPath('/')}
              onSubmitNewPR={handleAddNewPR}
              onCastVote={handleCastVote}
            />
          </div>
        )}

        {currentPath === '/releases' && (
          <ReleasesView
            releases={releases}
            onSelectPR={(prId) => {
              setPath('/prs');
              setTimeout(() => {
                const prCard = document.getElementById(`pr-card-${prId.replace('#', '')}`);
                if (prCard) {
                  prCard.click();
                }
              }, 50);
            }}
          />
        )}

        {currentPath === '/fiscalizacao' && (
          <FiscalizacaoView trackers={trackers} />
        )}

        {currentPath === '/meu-territorio' && (
          <MeuTerritorioView
            territories={territories}
            issues={issues}
            prs={prs}
            onSelectIssue={(issueId) => {
              setPath('/issues');
              setTimeout(() => {
                const issueRow = document.getElementById(`issue-row-${issueId.replace('#', '')}`);
                if (issueRow) {
                  issueRow.click();
                }
              }, 50);
            }}
            onSelectPR={(prId) => {
              setPath('/prs');
              setTimeout(() => {
                const prCard = document.getElementById(`pr-card-${prId.replace('#', '')}`);
                if (prCard) {
                  prCard.click();
                }
              }, 50);
            }}
          />
        )}

        {currentPath === '/minha-area' && (
          <MinhaAreaView
            userProfile={userProfile}
            territories={territories}
            onSelectIssue={(issueId) => {
              setPath('/issues');
              setTimeout(() => {
                const issueRow = document.getElementById(`issue-row-${issueId.replace('#', '')}`);
                if (issueRow) {
                  issueRow.click();
                }
              }, 50);
            }}
            onSelectPR={(prId) => {
              setPath('/prs');
              setTimeout(() => {
                const prCard = document.getElementById(`pr-card-${prId.replace('#', '')}`);
                if (prCard) {
                  prCard.click();
                }
              }, 50);
            }}
            votacoes={votacoes}
          />
        )}

        {currentPath === '/dados-publicos' && (
          <DadosPublicosView />
        )}

        {currentPath === '/admin' && (
          <AdminPanel
            issues={issues}
            prs={prs}
            onTriageIssue={handleTriageIssue}
            onTriagePR={handleTriagePR}
            onForceRunChecks={handleForceRunChecks}
          />
        )}
      </main>

      {/* Civic Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 shrink-0 text-center font-mono text-[10px] text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>© 2026 Município de Novo Horizonte • Código Público Eletrônico</span>
          <span>Iniciativa Open Source Licenciada sob Licença Apache 2.0</span>
        </div>
      </footer>
    </div>
  );
}
