/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Database,
  Search,
  BookOpen,
  GitPullRequest,
  AlertCircle,
  FileText,
  Terminal,
  FolderOpen,
  Folder,
  History,
  Grid,
  List,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface RepositorySummary {
  slug: string;
  name: string;
  description: string;
  version: string;
  docsCount: number;
  activeIssues: number;
  activePRs: number;
  releasesCount: number;
  status: string;
  category: string;
}

interface RepositoryHubProps {
  repositories: RepositorySummary[];
  setPath: (path: string) => void;
  onSelectRep: (slug: string) => void;
}

export default function RepositoryHub({ repositories, setPath, onSelectRep }: RepositoryHubProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedRepoSlug, setSelectedRepoSlug] = useState<string | null>(null);

  const categories = ['all', 'Kernel', 'Desenvolvimento', 'Cotidiano', 'Orçamento', 'Tributos'];

  const filteredRepos = repositories.filter(repo => {
    const matchesSearch =
      repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repo.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || repo.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  const selectedRepo = repositories.find(r => r.slug === selectedRepoSlug);

  return (
    <div className="space-y-8 fade-in" id="repos-manager">
      {/* If looking at general repository grid list */}
      {!selectedRepoSlug ? (
        <div className="space-y-6">
          <div className="border-b border-slate-200 pb-5">
            <div className="flex items-center space-x-2 text-indigo-700 font-mono text-xs font-bold uppercase tracking-wider">
              <Database className="h-4 w-4" />
              <span>Base de Dados Normativa</span>
            </div>
            <h2 className="font-display text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              Repositórios do Município de Novo Horizonte
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Os módulos normativos e o runtime orçamentário do nosso sistema operacional municipal.
            </p>
          </div>

          {/* Search bar and filters */}
          <div className="flex flex-col sm:flex-row gap-3.5 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar em Códigos, Planos orçamentários ou Leis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs text-slate-705 outline-none focus:border-indigo-505 transition-colors"
              />
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-[11px] text-slate-400 font-mono">CATEGORIA:</span>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 outline-none"
              >
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat}>
                    {cat === 'all' ? 'Todos' : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Repos Grid */}
          <div className="grid sm:grid-cols-2 gap-6">
            {filteredRepos.map((repo, idx) => (
              <div
                key={repo.slug}
                onClick={() => {
                  if (repo.slug === 'lei-organica') {
                    setPath('/lei-organica');
                  } else {
                    setSelectedRepoSlug(repo.slug);
                  }
                }}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs select-none transition-all hover:border-slate-350 cursor-pointer hover:shadow-md flex flex-col justify-between"
                id={`repo-card-${repo.slug}`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-indigo-50 px-2.5 py-0.5 font-mono text-[9px] font-bold text-indigo-700 uppercase">
                      {repo.category}
                    </span>
                    <span className="font-mono text-[10px] font-semibold text-slate-400">
                      Versão: <b className="text-slate-700 font-bold">{repo.version}</b>
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-base text-slate-900 group-hover:text-indigo-600">
                    {repo.name}
                  </h3>

                  <p className="text-slate-500 text-xs leading-relaxed line-clamp-3">
                    {repo.description}
                  </p>
                </div>

                {/* Simulated file statistics row */}
                <div className="border-t border-slate-100 pt-4 mt-5 flex items-center justify-between flex-wrap gap-2 text-slate-400 font-mono text-[10px]">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1" title="Arquivos públicos indexados">
                      <FileText className="h-3.5 w-3.5 text-slate-400" />
                      <span>{repo.docsCount} canônicos</span>
                    </div>
                    <div className="flex items-center space-x-1" title="Issues abertas">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                      <span>{repo.activeIssues} issues</span>
                    </div>
                    <div className="flex items-center space-x-1" title="Pull Requests legislativos">
                      <GitPullRequest className="h-3.5 w-3.5 text-indigo-500" />
                      <span>{repo.activePRs} PRs</span>
                    </div>
                  </div>

                  <span className="text-indigo-600 font-semibold group-hover:underline flex items-center space-x-1">
                    <span>Inspecionar</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Inside Repository view (Github-Inspired Workspace File Explorer) */
        <div className="space-y-6">
          {/* Back to Hub list */}
          <button
            onClick={() => setSelectedRepoSlug(null)}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            id="repo-explorer-back"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            <span>Voltar para de Repositórios</span>
          </button>

          {/* Repo Explorer head */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-105 pb-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-emerald-600 font-mono text-xs font-bold uppercase tracking-wider">
                  <Database className="h-4 w-4" />
                  <span>Repositório Mapeado Ativo</span>
                </div>
                <h3 className="font-display font-extrabold text-xl sm:text-2xl text-slate-950 tracking-tight">
                  {selectedRepo?.name}
                </h3>
              </div>

              <div className="flex items-center space-x-2 shrink-0 font-mono text-xs text-slate-500">
                <span>REVISION MASTER:</span>
                <span className="rounded bg-slate-900 text-white font-bold px-2 py-0.5">
                  {selectedRepo?.version}
                </span>
              </div>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-3xl">
              {selectedRepo?.description}
            </p>

            {/* Quick links */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                onClick={() => setPath('/issues')}
                className="rounded-lg border border-slate-200 px-3 py-1 bg-white text-slate-600 hover:text-slate-800 font-semibold text-xs flex items-center space-x-1"
              >
                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                <span>Conversas ({selectedRepo?.activeIssues} abertas)</span>
              </button>
              <button
                onClick={() => setPath('/prs')}
                className="rounded-lg border border-slate-200 px-3 py-1 bg-white text-slate-600 hover:text-slate-800 font-semibold text-xs flex items-center space-x-1"
              >
                <GitPullRequest className="h-3.5 w-3.5 text-indigo-500" />
                <span>Pull Requests ({selectedRepo?.activePRs} em revisão)</span>
              </button>
              <button
                onClick={() => setPath('/releases')}
                className="rounded-lg border border-slate-200 px-3 py-1 bg-white text-slate-600 hover:text-slate-800 font-semibold text-xs flex items-center space-x-1"
              >
                <History className="h-3.5 w-3.5 text-blue-500" />
                <span>Releases de Leis</span>
              </button>
            </div>
          </div>

          {/* GitHub-Inspired Folder / File Explorer card */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            {/* Header file-info panel */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-200 text-xs font-mono text-slate-400">
              <div className="flex items-center space-x-2 text-slate-700">
                <ChevronRight className="h-4 w-4" />
                <span className="font-bold">novo-horizonte-so / {selectedRepo?.slug} /</span>
              </div>
              <span className="hidden sm:inline">ÚLTIMO MERGE: EMB-v1.4 • 02/06/2026</span>
            </div>

            {/* File explorer rows */}
            <div className="divide-y divide-slate-100 font-mono text-xs">
              {/* Folder Row */}
              <div className="flex items-center justify-between px-5 py-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center space-x-3 cursor-pointer">
                  <Folder className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
                  <span className="text-slate-900 hover:underline">src_leis_originais/</span>
                </div>
                <span className="text-slate-400 text-[11px] hidden sm:block">Diretório de emendas canônicas</span>
                <span className="text-slate-400 text-[11px] font-mono">Pasta de códigos</span>
              </div>

              {/* Folder Row */}
              <div className="flex items-center justify-between px-5 py-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center space-x-3 cursor-pointer">
                  <Folder className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
                  <span className="text-slate-900 hover:underline">anexos_fiscais_calculadoras/</span>
                </div>
                <span className="text-slate-400 text-[11px] hidden sm:block">Fórmulas e tabelas estruturadas</span>
                <span className="text-slate-400 text-[11px] font-mono">Pasta de dados</span>
              </div>

              {/* File 1 */}
              <div className="flex items-center justify-between px-5 py-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center space-x-3 cursor-pointer text-indigo-700">
                  <span className="text-indigo-600 block shrink-0"><FileText className="h-4.5 w-4.5" /></span>
                  <span className="hover:underline font-bold text-slate-900">texto_canônico_vigente.md</span>
                </div>
                <span className="text-slate-400 text-[11px] hidden sm:block">Emenda geral nº 14 consolidada</span>
                <span className="text-slate-500 text-[11px] font-mono font-bold text-emerald-600 hover:underline cursor-pointer flex items-center space-x-1">
                  <span>Abrir arquivo</span>
                  <ExternalLink className="h-3 w-3" />
                </span>
              </div>

              {/* File 2 */}
              <div className="flex items-center justify-between px-5 py-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center space-x-3 cursor-pointer text-indigo-700">
                  <span className="text-indigo-600 block shrink-0"><FileText className="h-4.5 w-4.5" /></span>
                  <span className="hover:underline font-bold text-slate-900">quadros_de_metas_execucao.csv</span>
                </div>
                <span className="text-slate-400 text-[11px] hidden sm:block">Planilha de metas georreferenciadas</span>
                <span className="text-slate-500 text-[11px] font-mono font-bold text-emerald-600 hover:underline cursor-pointer flex items-center space-x-1">
                  <span>Ver tabela</span>
                  <ExternalLink className="h-3 w-3" />
                </span>
              </div>
            </div>
          </div>

          {/* Sandbox alert */}
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 font-mono text-[11px] text-slate-500 max-w-xl">
            <b>Console de Depuração:</b> Este repositório está indexado e sincronizado à branch master do servidor. Qualquer alteração sugerida deve vir através de um PR cívico para manter a integridade dos checks institucionais.
          </div>
        </div>
      )}
    </div>
  );
}
