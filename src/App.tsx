/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Navbar from './components/Navbar';
import HomeView from './components/HomeView';
import OrganicLawViewer from './components/OrganicLawViewer';
import ArticleDetailView from './components/ArticleDetailView';
import RepositoryHub from './components/RepositoryHub';
import IssueTracker from './components/IssueTracker';
import CivicPRHub from './components/CivicPRHub';
import ReleasesView from './components/ReleasesView';
import FiscalizacaoView from './components/FiscalizacaoView';
import MeuTerritorioView from './components/MeuTerritorioView';
import MinhaAreaView from './components/MinhaAreaView';
import DadosPublicosView from './components/DadosPublicosView';
import AdminPanel from './components/AdminPanel';

import {
  MOCK_ARTIGOS,
  MOCK_ISSUES,
  MOCK_PRS,
  MOCK_VOTACOES,
  MOCK_RELEASES,
  MOCK_FISCALIZACOES,
  MOCK_REPOSITORIOS,
  MOCK_MEB,
  MOCK_ESTATISTICAS
} from './lib/mock-data';

import { Issue, CivicPR, Voting, LawArticle, ExecutionTracker } from './types';

export default function App() {
  const [currentPath, setPath] = useState<string>('/');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);

  // Core application states
  const [artigos, setArtigos] = useState<LawArticle[]>(MOCK_ARTIGOS);
  const [issues, setIssues] = useState<Issue[]>(MOCK_ISSUES);
  const [prs, setPrs] = useState<CivicPR[]>(MOCK_PRS);
  const [votacoes, setVotacoes] = useState<Voting[]>(MOCK_VOTACOES);
  const [releases, setReleases] = useState(MOCK_RELEASES);
  const [trackers, setTrackers] = useState<ExecutionTracker[]>(MOCK_FISCALIZACOES);
  
  // Local session state
  const [userProfile, setUserProfile] = useState(MOCK_MEB);

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
    const nextNum = issues.length + 120;
    const newIssueObj: Issue = {
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

    setIssues([newIssueObj, ...issues]);
    setPath('/issues');
  };

  // Submitting a new PR from the form
  const handleAddNewPR = (formData: any) => {
    const nextPRNum = prs.length + 50;
    const newPrId = `#${nextPRNum}`;

    const newPrObj: CivicPR = {
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
        { id: 'chk-c-1', name: 'Simetria Constitucional', description: 'Validação frente à Constituição Federal e Estadual.', status: 'Aprovado', feedback: 'O tema de fomento à participação direta do munícipe é harmônico aos artigos 1º e 29 da CF/88.' },
        { id: 'chk-c-2', name: 'Lei de Responsabilidade Fiscal', description: 'Impacto nos limites de despesas correntes do município.', status: 'Atenção', feedback: 'Requer revisão técnica preliminar caso gere despesa com infraestrutura de rede municipal.' }
      ],
      createdAt: new Date().toISOString(),
      mergeTimeline: [
        { title: 'Abertura de Proposta Popular', date: 'Hoje', completed: true, description: 'Protocolo eletrônico computado no Código Público.' },
        { title: 'Testes Estáticos (CI Jurídico)', date: 'Hoje', completed: true, description: 'Checks de integridade constitucional validados.' },
        { title: 'Parecer Técnico da Câmara', date: 'Pendente', completed: false, description: 'Revisores legislativos analisam a viabilidade orgânica.' },
        { title: 'Merge na Branch Principal', date: 'Pendente', completed: false, description: 'Sancionada e incorporada ao texto oficial da lei.' }
      ]
    };

    setPrs([newPrObj, ...prs]);
    setPath('/prs');
  };

  // User casting a vote on public box
  const handleCastVote = (votingId: string, selection: 'Aprovo' | 'Rejeito' | 'Abstenção') => {
    // 1. Update voting metrics
    const shortHash = `CP-2026-${Math.random().toString(36).substring(3, 7).toUpperCase()}-${Math.random().toString(36).substring(3, 7).toUpperCase()}`;
    const txSimHash = '0x' + Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    setVotacoes(prev =>
      prev.map(v => {
        if (v.id === votingId) {
          return {
            ...v,
            hasVoted: true,
            userVoteSelection: selection,
            voteReceipt: shortHash,
            votesYes: selection === 'Aprovo' ? v.votesYes + 1 : v.votesYes,
            votesNo: selection === 'Rejeito' ? v.votesNo + 1 : v.votesNo,
            votesAbstain: selection === 'Abstenção' ? v.votesAbstain + 1 : v.votesAbstain,
            quorumReached: v.quorumReached + 1
          };
        }
        return v;
      })
    );

    // 2. Insert receipt into user's personal portfolio instantly
    const newReceipt = {
      id: votingId,
      selection: selection,
      receipt: shortHash,
      txHash: txSimHash
    };

    setUserProfile(prev => ({
      ...prev,
      votedList: [newReceipt, ...prev.votedList]
    }));
  };

  // Moderation / triage helper functions inside Backdoor Console
  const handleTriageIssue = (issueId: string, newStatus: any) => {
    setIssues(prev =>
      prev.map(i => (i.id === issueId ? { ...i, status: newStatus } : i))
    );
  };

  const handleTriagePR = (prId: string, newStatus: any) => {
    // 1. Update PR status
    setPrs(prev =>
      prev.map(p => {
        if (p.id === prId) {
          const updatedMergeTimeline = p.mergeTimeline.map(step => {
            if (newStatus === 'Incorporado ao texto oficial') {
              return { ...step, completed: true };
            }
            if (newStatus === 'Em votação' && step.title === 'Parecer Técnico da Câmara') {
              return { ...step, completed: true };
            }
            return step;
          });

          return {
            ...p,
            status: newStatus,
            mergeTimeline: updatedMergeTimeline
          };
        }
        return p;
      })
    );

    // 2. METAPHOR HEURISTIC INTEGRATION:
    // If PR is merged ("Incorporado ao texto oficial"), we dynamically update the live "Master branch"
    // of the technical article of law!
    if (newStatus === 'Incorporado ao texto oficial') {
      const targetPrObj = prs.find(p => p.id === prId);
      if (targetPrObj && targetPrObj.diffs && targetPrObj.diffs.length > 0) {
        const firstDiff = targetPrObj.diffs[0];
        setArtigos(prev =>
          prev.map(art => {
            if (art.number === firstDiff.articleNumber) {
              return {
                ...art,
                content: firstDiff.afterText, // Dynamic rewrite of our state!
                amendmentNumber: `Emenda Cívica Merged ${prId}`,
                version: 'v2026.1-merged-pop'
              };
            }
            return art;
          })
        );

        // Also add a custom compiled "Release" in state to celebrate!
        const nextRelease: any = {
          id: `v2026.1-pop`,
          title: `Release Especial — Incorporação Popular ${prId}`,
          date: '10/06/2026',
          repositoryName: 'Lei Orgânica Municipal',
          changelog: [
            `Incorporação do PR Cívico ${prId} regulando: "${targetPrObj.title}"`,
            `Atualização do Artigo ${firstDiff.articleNumber} no kernel municipal.`,
            `Saneamento estático de todas as licitações correlacionadas via CI Jurídico`
          ],
          incorporatedPRIds: [prId],
          affectedArticlesCount: 1,
          officialDocumentUrl: `Diário Oficial Online — SEI nº 29A9`,
          promulgatedBy: 'Mesa Organizadora Popular e Cidadania Ativa'
        };

        setReleases([nextRelease, ...releases]);
      }
    }
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
            stats={MOCK_ESTATISTICAS}
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
            setPath={setPath}
            onSelectRep={(slug) => setPath(`/repositorios/${slug}`)}
          />
        )}

        {currentPath === '/issues' && (
          <IssueTracker
            issues={issues}
            artigos={artigos}
            repos={MOCK_REPOSITORIOS}
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
