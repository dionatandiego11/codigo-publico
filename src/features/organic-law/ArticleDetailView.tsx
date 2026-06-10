/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Scale,
  MessageSquare,
  GitPullRequest,
  AlertCircle,
  History,
  ArrowLeft,
  Sparkles,
  BookOpen,
  Plus,
  Trash2,
  Lock,
  MessageCircle,
  Clock,
  Send,
  ThumbsUp
} from 'lucide-react';
import { LawArticle, Issue, CivicPR, ArticleComment } from '@/src/types';

interface ArticleDetailViewProps {
  article: LawArticle;
  allIssues: Issue[];
  allPRs: CivicPR[];
  onBack: () => void;
  onInitiatePR: (articleNumber: number) => void;
  setPath: (path: string) => void;
  onNavigateToPR: (prId: string) => void;
  onNavigateToIssue: (issueId: string) => void;
}

export default function ArticleDetailView({
  article,
  allIssues,
  allPRs,
  onBack,
  onInitiatePR,
  setPath,
  onNavigateToPR,
  onNavigateToIssue
}: ArticleDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'vigente' | 'comentarios' | 'issues' | 'prs' | 'historico'>('vigente');
  const [readMode, setReadMode] = useState<'cidadao' | 'tecnico'>('tecnico');
  
  // Local list to enable testing commenting
  const [comments, setComments] = useState<ArticleComment[]>(article.comments);
  const [newCommentText, setNewCommentText] = useState('');
  const [authorRole, setAuthorRole] = useState<'Cidadão' | 'Procurador' | 'Vereador' | 'Técnico' | 'Controladoria'>('Cidadão');

  // Related entities
  const relatedIssues = allIssues.filter(issue => issue.relatedArticleId === article.id || issue.title.includes(`Artigo ${article.number}`));
  const relatedPRs = allPRs.filter(pr => pr.affectedArticles.includes(`Artigo ${article.number}`) || pr.affectedArticles.includes(`Art. ${article.number}`) || pr.title.includes(`Artigo ${article.number}`));

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment: ArticleComment = {
      id: `comment-local-${Date.now()}`,
      authorName: 'Dionatan Santos',
      authorRole,
      content: newCommentText,
      createdAt: new Date().toISOString(),
      likes: 0
    };

    setComments(prev => [newComment, ...prev]);
    setNewCommentText('');
  };

  const handleLikeComment = (commentId: string) => {
    setComments(prev => 
      prev.map(c => c.id === commentId ? { ...c, likes: c.likes + 1 } : c)
    );
  };

  return (
    <div className="space-y-6 pb-12 fade-in" id="article-detail-manager">
      {/* Back navigation */}
      <button
        onClick={onBack}
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        id="detail-back-button"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Voltar para a Lei Orgânica</span>
      </button>

      {/* Header card with directory hierarchy */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-4">
          <div className="space-y-0.5">
            <span className="font-mono text-[9px] font-bold text-slate-400 block tracking-widest uppercase">
              {article.title} &gt; {article.chapter}
            </span>
            <h2 className="font-display text-2xl font-extrabold text-slate-950 tracking-tight">
              Artigo {article.number}
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            {article.amendmentNumber && (
              <span className="rounded bg-teal-50 px-2 py-0.5 font-mono text-[9px] font-bold text-teal-700 uppercase">
                {article.amendmentNumber}
              </span>
            )}
            <span className="rounded bg-slate-100 px-2.5 py-0.5 font-mono text-xs text-slate-600 font-semibold">
              Versão {article.version}
            </span>
          </div>
        </div>

        {/* Action triggers */}
        <div className="flex items-center justify-between flex-wrap gap-2.5 pt-1">
          <p className="text-xs text-slate-500 font-medium">
            Última alteração oficial publicada em: <b className="font-bold">{article.lastUpdated}</b>
          </p>

          <button
            onClick={() => onInitiatePR(article.number)}
            className="rounded-xl bg-indigo-600 text-white font-semibold text-xs px-4 py-2 hover:bg-indigo-700 transition-colors flex items-center space-x-1.5 shadow-sm"
            id="detail-propose-amendment"
          >
            <GitPullRequest className="h-4 w-4 text-indigo-200" />
            <span>Propor Alteração neste Artigo (PR)</span>
          </button>
        </div>
      </div>

      {/* Tab select bar */}
      <div className="border-b border-slate-200">
        <div className="flex space-x-4 overflow-x-auto">
          {[
            { id: 'vigente', label: 'Texto do Artigo', icon: BookOpen },
            { id: 'comentarios', label: `Debates (${comments.length})`, icon: MessageSquare },
            { id: 'issues', label: `Issues Relevantes (${relatedIssues.length})`, icon: AlertCircle },
            { id: 'prs', label: `PRs de Emenda (${relatedPRs.length})`, icon: GitPullRequest },
            { id: 'historico', label: 'Histórico de Commits', icon: History }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-1.5 border-b-2 px-1 py-3 text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-indigo-600 text-indigo-700 font-bold'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
                }`}
                id={`detail-tab-${tab.id}`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content area */}
      <div className="min-h-64">
        {/* TEXTO VIGENTE / CIDADÃO */}
        {activeTab === 'vigente' && (
          <div className="space-y-6 fade-in" id="tab-vigente-content">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-slate-900 text-sm">Nível de Leitura Ativa</h3>
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                <button
                  onClick={() => setReadMode('tecnico')}
                  className={`flex items-center space-x-1 px-3 py-1 bg-white rounded-md text-[11px] font-bold transition-all ${
                    readMode === 'tecnico'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                  id="tab-mode-tech-btn"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Texto Legislativo</span>
                </button>
                <button
                  onClick={() => setReadMode('cidadao')}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                    readMode === 'cidadao'
                      ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-indigo-600'
                  }`}
                  id="tab-mode-citizen-btn"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Exposição Cidadã</span>
                </button>
              </div>
            </div>

            {readMode === 'tecnico' ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 space-y-4">
                <span className="font-mono text-[9px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded">TEXTO INTEGRAL VIGENTE</span>
                <p className="text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-line font-light mt-5">
                  {article.content}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/55 p-6 md:p-8 space-y-4 relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-[0.03]">
                  <Sparkles className="h-32 w-32 text-indigo-900" />
                </div>
                <span className="font-mono text-[9px] font-bold text-indigo-700 bg-indigo-100/60 px-2.5 py-1 rounded flex items-center w-fit space-x-1">
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                  <span>EXPLICAÇÃO SIMPLIFICADA PARA O CIDADÃO</span>
                </span>
                <p className="text-indigo-950 text-xs sm:text-base leading-relaxed font-normal">
                  {article.citizenExplanation}
                </p>
                <div className="border-t border-indigo-100/60 pt-4 mt-4 text-[11px] text-indigo-700/80 leading-normal">
                  <b>Nota:</b> Esta tradução explica conceitualmente o teor da lei e não desonera o cidadão de cumprir / citar o texto jurídico consolidado em suas instâncias técnicas de pleito.
                </div>
              </div>
            )}
          </div>
        )}

        {/* COMETARIOS / DEBATES */}
        {activeTab === 'comentarios' && (
          <div className="space-y-6 fade-in" id="tab-comentarios-content">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
              <h3 className="font-display font-semibold text-slate-900 text-xs sm:text-sm flex items-center space-x-1.5">
                <MessageCircle className="h-4 w-4 text-indigo-600" />
                <span>Adicionar seu ponto de vista ao debate público</span>
              </h3>

              <form onSubmit={handleAddComment} className="space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-slate-400 font-mono">PERSONA DO COMENTÁRIO:</span>
                    <select
                      value={authorRole}
                      onChange={(e) => setAuthorRole(e.target.value as any)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700 outline-none"
                    >
                      <option value="Cidadão">Cidadão (Opinião Social)</option>
                      <option value="Técnico">Técnico (Foco Operacional)</option>
                      <option value="Procurador">Procurador (Foco Jurídico)</option>
                      <option value="Vereador">Vereador (Foco Legislativo)</option>
                      <option value="Controladoria">Controladoria (Transparência/Orçamento)</option>
                    </select>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">COMO: DIONATAN SANTOS</span>
                </div>

                <textarea
                  placeholder="Escreva seu comentário técnico ou social sobre este artigo..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="w-full min-h-24 rounded-xl border border-slate-200 p-3 text-xs text-slate-700 outline-none focus:border-indigo-505 transition-colors"
                  required
                />

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="inline-flex items-center space-x-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
                  >
                    <Send className="h-3 w-3" />
                    <span>Enviar Comentário</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Commets Thread List */}
            <div className="space-y-4">
              {comments.length > 0 ? (
                comments.map((com, idx) => (
                  <div key={com.id} className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-2.5 relative">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-slate-800">{com.authorName}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                          com.authorRole === 'Cidadão'
                            ? 'bg-slate-100 text-slate-600'
                            : com.authorRole === 'Procurador' || com.authorRole === 'Técnico'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-purple-50 text-purple-700'
                        }`}>
                          {com.authorRole}
                        </span>
                      </div>
                      <span className="font-mono text-[9px] text-slate-400">
                        {new Date(com.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                      {com.content}
                    </p>
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => handleLikeComment(com.id)}
                        className="inline-flex items-center space-x-1 text-[11px] text-slate-400 hover:text-indigo-600 transition-colors"
                        id={`comment-like-${idx}`}
                      >
                        <ThumbsUp className="h-3 w-3" />
                        <span>Apoiar opinião ({com.likes})</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center bg-slate-50 text-slate-400">
                  Sem debates registrados neste artigo. Seja o primeiro a enviar!
                </div>
              )}
            </div>
          </div>
        )}

        {/* RELATED ISSUES */}
        {activeTab === 'issues' && (
          <div className="space-y-4 fade-in" id="tab-issues-content">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Demandas sociais e lacunas listadas que se relacionam a este artigo.</p>
              <button
                onClick={() => setPath('/issues/nova')}
                className="inline-flex items-center space-x-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Plus className="h-3 w-3" />
                <span>Abrir Issue Associada</span>
              </button>
            </div>

            {relatedIssues.length > 0 ? (
              relatedIssues.map(issue => (
                <div
                  key={issue.id}
                  onClick={() => onNavigateToIssue(issue.id)}
                  className="rounded-2xl border border-slate-200 bg-white p-5 cursor-pointer shadow-xs hover:border-indigo-300 transition-all flex items-start justify-between space-x-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                      <span className="font-mono font-bold text-indigo-700 text-xs">{issue.id}</span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[9px] font-bold text-slate-500 uppercase">
                        {issue.type}
                      </span>
                    </div>
                    <h4 className="font-display font-bold text-sm text-slate-900">{issue.title}</h4>
                    <p className="text-slate-500 text-xs line-clamp-2 mt-1">{issue.description}</p>
                    <div className="flex items-center space-x-2 pt-2 text-[10px] text-slate-400 font-mono">
                      <span>Por: {issue.authorName}</span>
                      <span>•</span>
                      <span>Apoios: {issue.upvotes}</span>
                    </div>
                  </div>

                  <span className={`px-2 py-1 rounded text-[9px] font-mono font-bold uppercase shrink-0 ${
                    issue.status === 'Resolvida'
                      ? 'bg-emerald-50 text-emerald-700'
                      : issue.status === 'Vinculada a PR'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}>
                    {issue.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center bg-white space-y-2">
                <AlertCircle className="mx-auto h-8 w-8 text-slate-300" />
                <p className="text-slate-400 text-xs">Não existem issues urbanas ou normativas vinculadas a este artigo.</p>
              </div>
            )}
          </div>
        )}

        {/* RELATED PRs */}
        {activeTab === 'prs' && (
          <div className="space-y-4 fade-in" id="tab-prs-content">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Alterações propostas para este artigo específico sob análise cívica.</p>
              <button
                onClick={() => onInitiatePR(article.number)}
                className="inline-flex items-center space-x-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Plus className="h-3 w-3" />
                <span>Sugerir Nova Emenda</span>
              </button>
            </div>

            {relatedPRs.length > 0 ? (
              relatedPRs.map(pr => (
                <div
                  key={pr.id}
                  onClick={() => onNavigateToPR(pr.id)}
                  className="rounded-2xl border border-slate-200 bg-white p-5 cursor-pointer shadow-xs hover:border-indigo-300 transition-all flex items-start justify-between space-x-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-emerald-700 text-xs">{pr.id}</span>
                      <span className="rounded bg-indigo-50 px-1.5 py-0.5 font-mono text-[9px] font-bold text-indigo-700 uppercase">
                        {pr.authorType}
                      </span>
                    </div>
                    <h4 className="font-display font-bold text-sm text-slate-900">{pr.title}</h4>
                    <p className="text-slate-500 text-xs line-clamp-2 mt-1">{pr.citizenSummary}</p>
                    <div className="flex items-center space-x-2 pt-2 text-[10px] text-slate-400 font-mono">
                      <span>Proponente: {pr.authorName}</span>
                      <span>•</span>
                      <span>Apoios: {pr.upvotes}</span>
                    </div>
                  </div>

                  <span className={`px-2 py-1 rounded text-[9px] font-mono font-bold uppercase shrink-0 ${
                    pr.status === 'Incorporado ao texto oficial'
                      ? 'bg-emerald-50 text-emerald-700'
                      : pr.status === 'Em votação'
                      ? 'bg-purple-50 text-purple-700'
                      : 'bg-indigo-50 text-indigo-700'
                  }`}>
                    {pr.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center bg-white space-y-2">
                <GitPullRequest className="mx-auto h-8 w-8 text-slate-300" />
                <p className="text-slate-400 text-xs">Não constam Pull Requests cívicos propondo emendas a este artigo.</p>
              </div>
            )}
          </div>
        )}

        {/* HISTORY */}
        {activeTab === 'historico' && (
          <div className="space-y-4 fade-in" id="tab-historico-content">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
              <h3 className="font-display font-semibold text-slate-900 text-xs sm:text-sm flex items-center space-x-1.5">
                <History className="h-4 w-4 text-slate-400" />
                <span>Trilha de Auditoria (Histórico de Alterações)</span>
              </h3>

              <div className="relative pl-5 border-l-2 border-slate-100 space-y-6">
                {[
                  {
                    tag: 'CONSOLIDAÇÃO VIGENTE',
                    title: 'Incorporado ao Kernel (Branch Principal)',
                    comments: 'Promulgada Emenda Orgânica Municipal de ajuste de redação das ferramentas físicas de democracia participativa de Novo Horizonte.',
                    date: article.lastUpdated,
                    hash: 'f039a82c',
                    active: true
                  },
                  {
                    tag: 'VERSÃO ANTERIOR',
                    title: 'Código Base Instalado Inicial (v2020.0)',
                    comments: 'Instituição estruturada da Lei Orgânica Geral aprovada em colégio extraordinário do município.',
                    date: '15/11/2020',
                    hash: '8fcf32dd',
                    active: false
                  }
                ].map((item, idx) => (
                  <div key={idx} className="relative">
                    {/* Circle tracker */}
                    <span className={`absolute -left-[26px] top-1.5 h-3 w-3 rounded-full border-2 border-white ${
                      item.active ? 'bg-indigo-600 shadow-sm shadow-indigo-400 animate-pulse' : 'bg-slate-300'
                    }`} />

                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2 flex-wrap gap-1">
                        <span className={`rounded px-1.5 py-0.5 font-mono text-[8px] font-bold ${
                          item.active ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {item.tag}
                        </span>
                        <span className="font-mono text-[9px] text-slate-400">HASH: <b className="text-slate-600">{item.hash}</b></span>
                      </div>
                      <h4 className="font-display font-bold text-xs sm:text-sm text-slate-900">{item.title}</h4>
                      <p className="text-slate-500 text-xs leading-normal max-w-xl">{item.comments}</p>
                      <span className="font-mono text-[9px] text-slate-400 block pt-1 flex items-center space-x-1">
                        <Clock className="h-3 w-3 text-slate-300" />
                        <span>{item.date}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
