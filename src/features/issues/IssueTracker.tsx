/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Plus,
  Search,
  MessageSquare,
  ThumbsUp,
  MapPin,
  Clock,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  Paperclip,
  Share2,
  Building2,
  Bookmark,
  Send,
  HelpCircle
} from 'lucide-react';
import { Issue, IssueType, IssueStatus, LawArticle, Territory } from '@/src/types';

interface IssueTrackerProps {
  issues: Issue[];
  artigos: LawArticle[];
  repos: { slug: string; name: string }[];
  territories: Territory[];
  initialSelectedId?: string | null;
  onSelectedChange?: (issueId: string | null) => void;
  onBackToHome: () => void;
  onSubmitNewIssue: (data: any) => void;
  onUpvoteIssue: (issueId: string) => void;
  onCommentIssue: (issueId: string, content: string) => void;
  currentUserName?: string;
  onNavigateToPR: (prId: string) => void;
}

export default function IssueTracker({
  issues,
  artigos,
  repos,
  territories,
  initialSelectedId = null,
  onSelectedChange,
  onBackToHome,
  onSubmitNewIssue,
  onUpvoteIssue,
  onCommentIssue,
  currentUserName,
  onNavigateToPR
}: IssueTrackerProps) {
  const [selectedIssueId, setSelectedIssueIdState] = useState<string | null>(initialSelectedId);

  // Sincroniza a seleção com a rota (/issues/:id) e propaga mudanças à URL.
  useEffect(() => {
    setSelectedIssueIdState(initialSelectedId);
  }, [initialSelectedId]);

  const setSelectedIssueId = (issueId: string | null) => {
    setSelectedIssueIdState(issueId);
    onSelectedChange?.(issueId);
  };
  const [showNewForm, setShowNewForm] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTerritory, setSelectedTerritory] = useState<string>('all');

  // Single issue commenting stimulation
  const [commentText, setCommentText] = useState('');

  // New Issue Form inputs
  const [formType, setFormType] = useState<IssueType>('Problema público');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTerritory, setFormTerritory] = useState('Todo o Município');
  const [formTheme, setFormTheme] = useState('');
  const [formRelatedArticle, setFormRelatedArticle] = useState('');
  const [formRelatedRepo, setFormRelatedRepo] = useState('');
  const [formDepartment, setFormDepartment] = useState('');
  const [formFiles, setFormFiles] = useState<string>('');

  const issueTypes: IssueType[] = [
    'Problema público',
    'Lacuna normativa',
    'Falha de execução',
    'Inconsistência orçamentária',
    'Sugestão de melhoria',
    'Pedido de transparência'
  ];

  const issueStatuses: IssueStatus[] = [
    'Aberta',
    'Em triagem',
    'Em debate',
    'Vinculada a PR',
    'Em análise técnica',
    'Resolvida',
    'Arquivada'
  ];

  // Filtering implementation
  const filteredIssues = issues.filter(issue => {
    const matchesSearch =
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedType === 'all' || issue.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || issue.status === selectedStatus;
    const matchesTerritory = selectedTerritory === 'all' || issue.territory === selectedTerritory;

    return matchesSearch && matchesType && matchesStatus && matchesTerritory;
  });

  const selectedIssue = issues.find(i => i.id === selectedIssueId);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDescription.trim()) return;

    const newIssuePayload = {
      title: formTitle,
      type: formType,
      territory: formTerritory,
      theme: formTheme || 'Geral',
      description: formDescription,
      authorName: currentUserName ?? 'Cidadão de Novo Horizonte',
      assignedDepartment: formDepartment || 'Controladoria e Triagem Geral',
      relatedArticleId: formRelatedArticle || undefined,
      relatedRepository: formRelatedRepo || undefined,
    };

    onSubmitNewIssue(newIssuePayload);

    // Reset fields and close form
    setFormTitle('');
    setFormDescription('');
    setFormTheme('');
    setFormRelatedArticle('');
    setFormRelatedRepo('');
    setFormDepartment('');
    setShowNewForm(false);
  };

  const currentLocalTime = "2026-06-10 12:10";

  return (
    <div className="space-y-6 fade-in" id="issues-hub">
      {/* 1. GENERAL ISSUE LIST PATH */}
      {!selectedIssueId && !showNewForm && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between border-b border-slate-200 pb-5 gap-4">
            <div>
              <div className="flex items-center space-x-2 text-indigo-700 font-mono text-xs font-bold uppercase tracking-wider">
                <AlertCircle className="h-4 w-4" />
                <span>Rastreador de Demandas Políticas</span>
              </div>
              <h2 className="font-display text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                Issues Cívicas e Urbanas
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                Veja problemas urbanos em triagem fiscal ou lacunas legais no kernel normativo da cidade.
              </p>
            </div>

            <button
              onClick={() => setShowNewForm(true)}
              className="rounded-xl bg-indigo-600 text-white font-semibold text-xs px-4 py-2.5 hover:bg-indigo-700 shadow-sm transition-colors flex items-center space-x-1.5 shrink-0"
              id="new-issue-btn"
            >
              <Plus className="h-4 w-4" />
              <span>Reportar Problema / Abrir Issue</span>
            </button>
          </div>

          {/* Search Toolbar & Multi-filters */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex gap-3 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrar por título, nº de issue ou palavras-chave de triagem..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-xs text-slate-705 outline-none focus:bg-white focus:border-indigo-500 transition-all font-mono"
              />
            </div>

            {/* Quick selectors row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">Tipo de demanda</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-600 outline-none"
                >
                  <option value="all">Ver Todos os Tipos</option>
                  {issueTypes.map((type, idx) => (
                    <option key={idx} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">Status de triagem</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-600 outline-none"
                >
                  <option value="all">Ver Todos os Status</option>
                  {issueStatuses.map((st, idx) => (
                    <option key={idx} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">Território/Bairro</label>
                <select
                  value={selectedTerritory}
                  onChange={(e) => setSelectedTerritory(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-600 outline-none"
                >
                  <option value="all">Todos os Territórios</option>
                  <option value="Todo o Município">Todo o Município (Geral)</option>
                  {territories.map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Issues table list styled with GitHub indicators */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs divide-y divide-slate-100">
            {filteredIssues.length > 0 ? (
              filteredIssues.map((issue) => (
                <div
                  key={issue.id}
                  onClick={() => setSelectedIssueId(issue.id)}
                  className="p-5 hover:bg-slate-50/50 cursor-pointer transition-colors flex items-start space-x-3.5 select-none"
                  id={`issue-row-${issue.id.replace('#', '')}`}
                >
                  {/* Icon status with coloring */}
                  <div className={`mt-0.5 shrink-0 p-1.5 rounded-lg ${
                    issue.status === 'Resolvida'
                      ? 'bg-emerald-50 text-emerald-600'
                      : issue.status === 'Vinculada a PR'
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'bg-amber-50 text-amber-600'
                  }`}>
                    <AlertCircle className="h-4.5 w-4.5" />
                  </div>

                  {/* Main cell information */}
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center space-x-2 flex-wrap gap-1">
                      <span className="font-mono text-xs font-bold text-slate-700">{issue.id}</span>
                      <h4 className="font-display font-bold text-sm text-slate-900 group-hover:text-indigo-600 line-clamp-1 leading-snug">
                        {issue.title}
                      </h4>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                        {issue.type}
                      </span>
                    </div>

                    <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                      {issue.description}
                    </p>

                    {/* Metadata indicators */}
                    <div className="flex items-center space-x-3.5 pt-1.5 flex-wrap gap-1 font-mono text-[10px] text-slate-400">
                      <span className="flex items-center space-x-1.5 text-slate-600 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                        <MapPin className="h-3 w-3" />
                        <span>{issue.territory}</span>
                      </span>
                      <span>Autor: {issue.authorName}</span>
                      <span>•</span>
                      <span>Tema: {issue.theme}</span>
                      {issue.linkedPRId && (
                        <span className="text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
                          Link -&gt; {issue.linkedPRId}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Side elements */}
                  <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                    <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase ${
                      issue.status === 'Resolvida'
                        ? 'text-emerald-700 bg-emerald-50'
                        : issue.status === 'Em triagem'
                        ? 'text-slate-500 bg-slate-100'
                        : 'text-amber-700 bg-amber-50'
                    }`}>
                      {issue.status}
                    </span>

                    <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono">
                      <span className="flex items-center space-x-0.5">
                        <ThumbsUp className="h-3 w-3" />
                        <span>{issue.upvotes}</span>
                      </span>
                      <span className="flex items-center space-x-0.5">
                        <MessageSquare className="h-3 w-3" />
                        <span>{issue.comments.length}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center bg-white">
                <p className="text-slate-400 text-xs">Nenhuma issue pública encontrada sob os parâmetros informados.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. ISSUE DETAIL MODULE */}
      {selectedIssueId && selectedIssue && (
        <div className="space-y-6 max-w-4xl mx-auto w-full">
          <button
            onClick={() => setSelectedIssueId(null)}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            id="issue-detail-back"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar para todas as issues</span>
          </button>

          {/* Issue Header block */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2 flex-wrap gap-1">
                  <span className="font-mono text-sm font-bold text-slate-500">{selectedIssue.id}</span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                    {selectedIssue.type}
                  </span>
                  <span className="flex items-center space-x-1 text-slate-500 font-semibold text-xs ml-1 bg-slate-50 px-2 py-0.5 rounded border">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{selectedIssue.territory}</span>
                  </span>
                </div>
                <h3 className="font-display font-extrabold text-xl text-slate-900 leading-snug">
                  {selectedIssue.title}
                </h3>
              </div>

              <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold uppercase shrink-0 ${
                selectedIssue.status === 'Resolvida'
                  ? 'bg-emerald-50 text-emerald-700'
                  : selectedIssue.status === 'Vinculada a PR'
                  ? 'bg-indigo-50 text-indigo-700 font-bold'
                  : 'bg-amber-50 text-amber-700'
              }`}>
                {selectedIssue.status}
              </span>
            </div>

            {/* Description Body */}
            <div className="py-2 space-y-4">
              <div className="text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line bg-slate-50/55 p-5 rounded-2xl border border-slate-200/50">
                {selectedIssue.description}
              </div>

              {/* Department assignment and Meta row */}
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div className="rounded-xl border border-slate-200 p-3 flex items-start space-x-3.5 bg-white">
                  <Building2 className="h-4.5 w-4.5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <h5 className="font-mono text-[9px] font-bold text-slate-400 uppercase">Órgão Público Encarregado</h5>
                    <p className="font-semibold text-slate-700 text-xs mt-0.5">{selectedIssue.assignedDepartment}</p>
                  </div>
                </div>

                {selectedIssue.linkedPRId && (
                  <div
                    onClick={() => onNavigateToPR(selectedIssue.linkedPRId!)}
                    className="rounded-xl border border-indigo-200 p-3 flex items-start space-x-3.5 bg-indigo-50/40 cursor-pointer hover:bg-indigo-50 transition-colors"
                  >
                    <Plus className="h-4.5 w-4.5 text-indigo-500 mt-0.5 shrink-0" />
                    <div>
                      <h5 className="font-mono text-[9px] font-bold text-indigo-700 uppercase">PR Cívico Associado</h5>
                      <p className="font-bold text-slate-900 text-xs mt-0.5">{selectedIssue.linkedPRId} — Ir para a alteração proposta</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Support and Share indicators */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4 flex-wrap gap-2 text-slate-400 text-xs font-mono">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => onUpvoteIssue(selectedIssue.id)}
                  className="font-semibold text-slate-600 hover:text-indigo-600 transition-colors flex items-center space-x-1.5"
                  id="issue-upvote-btn"
                >
                  <ThumbsUp className="h-4 w-4 text-slate-400" />
                  <span>Apoiar esta demanda ({selectedIssue.upvotes} apoios)</span>
                </button>
              </div>
              <span>Enviado por {selectedIssue.authorName} • {new Date(selectedIssue.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Issue Comments timeline feed Section/Discussion */}
          <div className="space-y-4">
            <h4 className="font-display font-bold text-slate-900 text-sm flex items-center space-x-1.5">
              <MessageSquare className="h-4.5 w-4.5 text-indigo-600" />
              <span>Linha do Tempo de Discussões e Resoluções ({selectedIssue.comments.length})</span>
            </h4>

            {/* Comment submittal form */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3.5">
              <h5 className="font-display font-semibold text-xs text-slate-900">Adicionar nota técnica ou manifestação popular</h5>
              <div className="flex gap-2">
                <textarea
                  placeholder="Seu recado de fiscalização social, sugestão ou parecer preliminar..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 min-h-20 rounded-xl border border-slate-200 p-3 text-xs text-slate-700 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    if (!commentText.trim()) return;
                    onCommentIssue(selectedIssue.id, commentText);
                    setCommentText('');
                  }}
                  className="rounded-lg bg-slate-900 text-white font-semibold text-xs px-3.5 py-1.5 hover:bg-slate-850 flex items-center space-x-1"
                >
                  <Send className="h-3 w-3" />
                  <span>Enviar Nota</span>
                </button>
              </div>
            </div>

            {/* Previous messages */}
            <div className="space-y-4">
              {selectedIssue.comments.map((com, idx) => (
                <div key={com.id || idx} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-2 flex-wrap gap-1 font-mono text-[10px] text-slate-400">
                    <span className="font-bold text-slate-700 text-xs font-sans">{com.authorName}</span>
                    <span>{new Date(com.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{com.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. NEW ISSUE CREATION FORM CONTAINER */}
      {showNewForm && (
        <div className="space-y-6 max-w-3xl mx-auto w-full">
          <button
            onClick={() => setShowNewForm(false)}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            id="new-fb-back"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Cancelar e voltar</span>
          </button>

          <form onSubmit={handleFormSubmit} className="rounded-2xl border border-indigo-100 bg-white p-6 md:p-8 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="font-display font-extrabold text-xl text-slate-950 flex items-center space-x-2">
                <Plus className="h-6 w-6 text-indigo-600 bg-indigo-50 p-1 rounded-lg shrink-0" />
                <span>Abrir Nova Issue Pública / Normativa</span>
              </h3>
              <p className="text-slate-500 text-xs mt-1">
                Registre uma lacuna legislativa ou uma quebra fiscalizatória territorial de esferas locais.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Type selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Qual o tipo de issue?</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as IssueType)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-705 outline-none focus:border-indigo-500"
                >
                  {issueTypes.map((type, idx) => (
                    <option key={idx} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Territory selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Território correspondente</label>
                <select
                  value={formTerritory}
                  onChange={(e) => setFormTerritory(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-705 outline-none focus:border-indigo-500"
                >
                  <option value="Todo o Município">Todo o Município (Geral)</option>
                  {territories.map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Título sucinto (Max 80 caracteres)</label>
              <input
                type="text"
                maxLength={80}
                required
                placeholder="Exemplo: Lei Orgânica não possui regras claras de auditoria cidadã de zoneamento"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-755 outline-none focus:border-indigo-505"
              />
            </div>

            {/* Theme Area */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Tema / Área temática</label>
                <input
                  type="text"
                  placeholder="Ex: Transparência, Infraestrutura, Clima..."
                  value={formTheme}
                  onChange={(e) => setFormTheme(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-755 outline-none focus:border-indigo-505"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Secretaria / Órgão Encarregado (se houver)</label>
                <input
                  type="text"
                  placeholder="Ex: Secretaria de Obras, Controladoria Geral..."
                  value={formDepartment}
                  onChange={(e) => setFormDepartment(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-755 outline-none"
                />
              </div>
            </div>

            {/* Link to repo or law ARTICLE if normative */}
            {(formType === 'Lacuna normativa' || formType === 'Inconsistência orçamentária') && (
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/20 p-4 space-y-4">
                <span className="font-mono text-[9px] font-extrabold text-indigo-700 uppercase flex items-center space-x-1">
                  <Sparkles className="h-3 w-3" />
                  <span>Configuração de Vínculos Normativos</span>
                </span>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Repositório Normativo</label>
                    <select
                      value={formRelatedRepo}
                      onChange={(e) => setFormRelatedRepo(e.target.value)}
                      className="w-full rounded bg-white border border-slate-200 p-2 text-xs text-slate-600 outline-none"
                    >
                      <option value="">Nenhum/Indeterminado</option>
                      {repos.map(r => (
                        <option key={r.slug} value={r.name}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Artigo relacionado (opcional)</label>
                    <select
                      value={formRelatedArticle}
                      onChange={(e) => setFormRelatedArticle(e.target.value)}
                      className="w-full rounded bg-white border border-slate-200 p-2 text-xs text-slate-600 outline-none"
                    >
                      <option value="">Nenhum/Indeterminado</option>
                      {artigos.map(a => (
                        <option key={a.id} value={a.id}>Artigo {a.number} - {a.chapter.split(':')[0]}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Instruções detalhadas e evidências</label>
              <textarea
                required
                placeholder="Apresente uma argumentação sólida. Por que isso fere as diretrizes vigentes ou causa prejuízos locais?"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full min-h-32 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-755 outline-none focus:border-indigo-505"
              />
            </div>

            {/* Attachment block */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Simular anexos (Opcional)</label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50 transition-colors flex flex-col items-center">
                <Paperclip className="h-6 w-6 text-slate-400 mb-1" />
                <span className="text-xs text-slate-600 font-semibold select-none">Carregar fotos, PDFs ou documentos legais provisórios</span>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5">Formatos suportados: PDF, JPG, PNG, CSV (Max 10MB)</span>
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
                Abrir Issue Pública
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
