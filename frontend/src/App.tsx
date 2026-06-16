/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import { ShieldAlert } from 'lucide-react';
import { AuthModal, useAuth } from './auth';
import { entityPath, routeEntityId, useBrowserRouter } from './app/useBrowserRouter';
import {
  useIssues,
  useOPDemands,
  useOPProposals,
  useOPVotings,
  usePRs,
  usePublicData,
  useVotings
} from './hooks';
import type { NewBudgetDemandData, NewBudgetProposalData, NewCivicPRData, NewIssueData, VoteSelection, WriteSource } from './hooks';
import {
  CitizenArea,
  ExecutionCenter,
  FlowHome,
  InstitutionalPanel,
  IssueComposer,
  IssueDetailPage,
  IssueList,
  OPDemandComposer,
  OPDemandDetailPage,
  OPDemandList,
  OPProposalList,
  OPVotingCenter,
  PRDetailPage,
  PRList,
  RepositoryIndex,
  RepositoryWorkspace,
  isRepoTab
} from './pages';
import type { RepositorySummary } from './pages';
import { PRCreationWizard } from './shared/civic';
import { Navbar, BottomNav } from './shared/layout';
import { useToast } from './shared/feedback/ToastContext';
import { motion, AnimatePresence } from 'motion/react';
import type { BudgetDemand, BudgetProposal, IssueStatus, PRStatus } from './types';

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
    userProfile,
    addVoteReceipt,
    applyMergedPR,
    refreshNormativeState
  } = usePublicData({ isAuthenticated, citizen });

  const { issues, addIssue, commentOnIssue, upvoteIssue, triageIssue } = useIssues();
  const { demands, addDemand, supportDemand, commentOnDemand, transitionDemand, groupDemand, forkDemand } = useOPDemands();
  const { proposals, createFromDemand } = useOPProposals();
  const { opVotings, openForProposal, castVote: castOPVote } = useOPVotings();
  const { prs, addPR, commentOnPR, upvotePR, triagePR } = usePRs({
    onPRMerged: applyMergedPR,
    onPRMergedRemotely: () => {
      void refreshNormativeState();
    }
  });
  const { votacoes, castVote } = useVotings();

  const selectedPRRouteId = routeEntityId(currentPath, '/prs');
  const selectedIssueRouteId = routeEntityId(currentPath, '/issues');
  const selectedDemandRouteId = currentPath.startsWith('/demandas/')
    ? decodeURIComponent(currentPath.slice('/demandas/'.length))
    : null;

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

  const repositorySummaries = repositories as RepositorySummary[];
  const fallbackRepository: RepositorySummary = {
    slug: 'lei-organica',
    name: 'Lei Orgânica Municipal',
    description: 'Kernel jurídico do município.',
    version: 'v2026.0',
    docsCount: artigos.length,
    activeIssues: issues.length,
    activePRs: prs.length,
    releasesCount: releases.length,
    status: 'Consolidado',
    category: 'Kernel'
  };

  const notifyWriteSource = (source: WriteSource, apiMessage: string) => {
    if (source === 'api') {
      pushToast('success', apiMessage);
    } else {
      pushToast('warning', 'API indisponível: ação aplicada apenas localmente.');
    }
  };

  // Erros de regra de negócio (4xx) chegam aqui: a API recusou a ação de forma
  // deliberada e nenhuma mudança local foi aplicada.
  const notifyActionRejected = (error: unknown) => {
    const message = error instanceof Error ? error.message : 'Falha inesperada.';
    pushToast('error', `Ação recusada pela plataforma: ${message}`);
  };

  const handleAddNewIssue = (formData: NewIssueData) => {
    requireAuth(authenticated => {
      void addIssue({ ...formData, authorName: authenticated.fullName })
        .then(({ issue, source }) => {
          notifyWriteSource(source, `Issue ${issue.id} registrada.`);
          setPath(entityPath('/issues', issue.id));
        })
        .catch(notifyActionRejected);
    });
  };

  const handleAddNewDemand = (formData: NewBudgetDemandData) => {
    requireAuth(() => {
      void addDemand(formData)
        .then(({ demand, source }) => {
          notifyWriteSource(source, `Demanda ${demand.id} registrada.`);
          setPath(`/demandas/${encodeURIComponent(demand.id)}`);
        })
        .catch(notifyActionRejected);
    });
  };

  const handleAddNewPR = (formData: NewCivicPRData) => {
    requireAuth(authenticated => {
      void addPR({ ...formData, authorName: authenticated.fullName })
        .then(({ pr, source }) => {
          notifyWriteSource(source, `PR cívico ${pr.id} protocolado.`);
          setPath(entityPath('/prs', pr.id));
        })
        .catch(notifyActionRejected);
    });
  };

  const handleCastVote = (votingId: string, selection: VoteSelection) => {
    requireAuth(() => {
      void castVote(votingId, selection)
        .then(receipt => {
          addVoteReceipt(receipt);
          notifyWriteSource(receipt.source, `Voto computado. Recibo: ${receipt.receipt}`);
        })
        .catch(notifyActionRejected);
    });
  };

  const handleUpvoteIssue = (issueId: string) => {
    requireAuth(() => {
      void upvoteIssue(issueId)
        .then(source => {
          notifyWriteSource(source, 'Apoio registrado na issue.');
        })
        .catch(notifyActionRejected);
    });
  };

  const handleCommentIssue = (issueId: string, content: string) => {
    requireAuth(authenticated => {
      void commentOnIssue(issueId, content, authenticated.fullName)
        .then(source => {
          notifyWriteSource(source, 'Comentário publicado.');
        })
        .catch(notifyActionRejected);
    });
  };

  const handleSupportDemand = (demandId: string) => {
    requireAuth(() => {
      void supportDemand(demandId)
        .then(source => {
          notifyWriteSource(source, 'Apoio registrado na demanda.');
        })
        .catch(notifyActionRejected);
    });
  };

  const handleCommentDemand = (demandId: string, content: string) => {
    requireAuth(authenticated => {
      void commentOnDemand(demandId, content, authenticated.fullName)
        .then(source => {
          notifyWriteSource(source, 'Comentário publicado na demanda.');
        })
        .catch(notifyActionRejected);
    });
  };

  const handleTransitionDemand = (
    demandId: string,
    transition: 'mature' | 'request-info' | 'validate-territory' | 'mark-ready',
    reason?: string
  ) => {
    requireAuth(() => {
      void transitionDemand(demandId, transition, reason)
        .then(source => {
          notifyWriteSource(source, 'Demanda movida na esteira.');
        })
        .catch(notifyActionRejected);
    });
  };

  const handleGroupDemand = (sourceId: string, targetDemandId: string, reason: string) => {
    requireAuth(() => {
      void groupDemand(sourceId, targetDemandId, reason)
        .then(source => {
          notifyWriteSource(source, 'Demanda agrupada.');
        })
        .catch(notifyActionRejected);
    });
  };

  const handleForkDemand = (
    sourceId: string,
    data: { title: string; description?: string; location?: string; category?: string; reason?: string }
  ) => {
    requireAuth(() => {
      void forkDemand(sourceId, data)
        .then(({ demand, source }) => {
          notifyWriteSource(source, `Fork ${demand.id} criado.`);
          setPath(`/demandas/${encodeURIComponent(demand.id)}`);
        })
        .catch(notifyActionRejected);
    });
  };

  const handleCreateProposal = (demand: BudgetDemand, data: NewBudgetProposalData) => {
    requireAuth(() => {
      void createFromDemand(demand, data)
        .then(({ proposal, source }) => {
          notifyWriteSource(source, `Proposta ${proposal.id} criada.`);
          setPath('/propostas');
        })
        .catch(notifyActionRejected);
    });
  };

  const handleOpenOPVoting = (proposal: BudgetProposal) => {
    requireAuth(() => {
      void openForProposal(proposal)
        .then(({ voting, source }) => {
          notifyWriteSource(source, `Votação ${voting.id} aberta.`);
          setPath('/votacoes');
        })
        .catch(notifyActionRejected);
    });
  };

  const handleCastOPVote = (votingId: string, selection: VoteSelection) => {
    requireAuth(() => {
      void castOPVote(votingId, selection)
        .then(receipt => {
          addVoteReceipt(receipt);
          notifyWriteSource(receipt.source, `Voto computado. Recibo: ${receipt.receipt}`);
        })
        .catch(notifyActionRejected);
    });
  };

  const handleUpvotePR = (prId: string) => {
    requireAuth(() => {
      void upvotePR(prId)
        .then(source => {
          notifyWriteSource(source, 'Apoio registrado no PR.');
        })
        .catch(notifyActionRejected);
    });
  };

  const handleCommentPR = (prId: string, content: string) => {
    requireAuth(authenticated => {
      void commentOnPR(prId, content, authenticated.fullName)
        .then(source => {
          notifyWriteSource(source, 'Comentário publicado no PR.');
        })
        .catch(notifyActionRejected);
    });
  };

  const handleTriageIssue = (issueId: string, newStatus: IssueStatus) => {
    requireAuth(() => {
      void triageIssue(issueId, newStatus)
        .then(source => {
          notifyWriteSource(source, `Issue ${issueId}: ${newStatus}.`);
        })
        .catch(notifyActionRejected);
    });
  };

  const handleTriagePR = (prId: string, newStatus: PRStatus) => {
    requireAuth(() => {
      void triagePR(prId, newStatus)
        .then(source => {
          const message = newStatus === 'Incorporado ao texto oficial'
            ? `Merge institucional do PR ${prId} concluído.`
            : `PR ${prId}: ${newStatus}.`;
          notifyWriteSource(source, message);
        })
        .catch(notifyActionRejected);
    });
  };

  const repoRoute = currentPath.match(/^\/repositorios\/([^/]+)(?:\/([^/]+))?/);
  const repoSlug = repoRoute?.[1] ? decodeURIComponent(repoRoute[1]) : '';
  const repoTab = isRepoTab(repoRoute?.[2]) ? repoRoute[2] : 'texto';
  const selectedRepository =
    repositorySummaries.find(repo => repo.slug === repoSlug) ??
    repositorySummaries.find(repo => repo.slug === 'lei-organica') ??
    repositorySummaries[0] ??
    fallbackRepository;
  const citizenTerritoryId = isAuthenticated
    ? citizen?.territoryId ?? userProfile.territoryId
    : undefined;
  const citizenTerritoryName = isAuthenticated
    ? citizen?.territoryName ?? userProfile.territoryName
    : undefined;
  const citizenTerritory = citizenTerritoryId || citizenTerritoryName
    ? territories.find(territory =>
        territory.id === citizenTerritoryId ||
        territory.name === citizenTerritoryName ||
        territory.name === citizenTerritoryId
      ) ?? {
        id: citizenTerritoryId ?? citizenTerritoryName ?? '',
        name: citizenTerritoryName ?? citizenTerritoryId ?? ''
      }
    : undefined;

  const page = (() => {
    if (selectedDemandRouteId) {
      return (
        <OPDemandDetailPage
          demand={demands.find(demand => demand.id === selectedDemandRouteId)}
          demands={demands}
          onBack={() => setPath('/demandas')}
          onSupport={handleSupportDemand}
          onComment={handleCommentDemand}
          onTransition={handleTransitionDemand}
          onGroup={handleGroupDemand}
          onFork={handleForkDemand}
          onCreateProposal={handleCreateProposal}
        />
      );
    }

    if (selectedIssueRouteId) {
      return (
        <IssueDetailPage
          issue={issues.find(issue => issue.id === selectedIssueRouteId)}
          prs={prs}
          onBack={() => setPath('/repositorios/lei-organica/issues')}
          onSelectPR={prId => setPath(entityPath('/prs', prId))}
          onUpvote={handleUpvoteIssue}
          onComment={handleCommentIssue}
        />
      );
    }

    if (selectedPRRouteId) {
      return (
        <PRDetailPage
          pr={prs.find(pr => pr.id === selectedPRRouteId)}
          prs={prs}
          issues={issues}
          voting={votacoes.find(voting => voting.id === prs.find(pr => pr.id === selectedPRRouteId)?.votingId)}
          onBack={() => setPath('/repositorios/lei-organica/prs')}
          onSelectIssue={issueId => setPath(entityPath('/issues', issueId))}
          onSelectPR={prId => setPath(entityPath('/prs', prId))}
          onVote={handleCastVote}
          onUpvote={handleUpvotePR}
          onComment={handleCommentPR}
        />
      );
    }

    if (currentPath === '/' || currentPath === '') {
      return (
        <FlowHome
          setPath={setPath}
        />
      );
    }


    if (currentPath === '/repositorios') {
      return (
        <RepositoryIndex
          repositories={repositorySummaries}
          issues={issues}
          prs={prs}
          releases={releases}
          setPath={setPath}
        />
      );
    }

    if (currentPath === '/issues') {
      return (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px] fade-in">
          <IssueList issues={issues} onSelect={issueId => setPath(entityPath('/issues', issueId))} />
          <IssueComposer
            repository={selectedRepository}
            articles={artigos}
            territories={territories}
            onSubmit={handleAddNewIssue}
          />
        </div>
      );
    }

    if (currentPath === '/demandas') {
      return (
        <div className="space-y-6 fade-in">
          <OPDemandList demands={demands} onSelect={demandId => setPath(`/demandas/${encodeURIComponent(demandId)}`)} />
          <OPDemandComposer
            isAuthenticated={isAuthenticated}
            currentTerritory={citizenTerritory}
            onLogin={openAuthModal}
            onSubmit={handleAddNewDemand}
          />
        </div>
      );
    }

    if (currentPath === '/propostas') {
      return (
        <OPProposalList
          proposals={proposals}
          votings={opVotings}
          onOpenVoting={handleOpenOPVoting}
          onSelectVoting={() => setPath('/votacoes')}
        />
      );
    }

    if (currentPath === '/prs') {
      return (
        <div className="grid gap-6 lg:grid-cols-[1fr_380px] fade-in">
          <PRList prs={prs} onSelect={prId => setPath(entityPath('/prs', prId))} />
          <PRCreationWizard
            repository={selectedRepository}
            articles={artigos}
            issues={issues}
            onSubmit={handleAddNewPR}
          />
        </div>
      );
    }

    if (repoRoute && selectedRepository) {
      return (
        <RepositoryWorkspace
          repository={selectedRepository}
          activeTab={repoTab}
          articles={artigos}
          issues={issues}
          prs={prs}
          votings={votacoes}
          releases={releases}
          trackers={trackers}
          territories={territories}
          setPath={setPath}
          onSubmitIssue={handleAddNewIssue}
          onSubmitPR={handleAddNewPR}
          onVote={handleCastVote}
        />
      );
    }

    if (currentPath === '/votacoes') {
      return (
        <OPVotingCenter
          votings={opVotings}
          onVote={handleCastOPVote}
        />
      );
    }

    if (currentPath === '/fiscalizacao') {
      return <ExecutionCenter trackers={trackers} prs={prs} onSelectPR={prId => setPath(entityPath('/prs', prId))} />;
    }

    if (currentPath === '/minha-area') {
      return (
        <CitizenArea
          isAuthenticated={isAuthenticated}
          onLogin={openAuthModal}
          profile={userProfile}
          territories={territories}
          onSelectIssue={issueId => setPath(entityPath('/issues', issueId))}
          onSelectPR={prId => setPath(entityPath('/prs', prId))}
          onSelectVoting={() => setPath('/votacoes')}
        />
      );
    }

    if (currentPath === '/admin') {
      if (!isAuthenticated) {
        return (
          <div className="flex h-full items-center justify-center fade-in">
            <div className="glass-panel p-8 text-center rounded-[20px] max-w-sm w-full">
              <ShieldAlert className="mx-auto h-12 w-12 text-[var(--color-git-muted)] mb-4" />
              <h1 className="font-display text-xl font-bold text-white">Acesso Institucional</h1>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-git-muted)] mb-6">
                Esta área é restrita a servidores e procuradores para gestão do processo legislativo.
              </p>
              <button onClick={openAuthModal} className="btn-primary w-full">Fazer login</button>
            </div>
          </div>
        );
      }
      
      if (citizen?.role === 'Cidadão' || !citizen?.role) {
        return (
          <div className="flex h-full items-center justify-center fade-in">
            <div className="glass-panel p-8 text-center rounded-[20px] max-w-sm w-full border border-[rgba(248,113,113,0.15)] shadow-[0_0_40px_rgba(248,113,113,0.05)]">
              <ShieldAlert className="mx-auto h-12 w-12 text-[var(--color-git-red)] mb-4" />
              <h1 className="font-display text-xl font-bold text-white">Acesso Negado</h1>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-git-muted)] mb-6">
                Sua conta não possui permissão administrativa. Apenas perfis institucionais têm acesso ao painel de triagem.
              </p>
              <button onClick={() => setPath('/')} className="btn-secondary w-full">Voltar ao início</button>
            </div>
          </div>
        );
      }

      return (
        <InstitutionalPanel
          issues={issues}
          prs={prs}
          territories={territories}
          isAuthenticated={isAuthenticated}
          onTriageIssue={handleTriageIssue}
          onTriagePR={handleTriagePR}
          stats={stats}
        />
      );
    }

    if (currentPath === '/lei-organica' && selectedRepository) {
      return (
        <RepositoryWorkspace
          repository={selectedRepository}
          activeTab="texto"
          articles={artigos}
          issues={issues}
          prs={prs}
          votings={votacoes}
          releases={releases}
          trackers={trackers}
          territories={territories}
          setPath={setPath}
          onSubmitIssue={handleAddNewIssue}
          onSubmitPR={handleAddNewPR}
          onVote={handleCastVote}
        />
      );
    }

    return <FlowHome setPath={setPath} />;
  })();

  return (
    <div className="flex min-h-screen justify-center bg-[#020408]">
      {/* outer ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute left-1/2 top-0 -translate-x-1/2 w-[120%] h-[60%]"
          style={{
            background:
              'radial-gradient(ellipse at 50% -20%, rgba(56,189,248,0.07) 0%, transparent 60%)',
          }}
        />
      </div>

      <div className="relative flex min-h-screen w-full max-w-md flex-col overflow-hidden border-x border-[var(--color-git-border)] bg-[var(--color-git-bg)] shadow-[0_0_120px_rgba(0,0,0,0.9)]">
        {/* ── Animated Background Blobs ── */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div
            className="absolute top-[-15%] left-[-25%] w-[80%] h-[50%] opacity-30 blur-[90px]"
            style={{
              background: 'radial-gradient(ellipse, rgba(56,189,248,0.55), transparent 65%)',
              animation: 'blob 9s ease-in-out infinite',
            }}
          />
          <div
            className="absolute top-[35%] right-[-25%] w-[70%] h-[55%] opacity-20 blur-[80px]"
            style={{
              background: 'radial-gradient(ellipse, rgba(192,132,252,0.6), transparent 65%)',
              animation: 'blob 11s ease-in-out infinite reverse',
            }}
          />
          <div
            className="absolute bottom-[-10%] left-[10%] w-[90%] h-[45%] opacity-15 blur-[100px]"
            style={{
              background: 'radial-gradient(ellipse, rgba(52,211,153,0.5), transparent 65%)',
              animation: 'blob 13s ease-in-out infinite 2s',
            }}
          />
          <div className="absolute inset-0 bg-grid opacity-40" />
        </div>

        <Navbar currentPath={currentPath} setPath={setPath} />

        <main className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide pb-24 px-4 pt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPath}
              initial={{ opacity: 0, y: 18, scale: 0.975 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.985 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="h-full w-full"
            >
              {page}
            </motion.div>
          </AnimatePresence>
        </main>

        <BottomNav currentPath={currentPath} setPath={setPath} />
        <AuthModal territories={territories} />
      </div>
    </div>
  );
}
