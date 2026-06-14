import { useEffect, useState } from 'react';
import { Activity, CircleCheckBig, GitMerge, LayoutDashboard, LoaderCircle, ShieldAlert } from 'lucide-react';
import { getPRTransitions, type PRTransitionInfo, type PublicStats } from '../lib/api';
import { Badge, statusClass } from '../shared/ui';
import { BondValidationPanel } from './BondValidationPanel';
import type { CivicPR, Issue, IssueStatus, PRStatus, Territory } from '../types';

const triageButtonClass = 'btn-secondary btn-sm flex-1';
const approveButtonClass = 'btn-success btn-sm flex-1';
const mergeButtonClass = 'btn-primary btn-sm flex-1';

export function InstitutionalPanel({
  issues,
  prs,
  territories,
  isAuthenticated,
  onTriageIssue,
  onTriagePR,
  stats
}: {
  issues: Issue[];
  prs: CivicPR[];
  territories: Territory[];
  isAuthenticated: boolean;
  onTriageIssue: (issueId: string, status: IssueStatus) => void;
  onTriagePR: (prId: string, status: PRStatus) => void;
  stats?: PublicStats;
}) {
  const pendingIssues = issues.filter(issue => !['Resolvida', 'Arquivada'].includes(issue.status));
  const activePRs = prs.filter(pr => !['Incorporado ao texto oficial', 'Rejeitado', 'Arquivado'].includes(pr.status));

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-git-purple)] font-bold mb-1 icon-glow-purple">Rito formal</p>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-[var(--color-git-purple)]" />
            Console Administrativo
          </h1>
          <p className="mt-1 text-sm text-[var(--color-git-muted)] max-w-2xl">
            Ambiente restrito. Controle a tramitação legislativa, delibere sobre propostas e execute o merge institucional.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard icon={Activity} label="Issues Abertas" value={pendingIssues.length} color="amber" />
          <MetricCard icon={GitMerge} label="PRs em Revisão" value={activePRs.length} color="blue" />
          <MetricCard icon={CircleCheckBig} label="PRs Aprovados" value={prs.filter(pr => pr.status === 'Aprovado formalmente').length} color="green" />
          <MetricCard icon={LayoutDashboard} label="Acesso" value="Admin" color="purple" />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Main Triage Area: PRs */}
        <section className="glass-panel p-5 rounded-[20px] flex flex-col h-full border border-[rgba(192,132,252,0.15)] shadow-[0_0_30px_rgba(192,132,252,0.03)]">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--color-git-border)]">
            <h2 className="font-display text-lg font-bold text-white">Esteira de PRs</h2>
            <Badge className="bg-[rgba(192,132,252,0.1)] text-[#a78bfa] border-[rgba(192,132,252,0.2)]">{activePRs.length} na fila</Badge>
          </div>
          
          {activePRs.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 py-10 opacity-60">
              <CircleCheckBig className="h-10 w-10 text-[var(--color-git-muted)] mb-3" />
              <p className="text-sm font-semibold text-white">Nenhum PR pendente</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activePRs.map(pr => (
                <PRTriageCard
                  key={pr.id}
                  pr={pr}
                  isAuthenticated={isAuthenticated}
                  onTriagePR={onTriagePR}
                />
              ))}
            </div>
          )}
        </section>

        {/* Secondary Triage Area: Issues */}
        <section className="glass-panel p-5 rounded-[20px] h-fit">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-bold text-white">Caixa de Entrada (Issues)</h2>
            <Badge className="chip-amber">{pendingIssues.length} alertas</Badge>
          </div>
          
          {pendingIssues.length === 0 ? (
            <p className="text-sm text-[var(--color-git-muted)] text-center py-6">Nenhuma issue aguardando triagem.</p>
          ) : (
            <div className="space-y-3">
              {pendingIssues.map(issue => (
                <div key={issue.id} className="rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.02)] p-4 transition-colors hover:border-[var(--color-git-border-glow)]">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono text-[10px] font-bold text-[var(--color-git-muted2)]">{issue.id}</span>
                    <Badge className={statusClass(issue.status)}>{issue.status}</Badge>
                  </div>
                  <h3 className="text-sm font-bold text-white leading-snug">{issue.title}</h3>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button onClick={() => onTriageIssue(issue.id, 'Em análise técnica')} className={triageButtonClass}>Analisar</button>
                    <button onClick={() => onTriageIssue(issue.id, 'Resolvida')} className={approveButtonClass}>Resolver</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Governança territorial: validação de vínculos do bairro */}
      {territories.length > 0 && <BondValidationPanel territories={territories} />}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: string | number, color: string }) {
  const styles = {
    blue: 'border-[rgba(56,189,248,0.2)] text-[#38bdf8] bg-[rgba(56,189,248,0.05)]',
    green: 'border-[rgba(52,211,153,0.2)] text-[#34d399] bg-[rgba(52,211,153,0.05)]',
    amber: 'border-[rgba(251,191,36,0.2)] text-[#fbbf24] bg-[rgba(251,191,36,0.05)]',
    purple: 'border-[rgba(192,132,252,0.2)] text-[#c084fc] bg-[rgba(192,132,252,0.05)]'
  }[color];

  return (
    <div className={`rounded-2xl border p-4 ${styles}`}>
      <div className="flex items-center justify-between mb-3">
        <Icon className="h-5 w-5 opacity-80" />
      </div>
      <p className="text-2xl font-bold font-mono tracking-tight">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</p>
    </div>
  );
}

/**
 * Card de tramitação de um PR. Com sessão ativa, consulta a máquina de estados
 * do backend (GET /prs/{id}/transitions) e exibe apenas as transições que o
 * papel do ator pode disparar. Sem sessão ou com a API fora, recua para o
 * conjunto estático de ações (modo demonstração).
 */
function PRTriageCard({
  pr,
  isAuthenticated,
  onTriagePR
}: {
  pr: CivicPR;
  isAuthenticated: boolean;
  onTriagePR: (prId: string, status: PRStatus) => void;
}) {
  const [transitions, setTransitions] = useState<PRTransitionInfo[] | null>(null);
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setTransitions(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    getPRTransitions(pr.id)
      .then(response => {
        if (isMounted) setTransitions(response.transitions);
      })
      .catch(error => {
        console.warn(`Não foi possível carregar transições do PR ${pr.id}; usando ações padrão.`, error);
        if (isMounted) setTransitions(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [pr.id, pr.status, isAuthenticated]);

  const canMerge = pr.status === 'Aprovado formalmente';

  return (
    <div className="rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.02)] p-4">
      <Badge className={statusClass(pr.status)}>{pr.status}</Badge>
      <h3 className="mt-2 text-sm font-bold text-white">{pr.id} — {pr.title}</h3>

      <div className="mt-3 flex flex-wrap gap-2">
        {isLoading && (
          <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-git-muted)]">
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            Consultando fluxo institucional…
          </span>
        )}

        {!isLoading && transitions !== null && (
          <>
            {transitions.length === 0 && !canMerge && (
              <span className="text-xs text-[var(--color-git-muted)]">
                Seu papel não possui transições disponíveis a partir deste estado.
              </span>
            )}
            {transitions.map(transition => (
              <button
                key={transition.key}
                onClick={() => onTriagePR(pr.id, transition.toStatus as PRStatus)}
                title={transition.description}
                className={transition.toStatus === 'Aprovado formalmente' ? approveButtonClass : triageButtonClass}
              >
                {transition.toStatus}
              </button>
            ))}
          </>
        )}

        {!isLoading && transitions === null && (
          <>
            <button onClick={() => onTriagePR(pr.id, 'Em revisão técnica')} className={triageButtonClass}>Revisão técnica</button>
            <button onClick={() => onTriagePR(pr.id, 'Pronto para votação')} className={triageButtonClass}>Pronto para voto</button>
            <button onClick={() => onTriagePR(pr.id, 'Aprovado formalmente')} className={approveButtonClass}>Aprovar formalmente</button>
          </>
        )}

        {!isLoading && canMerge && (
          <button
            onClick={() => onTriagePR(pr.id, 'Incorporado ao texto oficial')}
            title="Executa o merge institucional: aplica os diffs ao texto oficial e gera a release legislativa."
            className={mergeButtonClass}
          >
            <GitMerge className="h-3.5 w-3.5" />
            Merge institucional
          </button>
        )}
      </div>
    </div>
  );
}
