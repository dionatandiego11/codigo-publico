/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Scale,
  Search,
  BookOpen,
  Eye,
  MessageSquare,
  GitPullRequest,
  History,
  GitCompare,
  Plus,
  ArrowRight,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { LawArticle } from '@/src/types';

interface OrganicLawViewerProps {
  artigos: LawArticle[];
  setPath: (path: string) => void;
  onSelectArticle: (art: LawArticle) => void;
  onInitiatePRFromArticle: (articleNumber: number) => void;
}

export default function OrganicLawViewer({
  artigos,
  setPath,
  onSelectArticle,
  onInitiatePRFromArticle
}: OrganicLawViewerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChapter, setSelectedChapter] = useState<string>('all');
  const [readMode, setReadMode] = useState<'cidadao' | 'tecnico'>('tecnico');
  const [showVersionsModal, setShowVersionsModal] = useState(false);

  // Extract unique Chapters
  const chapters = ['all', ...Array.from(new Set(artigos.map(a => a.chapter)))];

  // Filtering
  const filteredArtigos = artigos.filter(art => {
    const matchesSearch =
      art.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      art.citizenExplanation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `artigo ${art.number}`.includes(searchTerm.toLowerCase()) ||
      art.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesChapter = selectedChapter === 'all' || art.chapter === selectedChapter;

    return matchesSearch && matchesChapter;
  });

  return (
    <div className="space-y-8 fade-in" id="organic-law-manager">
      {/* Header section with Kernel and Version metadata */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between border-b border-slate-200 pb-5 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-700 font-mono text-xs font-bold uppercase tracking-wider">
            <Scale className="h-4 w-4" />
            <span>Repositório Principal (Kernel)</span>
          </div>
          <h2 className="font-display text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Lei Orgânica Municipal de Novo Horizonte
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            O código constitucional municipal em sua última versão oficial incorporada.
          </p>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowVersionsModal(true)}
            className="flex items-center space-x-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            title="Ver histórico de modificações"
            id="law-history-btn"
          >
            <History className="h-4 w-4 text-slate-400" />
            <span>Versões (Releases)</span>
          </button>
          <button
            onClick={() => setPath('/lei-organica/comparar')}
            className="flex items-center space-x-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            title="Comparar versões consolidadas"
            id="law-compare-btn"
          >
            <GitCompare className="h-4 w-4 text-indigo-500" />
            <span>Diff de Versões</span>
          </button>
          <button
            onClick={() => onInitiatePRFromArticle(0)}
            className="flex items-center space-x-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm"
            id="law-propose-pr"
          >
            <Plus className="h-4 w-4" />
            <span>Propor Alteração (PR)</span>
          </button>
        </div>
      </div>

      {/* Meta indicators container */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center sm:text-left border-r border-slate-100 last:border-0 pr-4">
          <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 font-bold">Branch Ativa</span>
          <p className="font-display font-bold text-slate-800 text-sm mt-0.5">consolidada/main</p>
        </div>
        <div className="text-center sm:text-left border-r border-slate-100 last:border-0 pr-4">
          <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 font-bold">Versão Instalada</span>
          <p className="font-display font-extrabold text-indigo-700 text-sm mt-0.5">v2026.0</p>
        </div>
        <div className="text-center sm:text-left border-r border-slate-100 last:border-0 pr-4">
          <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 font-bold">Última Modificação</span>
          <p className="font-display font-semibold text-slate-600 text-sm mt-0.5">Emenda nº 03/2024</p>
        </div>
        <div className="text-center sm:text-left">
          <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 font-bold">PRs Cívicos Abertos</span>
          <p className="font-display font-bold text-amber-600 text-sm mt-0.5">2 Propostas</p>
        </div>
      </section>

      {/* Main double level selector and Search toolbar */}
      <div className="grid md:grid-cols-12 gap-4 items-center">
        {/* Search */}
        <div className="md:col-span-4 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar artigo, termo jurídico ou tema..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs text-slate-700 outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Chapter Filter */}
        <div className="md:col-span-4">
          <select
            value={selectedChapter}
            onChange={(e) => setSelectedChapter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs text-slate-600 outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="all">Filtro por Capítulo: Todos</option>
            {chapters.filter(ch => ch !== 'all').map((ch, idx) => (
              <option key={idx} value={ch}>{ch}</option>
            ))}
          </select>
        </div>

        {/* Cidadão vs Técnico Switch */}
        <div className="md:col-span-4 flex items-center justify-end">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button
              onClick={() => setReadMode('tecnico')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                readMode === 'tecnico'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
              id="mode-tech-btn"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Modo Técnico (Vigente)</span>
            </button>
            <button
              onClick={() => setReadMode('cidadao')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                readMode === 'cidadao'
                  ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-indigo-600'
              }`}
              id="mode-citizen-btn"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Modo Cidadão (Explicação)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preâmbulo citation block if looking at all-general list */}
      {searchTerm === '' && selectedChapter === 'all' && (
        <div className="rounded-2xl border border-dashed border-slate-200 p-5 bg-slate-50 text-center max-w-2xl mx-auto space-y-2">
          <span className="font-serif font-semibold italic text-slate-500 text-sm">“Preâmbulo”</span>
          <p className="font-serif text-slate-600 italic text-xs leading-relaxed">
            &ldquo;Nós, representantes do povo do Município de Novo Horizonte, sob a proteção de Deus e com o firme propósito de assegurar a justiça, a liberdade, o desenvolvimento e os direitos municipais locais, decretamos a presente Lei Orgânica...&rdquo;
          </p>
        </div>
      )}

      {/* Articles Grid layout */}
      <div className="space-y-4">
        {filteredArtigos.length > 0 ? (
          filteredArtigos.map((art) => (
            <div
              key={art.id}
              className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-md ${
                art.amendmentNumber ? 'border-l-4 border-l-teal-500' : ''
              }`}
              id={`article-card-${art.number}`}
            >
              {/* Card overhead identifiers */}
              <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <div className="space-y-1">
                  <span className="font-mono text-[9px] font-bold text-slate-400 block tracking-wider uppercase">
                    {art.title}
                  </span>
                  <span className="font-display font-extrabold text-slate-950 text-sm block">
                    Artigo {art.number}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {art.amendmentNumber && (
                    <span className="rounded bg-teal-50 px-2 py-0.5 font-mono text-[9px] font-bold text-teal-700 uppercase">
                      {art.amendmentNumber}
                    </span>
                  )}
                  <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-500">
                    {art.version} (visto {art.lastUpdated})
                  </span>
                </div>
              </div>

              {/* Toggle-bound display */}
              <div className="py-4">
                {readMode === 'tecnico' ? (
                  <p className="text-slate-800 text-sm font-light leading-relaxed whitespace-pre-line">
                    {art.content}
                  </p>
                ) : (
                  <div className="rounded-xl bg-indigo-50/50 border border-indigo-100/40 p-4 space-y-1.5 animate-in fade-in duration-200">
                    <span className="font-mono text-[9px] font-bold text-indigo-700 uppercase flex items-center space-x-1 select-none">
                      <Sparkles className="h-3 w-3 animate-pulse" />
                      <span>Tradução Popular Ativa</span>
                    </span>
                    <p className="text-indigo-950 text-xs sm:text-sm leading-relaxed">
                      {art.citizenExplanation}
                    </p>
                  </div>
                )}
              </div>

              {/* Card Actions Footer */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3.5 flex-wrap gap-2.5">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => onSelectArticle(art)}
                    className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors font-semibold"
                    id={`art-comment-btn-${art.number}`}
                  >
                    <MessageSquare className="h-4 w-4 text-slate-400" />
                    <span>Debater e Comentários ({art.comments.length})</span>
                  </button>
                  <button
                    onClick={() => onInitiatePRFromArticle(art.number)}
                    className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors font-semibold"
                    id={`art-amend-btn-${art.number}`}
                  >
                    <GitPullRequest className="h-4 w-4 text-slate-400" />
                    <span>Sugerir Emenda</span>
                  </button>
                </div>

                <button
                  onClick={() => onSelectArticle(art)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-xs text-slate-600 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 transition-colors flex items-center space-x-1"
                  title="Abas de histórico, issues associadas e debates"
                  id={`view-full-art-btn-${art.number}`}
                >
                  <span>Análise Detalhada</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center bg-white">
            <p className="text-slate-400">Nenhum artigo encontrado para os filtros selecionados.</p>
          </div>
        )}
      </div>

      {/* Embedded Releases Modal */}
      {showVersionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl relative animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display font-bold text-base text-slate-900 flex items-center space-x-2">
                <History className="h-5 w-5 text-indigo-600" />
                <span>Releases e Logs do Kernel</span>
              </h3>
              <button
                onClick={() => setShowVersionsModal(false)}
                className="font-mono text-xs font-semibold text-slate-400 hover:text-slate-600"
              >
                Fechar
              </button>
            </div>
            <div className="mt-4 space-y-4">
              {[
                { version: 'v2026.0', date: 'Janeiro de 2026', comments: 'Incorporada emenda do clima e diretrizes ambientais.', live: true },
                { version: 'v2024.1', date: 'Dezembro de 2024', comments: 'Ajuste às diretrizes do plano de desenvolvimento agrícola.' },
                { version: 'v2024.0', date: 'Junho de 2024', comments: 'Inclusão da Emenda das Participações e audiência pública.' }
              ].map((v, i) => (
                <div key={i} className="flex items-start space-x-3.5 border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                  <span className={`p-1.5 rounded-lg text-[10px] font-mono font-bold uppercase ${v.live ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {v.version}
                  </span>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <h4 className="font-bold text-xs text-slate-800">{v.date}</h4>
                      {v.live && <span className="h-2 w-2 rounded-full bg-emerald-500" title="Branch principal consolidada ativa" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{v.comments}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                setShowVersionsModal(false);
                setPath('/releases');
              }}
              className="mt-5 w-full rounded-xl bg-slate-900 text-white font-semibold text-xs py-2.5 text-center hover:bg-slate-800 transition-colors flex items-center justify-center space-x-1"
            >
              <span>Ver Changelogs Completos</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
