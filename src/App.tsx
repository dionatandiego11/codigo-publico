/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
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
import type { VoteSelection, WriteSource } from './hooks';
import { AuthModal, useAuth } from './auth';
import { useToast } from './shared/feedback/ToastContext';
import { entityPath, routeEntityId, useBrowserRouter } from './app/useBrowserRouter';

export default function App() {
  const { currentPath, setPath } = useBrowserRouter();
  const { citizen, isAuthenticated, requireAuth, openAuthModal } = useAuth();
  const { pushToast } = useToast();

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
    applyMergedPR,
    refreshNormativeState
  } = usePublicData({ isAuthenticated });
  const { issues, addIssue, commentOnIssue, upvoteIssue, triageIssue } = useIssues();
  const { prs, addPR, commentOnPR, upvotePR, triagePR } = usePRs({
    onPRMerged: applyMergedPR,
    onPRMergedRemotely: () => {
      void refreshNormativeState();
    }
  });
  const { votacoes, castVote } = useVotings();

  // Deep links: /prs/046, /issues/118, /lei-organica/artigo/art-12
  const selectedPRRouteId = routeEntityId(currentPath, '/prs');
  const selectedIssueRouteId = routeEntityId(currentPath, '/issues');
  const selectedArticleId = currentPath.startsWith('/lei-organica/artigo/')
    ? decodeURIComponent(currentPath.slice('/lei-organica/artigo/'.length))
    : null;

  // Feedback de sessão (login/logout)
  const previousCitizenIdRef = useRef<string | null>(null);
  useEffect(() => {
    const previousId = previousCitizenIdRef.current;
    if (citizen && citizen.id !== previousId) {
      pushToast('success', `Sessão iniciada como ${citizen.fullName}.`);
    } else if (!citizen && previousId) {
      pushToast('info', 'Sessão encerrada.');
    }
    previousCitizenIdRef.current = citizen?.id ?? null;
  }, [citizen, pushToast]);

  const notifyWriteSource = (source: WriteSource, apiMessage: string) => {
    if (source === 'api') {
      pushToast('success', apiMessage);
    } else {
      pushToast('warning', 'API indisponível ou sem permissão: ação aplicada apenas localmente (modo demonstração).');
    }
  };

  // Notification action router
  const handleRequestNotificationPR = (prId: string) => {
    setPath(entityPath('/prs', prId));
  };

  // Submitting a new issue from the form (requires authenticated citizen)
  const handleAddNewIssue = (formData: any) => {
    requireAuth(authenticated => {
      void addIssue({ ...formData, authorName: authenticated.fullName }).then(({ issue, source }) => {
        notifyWriteSource(source, `Issue ${issue.id} registrada e auditada na plataforma.`);
      });
      setPath('/issues');
    });
  };

  // Submitting a new PR from the form (requires authenticated citizen)
  const handleAddNewPR = (formData: any) => {
    requireAuth(authenticated => {
      void addPR({ ...formData, authorName: authenticated.fullName }).then(({ pr, source }) => {
        notifyWriteSource(source, `PR cívico ${pr.id} protocolado para debate público.`);
      });
      setPath('/prs');
    });
  };

  // User casting a vote on public box (requires authenticated citizen)
  const handleCastVote = (votingId: string, selection: VoteSelection) => {
    requireAuth(() => {
      void castVote(votingId, selection).then(receipt => {
        addVoteReceipt(receipt);
        notifyWriteSource(receipt.source, `Voto computado com sigilo. Recibo: ${receipt.receipt}`);
      });
    });
  };

  // Civic engagement actions gated by authentication
  const handleUpvoteIssue = (issueId: string) => {
    requireAuth(() => {
      void upvoteIssue(issueId).then(source => {
        notifyWriteSource(source, 'Apoio registrado nesta demanda.');
      });
    });
  };

  const handleCommentIssue = (issueId: string, content: string) => {
    requireAuth(authenticated => {
      void commentOnIssue(issueId, content, authenticated.fullName).then(source => {
        notifyWriteSource(source, 'Comentário publicado na linha do tempo.');
      });
    });
  };

  const handleUpvotePR = (prId: string) => {
    requireAuth(() => {
      void upvotePR(prId).then(source => {
        notifyWriteSource(source, 'Apoio registrado nesta proposta.');
      });
    });
  };

  const handleCommentPR = (prId: string, content: string) => {
    requireAuth(authenticated => {
      void commentOnPR(prId, content, authenticated.fullName).then(source => {
        notifyWriteSource(source, 'Manifestação publicada no debate cívico.');
      });
    });
  };

  // Moderation / triage actions inside the admin console
  const handleTriageIssue = (issueId: string, newStatus: any) => {
    requireAuth(() => {
      void triageIssue(issueId, newStatus).then(source => {
        notifyWriteSource(source, `Status da issue ${issueId} atualizado para "${newStatus}".`);
      });
    });
  };

  const handleTriagePR = (prId: string, newStatus: any) => {
    requireAuth(() => {
      void triagePR(prId, newStatus).then(source => {
        const apiMessage = newStatus === 'Incorporado ao texto oficial'
          ? `Merge institucional do PR ${prId} concluído: release legislativa gerada.`
          : `Status do PR ${prId} atualizado para "${newStatus}".`;
        notifyWriteSource(source, apiMessage);
      });
    });
  };

  const handleForceRunChecks = () => {
    pushToast('info', 'Checks institucionais reexecutados (simulação).');
  };

  const handleSelectArticleDetail = (articleId: string) => {
    setPath(`/lei-organica/artigo/${encodeURIComponent(articleId)}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-indigo-600 selection:text-white antialiased font-sans">
      <Navbar
        currentPath={currentPath}
        initialNotifications={notifications}
        setPath={setPath}
        onRequestOpenNotification={handleRequestNotificationPR}
      />

      {/* Primary content router workspace card wrapper with center spacing constraints */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 sm:p-6 md:p-8">
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

        {selectedArticleId && (() => {
          const matchedArt = artigos.find(a => a.id === selectedArticleId);
          if (!matchedArt) return <p className="p-8 text-center text-slate-400 text-xs">Artigo não encontrado.</p>;
          return (
            <ArticleDetailView
              article={matchedArt}
              allIssues={issues}
              allPRs={prs}
              onBack={() => setPath('/lei-organica')}
              onInitiatePR={() => {
                setPath('/prs');
              }}
              setPath={setPath}
              onNavigateToPR={(prId) => setPath(entityPath('/prs', prId))}
              onNavigateToIssue={(issueId) => setPath(entityPath('/issues', issueId))}
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

        {(currentPath === '/issues' || selectedIssueRouteId) && (
          <IssueTracker
            issues={issues}
            artigos={artigos}
            repos={repositories}
            territories={territories}
            initialSelectedId={selectedIssueRouteId}
            onSelectedChange={(issueId) =>
              setPath(issueId ? entityPath('/issues', issueId) : '/issues')
            }
            onBackToHome={() => setPath('/')}
            onSubmitNewIssue={handleAddNewIssue}
            onUpvoteIssue={handleUpvoteIssue}
            onCommentIssue={handleCommentIssue}
            currentUserName={citizen?.fullName}
            onNavigateToPR={(prId) => setPath(entityPath('/prs', prId))}
          />
        )}

        {(currentPath === '/prs' || selectedPRRouteId) && (
          <CivicPRHub
            prs={prs}
            artigos={artigos}
            votacoes={votacoes}
            allIssues={issues}
            initialSelectedId={selectedPRRouteId}
            onSelectedChange={(prId) =>
              setPath(prId ? entityPath('/prs', prId) : '/prs')
            }
            onBackToHome={() => setPath('/')}
            onSubmitNewPR={handleAddNewPR}
            onCastVote={handleCastVote}
            onUpvotePR={handleUpvotePR}
            onCommentPR={handleCommentPR}
            currentUserName={citizen?.fullName}
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
              onUpvotePR={handleUpvotePR}
              onCommentPR={handleCommentPR}
              currentUserName={citizen?.fullName}
            />
          </div>
        )}

        {currentPath === '/releases' && (
          <ReleasesView
            releases={releases}
            onSelectPR={(prId) => setPath(entityPath('/prs', prId))}
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
            onSelectIssue={(issueId) => setPath(entityPath('/issues', issueId))}
            onSelectPR={(prId) => setPath(entityPath('/prs', prId))}
          />
        )}

        {currentPath === '/minha-area' && (
          <MinhaAreaView
            userProfile={userProfile}
            territories={territories}
            isAuthenticated={isAuthenticated}
            onRequestLogin={openAuthModal}
            onSelectIssue={(issueId) => setPath(entityPath('/issues', issueId))}
            onSelectPR={(prId) => setPath(entityPath('/prs', prId))}
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

      {/* Citizen authentication modal (login / register) */}
      <AuthModal territories={territories} />

      {/* Civic Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 shrink-0 text-center font-mono text-[10px] text-slate-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>© 2026 Município de Novo Horizonte • Código Público Eletrônico</span>
          <span>Iniciativa Open Source Licenciada sob Licença Apache 2.0</span>
        </div>
      </footer>
    </div>
  );
}
