/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  GitPullRequest,
  Search,
  Plus,
  ArrowLeft,
  BookOpen,
  MessageSquare,
  History,
  CheckCircle2,
  AlertCircle,
  ThumbsUp,
  Award,
  Sparkles,
  Play,
  RotateCcw,
  Vote,
  Terminal,
  Send,
  HelpCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  FileText
} from 'lucide-react';
import { CivicPR, PRStatus, LawArticle, Voting, PRReview, InstitutionalCheck, Issue } from '../types';

interface CivicPRHubProps {
  prs: CivicPR[];
  artigos: LawArticle[];
  votacoes: Voting[];
  allIssues: Issue[];
  onBackToHome: () => void;
  onSubmitNewPR: (data: any) => void;
  onCastVote: (votingId: string, selection: 'Aprovo' | 'Rejeito' | 'Abstenção') => void;
}

export default function CivicPRHub({
  prs,
  artigos,
  votacoes,
  allIssues,
  onBackToHome,
  onSubmitNewPR,
  onCastVote
}: CivicPRHubProps) {
  const [selectedPRId, setSelectedPRId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'resumo' | 'diff' | 'debate' | 'reviews' | 'issues' | 'historico' | 'votacao' | 'tramitacao'>('resumo');

  // Search/Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRepo, setSelectedRepo] = useState<string>('all');

  // New Comment State inside PR
  const [newComment, setNewComment] = useState('');

  // New PR Form States
  const [formTitle, setFormTitle] = useState('');
  const [formRepo, setFormRepo] = useState('Lei Orgânica Municipal');
  const [formTargetTitle, setFormTargetTitle] = useState('');
  const [formAffectedArticles, setFormAffectedArticles] = useState('');
  const [formCitizenSummary, setFormCitizenSummary] = useState('');
  const [formJustification, setFormJustification] = useState('');
  const [formArticleTextBefore, setFormArticleTextBefore] = useState('');
  const [formArticleTextAfter, setFormArticleTextAfter] = useState('');
  const [formRationale, setFormRationale] = useState('');

  // Cast vote states
  const [votedChoice, setVotedChoice] = useState<'Aprovo' | 'Rejeito' | 'Abstenção' | null>(null);
  const [showVoteSlip, setShowVoteSlip] = useState(false);

  const prStatuses: PRStatus[] = [
    'Rascunho',
    'Aberto para debate',
    'Em revisão pública',
    'Em revisão técnica',
    'Em revisão jurídica',
    'Aguardando ajustes',
    'Pronto para votação',
    'Em votação',
    'Aprovado pela consulta pública',
    'Encaminhado à Câmara',
    'Aprovado formalmente',
    'Incorporado ao texto oficial',
    'Rejeitado',
    'Arquivado'
  ];

  // Filtering
  const filteredPRs = prs.filter(pr => {
    const matchesSearch =
      pr.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pr.citizenSummary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pr.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || pr.status === selectedStatus;
    const matchesRepo = selectedRepo === 'all' || pr.repository === selectedRepo;

    return matchesSearch && matchesStatus && matchesRepo;
  });

  const selectedPR = prs.find(p => p.id === selectedPRId);
  const relatedVoting = selectedPR ? votacoes.find(v => v.id === selectedPR.votingId) : null;

  const handleCreatePRSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formCitizenSummary.trim()) return;

    const newPRPayload = {
      title: formTitle,
      repository: formRepo,
      targetTitle: formTargetTitle || 'Geral',
      affectedArticles: formAffectedArticles || 'Artigos Diversos',
      authorName: 'Dionatan Santos',
      authorType: 'Iniciativa Popular' as any,
      citizenSummary: formCitizenSummary,
      justification: formJustification,
      diffs: [
        {
          articleNumber: 12,
          titleRef: formAffectedArticles || 'Código Alterado',
          beforeText: formArticleTextBefore || 'Texto original vigente não inserido.',
          afterText: formArticleTextAfter || 'Texto proposto não inserido.',
          lines: [
            { type: 'removed', content: `- ${formArticleTextBefore}` },
            { type: 'added', content: `+ ${formArticleTextAfter}` }
          ],
          rationale: formRationale || 'Aprimoramento normativo.'
        }
      ],
      linkedIssueIds: [],
      upvotes: 1,
    };

    onSubmitNewPR(newPRPayload);

    // Reset Form
    setFormTitle('');
    setFormCitizenSummary('');
    setFormJustification('');
    setFormArticleTextBefore('');
    setFormArticleTextAfter('');
    setFormRationale('');
    setFormTargetTitle('');
    setFormAffectedArticles('');
    setShowNewForm(false);
  };

  const currentLocalTime = "2026-06-10 12:10";

  return (
    <div className="space-y-6 fade-in" id="prs-civicos-hub">
      {/* 1. GENERAL PULL REQUESTS GRID LIST */}
      {!selectedPRId && !showNewForm && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between border-b border-slate-200 pb-5 gap-4">
            <div>
              <div className="flex items-center space-x-2 text-indigo-700 font-mono text-xs font-bold uppercase tracking-wider">
                <GitPullRequest className="h-4 w-4" />
                <span>Pull Requests de Leis Municipais</span>
              </div>
              <h2 className="font-display text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                PRs Cívicos em Debate
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                Propostas colaborativas de alteração legislativa em revisão pública na cidade de Novo Horizonte.
              </p>
            </div>

            <button
              onClick={() => setShowNewForm(true)}
              className="rounded-xl bg-indigo-600 text-white font-semibold text-xs px-4 py-2.5 shadow-sm hover:bg-indigo-700 transition-colors flex items-center space-x-1.5 shrink-0"
              id="new-pr-btn"
            >
              <Plus className="h-4 w-4" />
              <span>Abrir Novo PR Cívico</span>
            </button>
          </div>

          {/* Filters tools */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs grid sm:grid-cols-3 gap-3.5 items-center">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por proposta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs text-slate-705 outline-none focus:border-indigo-505 font-mono"
              />
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-600 outline-none"
            >
              <option value="all">Qualquer Status de Revisão</option>
              {prStatuses.map((st, idx) => (
                <option key={idx} value={st}>{st}</option>
              ))}
            </select>

            <select
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-600 outline-none"
            >
              <option value="all">Qualquer Repositório Normativo</option>
              <option value="Lei Orgânica Municipal">Lei Orgânica Municipal</option>
              <option value="Plano Diretor Decenal">Plano Diretor Decenal</option>
              <option value="Código de Posturas Urbanas">Código de Posturas Urbanas</option>
            </select>
          </div>

          {/* PR list table with responsive cells */}
          <div className="grid md:grid-cols-2 gap-6">
            {filteredPRs.map((pr) => (
              <div
                key={pr.id}
                onClick={() => {
                  setSelectedPRId(pr.id);
                  setActiveTab('resumo');
                }}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-slate-350 cursor-pointer hover:shadow-md transition-all flex flex-col justify-between"
                id={`pr-card-${pr.id.replace('#', '')}`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-mono font-bold text-emerald-700 text-xs">{pr.id}</span>
                      <span className="rounded bg-indigo-50 px-2 py-0.5 font-mono text-[9px] font-bold text-indigo-700 uppercase tracking-widest leading-none">
                        {pr.authorType}
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-extrabold uppercase ${
                      pr.status === 'Incorporado ao texto oficial'
                        ? 'text-emerald-700 bg-emerald-50'
                        : pr.status === 'Em votação'
                        ? 'text-purple-700 bg-purple-50'
                        : 'text-indigo-700 bg-indigo-50'
                    }`}>
                      {pr.status}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-display font-extrabold text-base text-slate-900 group-hover:text-indigo-600 leading-snug">
                      {pr.title}
                    </h3>
                    <p className="text-slate-400 font-mono text-[10px] uppercase">
                      Altera: <b className="text-slate-600">{pr.affectedArticles}</b>
                    </p>
                  </div>

                  <p className="text-slate-600 text-xs leading-relaxed line-clamp-2">
                    {pr.citizenSummary}
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-4 mt-5 flex items-center justify-between text-slate-400 font-mono text-[10px]">
                  <span>Proponente: {pr.authorName}</span>
                  <div className="flex items-center space-x-3.5">
                    <span className="flex items-center space-x-0.5">
                      <ThumbsUp className="h-3.5 w-3.5 text-slate-400" />
                      <span>{pr.upvotes}</span>
                    </span>
                    <span className="text-indigo-600 font-bold hover:underline flex items-center space-x-1">
                      <span>Analisar</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. DETAILED SINGLE PR CÍVICO VIEWER WORKSPACE */}
      {selectedPRId && selectedPR && (
        <div className="space-y-6">
          {/* Back button */}
          <button
            onClick={() => setSelectedPRId(null)}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            id="pr-detail-back"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar para todos os PRs</span>
          </button>

          {/* PR workspace head */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2.5 flex-wrap gap-1">
                  <span className="font-mono text-sm font-bold text-slate-500">{selectedPR.id}</span>
                  <span className="rounded bg-indigo-50 px-2 py-0.5 font-mono text-[9px] font-bold text-indigo-700 uppercase tracking-widest">
                    {selectedPR.repository}
                  </span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[9px] font-extrabold text-slate-500 uppercase">
                    PROPOSTA POPULAR DE EMENDA
                  </span>
                </div>
                <h3 className="font-display font-extrabold text-xl md:text-2xl text-slate-900 leading-tight">
                  {selectedPR.title}
                </h3>
              </div>

              <div className="flex flex-col items-stretch md:items-end gap-1.5 shrink-0">
                <span className={`px-2.5 py-1 text-center rounded text-xs font-mono font-bold uppercase ${
                  selectedPR.status === 'Incorporado ao texto oficial'
                    ? 'bg-emerald-50 text-emerald-700'
                    : selectedPR.status === 'Em votação'
                    ? 'bg-purple-100 border border-purple-200 text-purple-700 font-extrabold'
                    : 'bg-indigo-50 text-indigo-700'
                }`}>
                  {selectedPR.status}
                </span>
                <span className="text-[10px] font-mono text-slate-400 text-center md:text-right">Por: {selectedPR.authorName}</span>
              </div>
            </div>

            {/* Verification highlights (CI legal Checks banner) */}
            <div className="bg-slate-900 text-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-start space-x-3 text-left">
                <Terminal className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-mono text-[10px] font-bold tracking-widest text-indigo-400 uppercase">Verificações de Admissibilidade Legal (CI-CI/CD)</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Testes automatizados preventivos de compatibilidade constitucional municipal.</p>
                </div>
              </div>

              {/* Status lights summary */}
              <div className="flex items-center space-x-2">
                {selectedPR.checks?.map((chk, idx) => (
                  <span
                    key={idx}
                    title={`${chk.name}: ${chk.status}`}
                    className={`h-2.5 w-2.5 rounded-full ${
                      chk.status === 'Aprovado'
                        ? 'bg-emerald-500 shadow-sm shadow-emerald-400'
                        : chk.status === 'Atenção'
                        ? 'bg-amber-500 shadow-sm shadow-amber-400'
                        : 'bg-rose-500'
                    }`}
                  />
                ))}
                <span className="font-mono text-[10px] text-slate-400 ml-1.5 border-l border-slate-700 pl-2">
                  All Checks Passing (with alerts)
                </span>
              </div>
            </div>
          </div>

          {/* Deep Tabs Row */}
          <div className="border-b border-slate-200">
            <div className="flex space-x-4 overflow-x-auto">
              {[
                { id: 'resumo', label: 'Resumo Popular', icon: Sparkles },
                { id: 'diff', label: 'Diff Normativo', icon: PageTextIcon },
                { id: 'debate', label: `Debate Cívico (${selectedPR.comments.length})`, icon: MessageSquare },
                { id: 'reviews', label: `Revisões e Pareceres (${selectedPR.reviews.length})`, icon: Award },
                { id: 'issues', label: `Issues Vinculadas (${selectedPR.linkedIssueIds.length})`, icon: AlertCircle },
                { id: 'historico', label: 'CI Jurídico Detalhado', icon: CheckCircle2 },
                { id: 'votacao', label: 'Urna Virtual', icon: Vote },
                { id: 'tramitacao', label: 'Merge Timeline', icon: History }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      // Reset vote choice panel
                      if (tab.id === 'votacao') {
                        setVotedChoice(null);
                        setShowVoteSlip(false);
                      }
                    }}
                    className={`flex items-center space-x-1.5 border-b-2 px-1 py-3 text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'border-indigo-600 text-indigo-700 font-bold'
                        : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
                    }`}
                    id={`pr-tab-${tab.id}`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Worksite content */}
          <div className="min-h-96">
            {/* T-1: RESUMO POPULAR */}
            {activeTab === 'resumo' && (
              <div className="space-y-6 fade-in" id="pr-resumo-content">
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Left block: citizen summary and justification */}
                  <div className="md:col-span-2 space-y-6">
                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/20 p-6 space-y-3 relative overflow-hidden">
                      <div className="absolute right-0 top-0 opacity-[0.02]">
                        <Sparkles className="h-40 w-40 text-indigo-900" />
                      </div>
                      <span className="font-mono text-[9px] font-bold text-indigo-700 uppercase tracking-widest bg-indigo-100/55 px-2.5 py-1 rounded w-fit flex items-center space-x-1 select-none">
                        <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                        <span>Resumo Inteligente Cidadão (Modo Simplificado)</span>
                      </span>
                      <p className="text-slate-800 text-xs sm:text-sm leading-relaxed font-normal">
                        {selectedPR.citizenSummary}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
                      <h4 className="font-display font-semibold text-slate-900 text-xs sm:text-sm uppercase tracking-wide border-b border-slate-50 pb-2">
                        Justificativa de Emenda Legislativa
                      </h4>
                      <p className="text-slate-600 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                        {selectedPR.justification}
                      </p>
                    </div>
                  </div>

                  {/* Right block: structural facts card */}
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
                      <h4 className="font-display font-bold text-slate-900 text-xs uppercase tracking-wider">Métricas do Pull Request</h4>

                      <div className="divide-y divide-slate-50 text-xs font-mono">
                        <div className="py-2.5 flex justify-between">
                          <span className="text-slate-400">Repositório</span>
                          <span className="font-bold text-slate-700">{selectedPR.repository.split(' ')[0]}</span>
                        </div>
                        <div className="py-2.5 flex justify-between">
                          <span className="text-slate-400">Título Alvo</span>
                          <span className="font-bold text-slate-700">{selectedPR.targetTitle.split(' - ')[0]}</span>
                        </div>
                        <div className="py-2.5 flex justify-between">
                          <span className="text-slate-400">Trecho Afetado</span>
                          <span className="font-bold text-indigo-600 hover:underline cursor-pointer">{selectedPR.affectedArticles}</span>
                        </div>
                        <div className="py-2.5 flex justify-between">
                          <span className="text-slate-400">Apoios Populares</span>
                          <span className="font-bold text-slate-700">{selectedPR.upvotes} cidadãos</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          selectedPR.upvotes += 1;
                          setSelectedPRId(selectedPR.id); // Trigger state update
                        }}
                        className="w-full inline-flex items-center justify-center space-x-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
                        id="pr-upvote-action"
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span>Apoiar esta Proposta</span>
                      </button>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-emerald-50/20 p-5 space-y-2 border-dashed">
                      <h5 className="font-display font-bold text-emerald-800 text-xs">Aprovação e Rito do Merge</h5>
                      <p className="text-slate-500 text-[11px] leading-relaxed">
                        Este PR cívico requer revisões técnicas de conformidade antes de ser encaminhado para votação. Uma vez aprovado, o "Merge Institucional" consolida o texto de acordo com o rito de lei formal da câmara.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* T-2: DIFF NORMATIVO VISUALIZER */}
            {activeTab === 'diff' && (
              <div className="space-y-6 fade-in" id="pr-diff-content">
                <div className="border-b border-slate-200 pb-3">
                  <h4 className="font-display font-extrabold text-slate-900 text-sm">Comparação de Texto (Diff Normativo)</h4>
                  <p className="text-slate-500 text-xs">Visualize as inclusões e exclusões de texto exatamente como no terminal de versionamento técnico.</p>
                </div>

                {selectedPR.diffs && selectedPR.diffs.length > 0 ? (
                  selectedPR.diffs.map((diffItem, idx) => (
                    <div key={idx} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                      {/* Diff subhead */}
                      <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs font-mono">
                        <span className="font-bold text-slate-700">{diffItem.titleRef}</span>
                        <span className="text-slate-400">MODIFICAÇÃO SUGERIDA</span>
                      </div>

                      {/* Diff panel */}
                      <div className="p-4 bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto space-y-1.5 leading-relaxed">
                        {/* Legend */}
                        <div className="text-[10px] text-slate-400 border-b border-slate-800 pb-2 mb-3 flex items-center space-x-4 select-none">
                          <span className="flex items-center space-x-1.5"><span className="h-2 w-2 rounded bg-emerald-500" /> <span>+ Adicionado</span></span>
                          <span className="flex items-center space-x-1.5"><span className="h-2 w-2 rounded bg-rose-500" /> <span>- Removido</span></span>
                        </div>

                        {diffItem.lines.map((ln, lineIdx) => {
                          const isAdded = ln.content.startsWith('+');
                          const isRemoved = ln.content.startsWith('-');
                          return (
                            <div
                              key={lineIdx}
                              className={`px-3 py-1.5 rounded-xs select-text ${
                                isAdded ? 'bg-emerald-950/70 border-l-2 border-emerald-500 text-emerald-300 font-bold' : isRemoved ? 'bg-rose-950/70 border-l-2 border-rose-500 text-rose-300 line-through' : 'text-slate-400'
                              }`}
                            >
                              {ln.content}
                            </div>
                          );
                        })}
                      </div>

                      {/* Diff rationale */}
                      <div className="p-5 bg-indigo-50/30 border-t border-slate-100">
                        <h5 className="text-[11px] font-mono font-bold text-indigo-700 uppercase">Resumo da Alteração Textual:</h5>
                        <p className="text-slate-600 text-xs sm:text-sm mt-1">{diffItem.rationale}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center text-slate-400">
                    Não há diffs detalhados cadastrados para este rascunho.
                  </div>
                )}
              </div>
            )}

            {/* T-3: DEBATE CÍVICO FEED */}
            {activeTab === 'debate' && (
              <div className="space-y-6 fade-in" id="pr-debate-content">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
                  <h4 className="font-display font-semibold text-slate-900 text-xs sm:text-sm">Contribuir para a discussão cívica</h4>
                  <div className="space-y-3">
                    <textarea
                      placeholder="Deixe sua crítica, sugestão de redação alternativa ou questionamento sobre impacto local..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full min-h-24 rounded-xl border border-slate-200 p-3 text-xs text-slate-705 outline-none focus:border-indigo-500 transition-colors"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          if (!newComment.trim()) return;
                          selectedPR.comments.push({
                            id: `local-pr-c-${Date.now()}`,
                            authorName: 'Dionatan Santos',
                            content: newComment,
                            createdAt: new Date().toISOString()
                          });
                          setNewComment('');
                          setSelectedPRId(selectedPR.id); // update view
                        }}
                        className="rounded-lg bg-slate-900 text-white font-semibold text-xs px-4 py-2 hover:bg-slate-800 transition-colors"
                      >
                        Enviar manifestação
                      </button>
                    </div>
                  </div>
                </div>

                {/* Previews comments */}
                <div className="space-y-4">
                  {selectedPR.comments.length > 0 ? (
                    selectedPR.comments.map((com, idx) => (
                      <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                          <span className="font-bold text-xs text-slate-800">{com.authorName}</span>
                          <span className="font-mono text-[9px] text-slate-400">{new Date(com.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{com.content}</p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-400">
                      Nenhum argumento cadastrado. Deixe sua contribuição social!
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* T-4: REVISÕES E PARECERES JURÍDICOS */}
            {activeTab === 'reviews' && (
              <div className="space-y-6 fade-in" id="pr-reviews-content">
                <div className="border-b border-slate-200 pb-3">
                  <h4 className="font-display font-extrabold text-slate-900 text-sm">Revisões Técnicas e Pareceres Judiciais</h4>
                  <p className="text-slate-500 text-xs">Examine análises elaboradas por auditores da controladoria e procuradores municipais de Novo Horizonte.</p>
                </div>

                <div className="space-y-4">
                  {selectedPR.reviews && selectedPR.reviews.length > 0 ? (
                    selectedPR.reviews.map((rev) => (
                      <div
                        key={rev.id}
                        className={`rounded-2xl border bg-white p-5 space-y-3 ${
                          rev.status === 'Aprovado'
                            ? 'border-l-4 border-l-emerald-500'
                            : rev.status === 'Rejeitado'
                            ? 'border-l-4 border-l-rose-500'
                            : 'border-l-4 border-l-amber-500'
                        }`}
                      >
                        <div className="flex items-center justify-between border-b border-slate-50 pb-2 flex-wrap gap-2 text-xs font-mono">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-800 font-sans text-sm">{rev.reviewerName}</span>
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600 uppercase">
                              {rev.reviewerRole}
                            </span>
                          </div>

                          <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase ${
                            rev.status === 'Aprovado'
                              ? 'text-emerald-700 bg-emerald-50'
                              : rev.status === 'Aprovado com ressalvas'
                              ? 'text-amber-700 bg-amber-50'
                              : 'text-rose-700 bg-rose-50'
                          }`}>
                            {rev.status}
                          </span>
                        </div>

                        <div>
                          <h5 className="font-display font-bold text-slate-900 text-xs">Parecer Conclusivo:</h5>
                          <p className="text-slate-600 text-xs sm:text-sm mt-1 whitespace-pre-line leading-relaxed italic">
                            &ldquo;{rev.conclusion}&rdquo;
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3 mt-2 text-xs">
                          <span className="font-mono text-[9px] text-slate-400 font-bold block">RECOMENDAÇÃO / FEEDBACK DE AJUSTES:</span>
                          <p className="text-slate-700 mt-0.5 leading-normal font-sans">{rev.feedback}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center text-slate-400">
                      Nenhuma comissão ou ministério protocolou parecer para este PR até o momento.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* T-5: ISSUES VINCULADAS */}
            {activeTab === 'issues' && (
              <div className="space-y-4 fade-in" id="pr-issues-content">
                <div className="border-b border-slate-200 pb-3">
                  <h4 className="font-display font-extrabold text-slate-900 text-sm">Demandas vinculadas ao PR</h4>
                  <p className="text-slate-500 text-xs">Issues públicas ou normativas cujos problemas são sanados pela aprovação desta proposta.</p>
                </div>

                {selectedPR.linkedIssueIds.length > 0 ? (
                  allIssues
                    .filter(i => selectedPR.linkedIssueIds.includes(i.id))
                    .map(issue => (
                      <div
                        key={issue.id}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <span className="font-mono text-xs font-bold text-indigo-700 pr-1.5">{issue.id}</span>
                          <span className="text-slate-900 font-display font-bold text-sm">{issue.title}</span>
                          <p className="text-slate-500 text-xs leading-normal mt-0.5">{issue.description}</p>
                        </div>
                        <span className="rounded bg-slate-100 px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase shrink-0">
                          {issue.status}
                        </span>
                      </div>
                    ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center text-slate-400">
                    Proposta autônoma. Nenhuma issue urbana associada a esta alteração.
                  </div>
                )}
              </div>
            )}

            {/* T-6: CI JURÍDICO REVIEWS DETALHADO */}
            {activeTab === 'historico' && (
              <div className="space-y-6 fade-in" id="pr-checks-content">
                <div className="border-b border-slate-200 pb-3">
                  <h4 className="font-display font-extrabold text-slate-900 text-sm">Esteira de Admissibilidade Constitucional (CI-CI/CD)</h4>
                  <p className="text-slate-500 text-xs">Esta esteira roda testes simulados em todas as propostas para categorização de riscos e impedimentos operacionais regulatórios.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {selectedPR.checks?.map((chk) => (
                    <div key={chk.id} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <h5 className="font-display font-bold text-slate-900 text-xs sm:text-sm">{chk.name}</h5>
                        <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase ${
                          chk.status === 'Aprovado'
                            ? 'text-emerald-700 bg-emerald-50'
                            : chk.status === 'Atenção'
                            ? 'text-amber-700 bg-amber-50'
                            : 'text-rose-700 bg-rose-50'
                        }`}>
                          {chk.status}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] leading-relaxed">{chk.description}</p>
                      <div className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600 border border-slate-100">
                        <b>Feedback técnico:</b> {chk.feedback}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* T-7: URNA VIRTUAL / VOTACAO */}
            {activeTab === 'votacao' && (
              <div className="space-y-6 fade-in" id="pr-votacao-box">
                {relatedVoting ? (
                  relatedVoting.hasVoted ? (
                    /* ALREADY VOTED - SHOW SECURE RECEIPT */
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/15 p-6 md:p-8 space-y-6 max-w-2xl mx-auto border-dashed">
                      <div className="text-center space-y-2">
                        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
                        <h4 className="font-display font-extrabold text-emerald-950 text-xl">Voto Registrado com Sucesso!</h4>
                        <p className="text-emerald-800 text-xs">
                          Sua escolha cívica foi computada de forma 100% segura e cifrada em dados públicos agregados de quórum municipal.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs font-mono text-xs text-slate-600 space-y-3 select-text">
                        <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                          <span className="font-bold text-slate-400">COMPROVANTE DE VOTO</span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">ASSINADO COM SUCESSO</span>
                        </div>

                        <div className="space-y-2 text-[11px]">
                          <p><b>Objeto:</b> {relatedVoting.title}</p>
                          <p><b>Eleitor:</b> Dionatan Santos (CP-CITIZEN-938217)</p>
                          <p><b>Data:</b> {currentLocalTime} (UTC)</p>
                          <p><b>Hash de Transação Cívica:</b> <span className="text-emerald-600 font-bold">{relatedVoting.voteReceipt || 'CP-2026-8K29-ZP41'}</span></p>
                          <p className="text-slate-400 text-[10px] break-all"><b>Cifragem de Segurança:</b> 0x8a92fb10d3da9f1a2083cb0a8da928120b3cd981d392019abfe02f</p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-dashed p-4 text-[11px] text-slate-500 leading-normal text-center">
                        <b>Importante:</b> Para manter o princípio da inviolabilidade do voto, seu comprovante não revela qual opção foi selecionada (Aprovo / Rejeito) no banco de dados aberto, mas serve como token criptográfico de auditoria de quórum!
                      </div>
                    </div>
                  ) : (
                    /* FORM WITH OPTIONS AND TERMS REVIEWS BEFORE SENDING VOTE */
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 space-y-6 max-w-2xl mx-auto shadow-xs">
                      <div className="border-b border-slate-100 pb-4 text-center space-y-1.5">
                        <span className="inline-flex items-center space-x-1.5 rounded-full bg-slate-100 px-3 py-1 font-mono text-[9px] font-bold text-slate-600 uppercase">
                          <Vote className="h-3 w-3" />
                          <span>Módulo de Votação Consultiva Ativo</span>
                        </span>
                        <h4 className="font-display font-extrabold text-slate-900 text-lg">{relatedVoting.title}</h4>
                        <p className="text-slate-500 text-xs">A escolha popular será enviada oficializada à Mesa Diretora da Câmara de Vereadores.</p>
                      </div>

                      {/* Summary, pros and cons review */}
                      <div className="space-y-4">
                        <div className="rounded-xl bg-slate-50 p-4 space-y-1.5">
                          <span className="font-mono text-[9px] font-extrabold text-slate-400 block uppercase">Resumo da Medida</span>
                          <p className="text-slate-700 text-xs sm:text-sm leading-relaxed">{relatedVoting.citizenSummary}</p>
                        </div>

                        {/* Pros & Cons Columns for smart decision making */}
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="rounded-xl border border-emerald-100 bg-emerald-50/15 p-4 space-y-2">
                            <h5 className="font-bold text-emerald-800 text-xs flex items-center space-x-1">
                              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Argumentos Favoráveis</span>
                            </h5>
                            <ul className="list-disc pl-4 text-[11px] text-slate-600 space-y-1">
                              {relatedVoting.pros.map((p, idx) => (
                                <li key={idx}>{p}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="rounded-xl border border-rose-100 bg-rose-50/15 p-4 space-y-2">
                            <h5 className="font-bold text-rose-800 text-xs flex items-center space-x-1">
                              <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                              <span>Argumentos Contrários / Alertas</span>
                            </h5>
                            <ul className="list-disc pl-4 text-[11px] text-slate-600 space-y-1">
                              {relatedVoting.cons.map((c, idx) => (
                                <li key={idx}>{c}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Vote inputs and confirm button */}
                      {!showVoteSlip ? (
                        <div className="space-y-4 border-t border-slate-100 pt-5 text-center">
                          <h5 className="font-display font-bold text-slate-900 text-xs uppercase tracking-wider">Selecione sua escolha de voto</h5>

                          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                            <button
                              onClick={() => setVotedChoice('Aprovo')}
                              className={`rounded-xl border p-4.5 font-bold text-center text-xs transition-all flex flex-col items-center justify-center space-y-2 ${
                                votedChoice === 'Aprovo'
                                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                                  : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300'
                              }`}
                              id="vote-yes"
                            >
                              <span className="text-lg">✅</span>
                              <span>APROVO</span>
                            </button>

                            <button
                              onClick={() => setVotedChoice('Rejeito')}
                              className={`rounded-xl border p-4.5 font-bold text-center text-xs transition-all flex flex-col items-center justify-center space-y-2 ${
                                votedChoice === 'Rejeito'
                                  ? 'bg-rose-600 border-rose-600 text-white shadow-md'
                                  : 'bg-white border-slate-200 text-slate-700 hover:border-rose-300'
                              }`}
                              id="vote-no"
                            >
                              <span className="text-lg">❌</span>
                              <span>REJEITO</span>
                            </button>

                            <button
                              onClick={() => setVotedChoice('Abstenção')}
                              className={`rounded-xl border p-4.5 font-bold text-center text-xs transition-all flex flex-col items-center justify-center space-y-2 ${
                                votedChoice === 'Abstenção'
                                  ? 'bg-slate-700 border-slate-700 text-white shadow-md'
                                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
                              }`}
                              id="vote-abstain"
                            >
                              <span className="text-lg">⚖️</span>
                              <span>ABSTENÇÃO</span>
                            </button>
                          </div>

                          <div className="pt-3">
                            <button
                              disabled={!votedChoice}
                              onClick={() => setShowVoteSlip(true)}
                              className="rounded-xl bg-slate-900 text-white px-6 py-3 text-xs font-semibold hover:bg-slate-800 disabled:opacity-45 shadow-sm transition-all w-full max-w-xs"
                              id="vote-review-btn"
                            >
                              Revisar e assinar voto digital
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Vote confirmation slip modal preview */
                        <div className="rounded-2xl border border-amber-200 bg-amber-50/15 p-5 space-y-4 border-dashed animate-in fade-in duration-150">
                          <h5 className="font-display font-extrabold text-amber-950 text-sm text-center">Revisão de Termo e Assinatura Eletrônica</h5>

                          <div className="text-xs text-slate-600 leading-relaxed text-center space-y-2">
                            <p>Você selecionou voto de <b>{votedChoice?.toUpperCase()}</b>.</p>
                            <p>Ao clicar em "Confirmar", você assinará o voto através das credenciais integradas ao Portal de Identidade, declarando-se residente em Novo Horizonte sob as penalidades em lei administrativo-eleitoral.</p>
                          </div>

                          <div className="flex gap-2.5 justify-center">
                            <button
                              onClick={() => setShowVoteSlip(false)}
                              className="rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                            >
                              Ajustar voto
                            </button>
                            <button
                              onClick={() => {
                                onCastVote(relatedVoting.id, votedChoice!);
                              }}
                              className="rounded-lg bg-indigo-600 px-5 py-1.5 text-xs text-white hover:bg-indigo-700 font-bold shadow-sm"
                              id="vote-confirm-btn"
                            >
                              Confirmar e computar voto
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center text-slate-400">
                    Este rascunho de PR cívico ainda necessita parecer jurídico favorável para ser qualificado e aberto em Urna de votação popular consultiva.
                  </div>
                )}
              </div>
            )}

            {/* T-8: MERGE TIMELINE / TRAMITACAO */}
            {activeTab === 'tramitacao' && (
              <div className="space-y-6 fade-in" id="pr-tramitacao-content">
                <div className="border-b border-slate-200 pb-3">
                  <h4 className="font-display font-extrabold text-slate-900 text-sm">Esteira de Merge Institucional (Tramitação do PR)</h4>
                  <p className="text-slate-500 text-xs">Visualize os ritos necessários até que o Pull Request seja unificado à branch consolidada oficial da lei.</p>
                </div>

                <div className="relative pl-6 border-l-2 border-slate-100 space-y-8 max-w-xl">
                  {selectedPR.mergeTimeline?.map((time, idx) => (
                    <div key={idx} className="relative">
                      {/* Circle node indicator */}
                      <span className={`absolute -left-[31px] top-1.5 h-4 w-4 rounded-full border-2 border-white flex items-center justify-center ${
                        time.completed
                          ? 'bg-emerald-500 shadow-sm shadow-emerald-400'
                          : 'bg-slate-100 border-slate-300'
                      }`}>
                        {time.completed && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </span>

                      <div className="space-y-1">
                        <div className="flex items-center space-x-2.5 flex-wrap gap-1">
                          <h5 className={`font-display font-bold text-xs sm:text-sm ${time.completed ? 'text-slate-900 font-extrabold' : 'text-slate-400'}`}>
                            {time.title}
                          </h5>
                          <span className="font-mono text-[9px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                            {time.date}
                          </span>
                        </div>
                        <p className="text-slate-500 text-xs leading-normal">{time.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. NEW PR CREATION FORM WORKSPACE */}
      {showNewForm && (
        <div className="space-y-6">
          <button
            onClick={() => setShowNewForm(false)}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            id="new-pr-back"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Cancelar e voltar</span>
          </button>

          <form onSubmit={handleCreatePRSubmit} className="rounded-2xl border border-indigo-100 bg-white p-6 md:p-8 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="font-display font-extrabold text-xl text-slate-950 flex items-center space-x-2">
                <GitPullRequest className="h-6 w-6 text-indigo-700 bg-indigo-50 p-1.5 rounded-lg shrink-0" />
                <span>Iniciar Proposta de Emenda / Novo PR Cívico</span>
              </h3>
              <p className="text-slate-500 text-xs mt-1">
                Sugira formalmente alterações de texto, exclusões ou novos dispositivos em leis de Novo Horizonte.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Repo Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Selecione o repositório municipal alvo</label>
                <select
                  value={formRepo}
                  onChange={(e) => setFormRepo(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-705 outline-none focus:border-indigo-500"
                >
                  <option value="Lei Orgânica Municipal">Lei Orgânica Municipal (Kernel)</option>
                  <option value="Plano Diretor Decenal">Plano Diretor Decenal</option>
                  <option value="Código de Posturas Urbanas">Código de Posturas Urbanas</option>
                  <option value="Código Tributário Municipal">Código Tributário Municipal</option>
                </select>
              </div>

              {/* Title reference */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Seção / Título Alvo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Título II, Capítulo III (Da Participação)"
                  value={formTargetTitle}
                  onChange={(e) => setFormTargetTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-755 outline-none"
                />
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Título do PR Cívico (Resuma a intenção)</label>
              <input
                type="text"
                required
                maxLength={80}
                placeholder="Exemplo: Criar base legal sólida para votações virtuais de projetos de iniciativa popular"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-755 outline-none focus:border-indigo-505"
              />
            </div>

            {/* Affected articles text */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Artigos / Parágrafos Afetados</label>
              <input
                type="text"
                required
                placeholder="Ex: Artigo 12, parágrafos 1º e 2º"
                value={formAffectedArticles}
                onChange={(e) => setFormAffectedArticles(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-755 outline-none focus:border-indigo-505"
              />
            </div>

            {/* Summary citizen mode */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Resumo Cidadão (Explicação simples de leitura social)</label>
              <textarea
                required
                placeholder="Explique resumidamente em palavras simples e cotidianas o que muda para as pessoas comuns na cidade se esse PR for aprovado."
                value={formCitizenSummary}
                onChange={(e) => setFormCitizenSummary(e.target.value)}
                className="w-full min-h-24 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-755 outline-none"
              />
            </div>

            {/* Justification tech mode */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Justificativa e fundamentação jurídica / social</label>
              <textarea
                required
                placeholder="Qual o embasamento legal ou a finalidade pública desse projeto? Inclua dados se houver."
                value={formJustification}
                onChange={(e) => setFormJustification(e.target.value)}
                className="w-full min-h-24 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-755 outline-none"
              />
            </div>

            {/* Code alteration fields */}
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/20 p-5 space-y-4">
              <span className="font-mono text-[9px] font-extrabold text-indigo-750 uppercase tracking-wider block">ALTERAÇÃO DE TEXTO DA LEI (DIFF DE CÓDIGO)</span>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Como está hoje (Texto vigente)</label>
                  <textarea
                    placeholder="Cole o teor do artigo vigente como ele se encontra na Lei Orgânica atual..."
                    value={formArticleTextBefore}
                    onChange={(e) => setFormArticleTextBefore(e.target.value)}
                    className="w-full min-h-24 rounded bg-white border border-slate-200 p-2.5 text-xs text-slate-700 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Como deve ficar (Texto proposto)</label>
                  <textarea
                    placeholder="Escreva como você propõe que o artigo ou dispositivo fique no texto final..."
                    value={formArticleTextAfter}
                    onChange={(e) => setFormArticleTextAfter(e.target.value)}
                    className="w-full min-h-24 rounded bg-white border border-slate-200 p-2.5 text-xs text-slate-700 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Nota explicativa rápida sobre o Diff</label>
                <input
                  type="text"
                  placeholder="Ex: Insere parágrafos adicionais estipulando prazos e governança digital."
                  value={formRationale}
                  onChange={(e) => setFormRationale(e.target.value)}
                  className="w-full rounded bg-white border border-slate-200 p-2 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowNewForm(false)}
                className="rounded-lg border border-slate-205 px-4 py-2 font-semibold text-xs text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-xs text-white hover:bg-indigo-700 shadow-sm"
              >
                Abrir PR Cívico
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// Simple placeholder icon wrapper for inline import prevention
const PageTextIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);
