/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Database, TrendingUp, Users, GitMerge, FileText, Sparkles, PieChart, ShieldAlert, CheckCircle } from 'lucide-react';

export default function DadosPublicosView() {
  return (
    <div className="space-y-8 fade-in" id="open-data-hub">
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-2 text-indigo-700 font-mono text-xs font-bold uppercase tracking-wider">
          <Database className="h-4 w-4" />
          <span>Painel de Dados Abertos Cômputo</span>
        </div>
        <h2 className="font-display text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
          Transparência Operacional Cívica
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
          Audite métricas consolidadas sobre quórum eleitoral local, volume de pull requests municipais e conformidade jurídica.
        </p>
      </div>

      {/* Grid statistics boxes */}
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Cidadãos Cadastrados', value: '42.938', pct: '+12% este mês', color: 'text-indigo-600 border-indigo-100 bg-indigo-50/10' },
          { label: 'PRs cívicos merged', value: '118', pct: '89.4% aprovação virtual', color: 'text-emerald-700 border-emerald-100 bg-emerald-50/10' },
          { label: 'Taxa de Auditoria Ativa', value: '98.6%', pct: 'Sem paradas físicas', color: 'text-blue-700 border-blue-100 bg-blue-50/10' },
          { label: 'Tempo Médio Triagem', value: '4.2 dias', pct: 'Equipe de Controladoria', color: 'text-amber-700 border-amber-100 bg-amber-50/10' },
        ].map((stat, idx) => (
          <div key={idx} className={`rounded-2xl border p-6 shadow-xs ${stat.color}`}>
            <span className="font-mono text-[9px] uppercase font-bold tracking-wider text-slate-500 block">{stat.label}</span>
            <p className="font-display font-extrabold text-2xl text-slate-900 mt-2">{stat.value}</p>
            <span className="font-mono text-[10px] text-slate-400 mt-1 block font-semibold">{stat.pct}</span>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Double box: demographic and budget items */}
        <div className="md:col-span-2 space-y-6">
          {/* Municipal OS Health Check */}
          <div className="rounded-2xl border border-slate-205 bg-white p-6 space-y-4">
            <h3 className="font-display font-bold text-slate-950 text-sm flex items-center space-x-1.5">
              <Sparkles className="h-4.5 w-4.5 text-indigo-600 animate-pulse" />
              <span>Status do Hub de Integração (Git Municipal)</span>
            </h3>

            <div className="space-y-3.5">
              {[
                { name: 'Kernel (Lei Orgânica)', commitId: '04c91a', status: 'Operacional', date: '08/06/2026', checkTime: '9ms' },
                { name: 'Plano Diretor Decenal', commitId: 'b839aa', status: 'Operacional (revisão de solo)', date: '02/06/2026', checkTime: '12ms' },
                { name: 'LOA (Orçamento Anual)', commitId: 'ffa82a', status: 'Em Votação de Release', date: '10/06/2026', checkTime: '3.1s' },
                { name: 'Código de Obras Públicas', commitId: '33aa1f', status: 'Operacional', date: '19/05/2026', checkTime: '4ms' },
              ].map((service, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 text-xs font-mono">
                  <div className="flex items-center space-x-3 text-slate-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                    <div>
                      <span className="font-bold block text-slate-900">{service.name}</span>
                      <span className="text-slate-400 text-[10px]">SHA-1: <b>{service.commitId}</b></span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-405 font-bold text-[10px] block">{service.date}</span>
                    <span className="text-slate-400 text-[10px]">Latência Teste Jurídico: {service.checkTime}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Audit alerts */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-205 bg-white p-5 space-y-4">
            <h4 className="font-display font-bold text-slate-900 text-xs uppercase tracking-wider">Mapeamento de Transparência</h4>
            <p className="text-slate-500 text-xs leading-relaxed">
              Todos os dados representados no Código Público são transparentes, auditáveis e extraídos diretamente das APIs oficiais da câmara e prefeitura municipal de Novo Horizonte da Serra.
            </p>

            <div className="divide-y divide-slate-100 text-xs font-mono">
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500">Formato dos Dados</span>
                <span className="font-bold text-slate-700">JSON/CSV Abertos</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500">Conexão API Externa</span>
                <span className="font-bold text-slate-705">Ativa (gRPC / Go)</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500">Acordo LGPD Federal</span>
                <span className="text-emerald-600 font-bold">100% de Conformidade</span>
              </div>
            </div>

            <button
              onClick={() => alert("Executando download do dump geral criptográfico em formato CSV zipado.")}
              className="w-full inline-flex items-center justify-center space-x-1 border border-slate-250 hover:bg-slate-50 text-slate-700 font-semibold text-xs py-2 rounded-xl"
            >
              <FileText className="h-4 w-4" />
              <span>Exportar Base Completa</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
