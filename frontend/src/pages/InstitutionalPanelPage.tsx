import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  CalendarClock,
  CircleCheckBig,
  GitMerge,
  Landmark,
  LayoutDashboard,
  LoaderCircle,
  LockKeyhole,
  MapPinned,
  ServerCog,
  ShieldAlert,
  Users
} from 'lucide-react';
import { getPRTransitions, type AdminContext, type PRTransitionInfo, type PublicStats } from '../lib/api';
import { useAdminContext, useOPCycle } from '../hooks';
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
  const { adminContext, status } = useAdminContext(isAuthenticated);
  const { currentCycle, status: cycleStatus } = useOPCycle();
  const pendingIssues = issues.filter(issue => !['Resolvida', 'Arquivada'].includes(issue.status));
  const activePRs = prs.filter(pr => !['Incorporado ao texto oficial', 'Rejeitado', 'Arquivado'].includes(pr.status));

  const managedTerritories = useMemo(() => {
    if (!adminContext) return [];
    if (adminContext.canManageAllTerritories) return territories;

    return territories.filter(territory =>
      adminContext.maintainers.some(maintainer =>
        maintainer.scope === 'territorial' &&
        (
          maintainer.territorySlug === territory.id ||
          maintainer.territoryId === territory.id ||
          maintainer.territoryName === territory.name
        )
      )
    );
  }, [adminContext, territories]);

  if (status === 'loading' || status === 'idle') {
    return (
      <AdminShell>
        <div className="glass-panel rounded-[20px] p-6 text-sm text-[var(--color-git-muted)] flex items-center gap-3">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Carregando contexto administrativo…
        </div>
      </AdminShell>
    );
  }

  if (status === 'denied' || status === 'error' || !adminContext) {
    return (
      <AdminShell>
        <AccessDenied status={status} />
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="flex flex-col gap-2">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-git-purple)] font-bold icon-glow-purple">
          Administração do OP
        </p>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-[var(--color-git-purple)]" />
          Console Administrativo
        </h1>
        <p className="text-sm leading-relaxed text-[var(--color-git-muted)]">
          Três níveis de operação: infraestrutura técnica, rito legislativo geral e validação territorial.
        </p>
      </div>

      <div className="glass-panel rounded-[20px] p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="chip-purple">{adminContext.roleLabel}</Badge>
          {adminContext.levels.map(level => (
            <Badge key={level} className="chip-blue">{levelLabel(level)}</Badge>
          ))}
        </div>
        <p className="mt-3 text-sm text-[var(--color-git-text2)]">
          {adminContext.fullName} · {adminContext.registeredTerritoryName ?? 'território não informado'}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <LevelCard
          icon={ServerCog}
          title="Maintainer técnico"
          subtitle="sys-admin"
          active={adminContext.canTechnical}
          description="Mantém infraestrutura, segurança, integrações, auditoria e parâmetros técnicos do sistema."
        />
        <LevelCard
          icon={Landmark}
          title="Maintainer geral"
          subtitle="legislativo"
          active={adminContext.canGeneral}
          description="Abre ciclos, conduz rito formal, conecta matriz do OP ao PPA, LDO e LOA."
        />
        <LevelCard
          icon={MapPinned}
          title="Maintainer territorial"
          subtitle="representante de bairro"
          active={adminContext.canTerritorial}
          description="Organiza demandas do território, valida vínculos e conduz maturação comunitária."
        />
      </div>

      {adminContext.canTechnical && (
        <TechnicalAdminPanel
          stats={stats}
          territories={territories}
          pendingIssues={pendingIssues.length}
          activePRs={activePRs.length}
        />
      )}

      {adminContext.canGeneral && (
        <GeneralAdminPanel
          activePRs={activePRs}
          pendingIssues={pendingIssues}
          currentCycleLabel={currentCycle?.label}
          currentCyclePhase={currentCycle?.phase}
          cycleStatus={cycleStatus}
          isAuthenticated={isAuthenticated}
          onTriageIssue={onTriageIssue}
          onTriagePR={onTriagePR}
        />
      )}

      {adminContext.canTerritorial && (
        <TerritorialAdminPanel
          adminContext={adminContext}
          territories={managedTerritories}
        />
      )}
    </AdminShell>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  return <div className="space-y-6 fade-in">{children}</div>;
}

function AccessDenied({ status }: { status: string }) {
  return (
    <div className="glass-panel rounded-[20px] border border-[rgba(248,113,113,0.15)] p-8 text-center">
      <LockKeyhole className="mx-auto h-10 w-10 text-[var(--color-git-red)]" />
      <h2 className="mt-4 font-display text-xl font-bold text-white">Sem nível administrativo ativo</h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-git-muted)]">
        {status === 'error'
          ? 'Não foi possível consultar o contexto administrativo na API.'
          : 'Esta conta ainda não é maintainer técnico, geral ou territorial.'}
      </p>
    </div>
  );
}

function LevelCard({
  icon: Icon,
  title,
  subtitle,
  active,
  description
}: {
  icon: typeof ServerCog;
  title: string;
  subtitle: string;
  active: boolean;
  description: string;
}) {
  return (
    <div className={`rounded-[20px] border p-4 ${active ? 'border-[rgba(56,189,248,0.28)] bg-[rgba(56,189,248,0.06)]' : 'border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.02)] opacity-65'}`}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--color-git-border2)] bg-white/[0.04] text-[var(--color-git-blue)]">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--color-git-muted)]">{subtitle}</p>
          <h3 className="font-display text-base font-bold text-white">{title}</h3>
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-[var(--color-git-text2)]">{description}</p>
      <Badge className={`mt-4 ${active ? 'chip-green' : 'chip-gray'}`}>{active ? 'ativo' : 'inativo'}</Badge>
    </div>
  );
}

function TechnicalAdminPanel({
  stats,
  territories,
  pendingIssues,
  activePRs
}: {
  stats?: PublicStats;
  territories: Territory[];
  pendingIssues: number;
  activePRs: number;
}) {
  return (
    <section className="glass-panel rounded-[20px] p-5 border border-[rgba(56,189,248,0.12)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
            <ServerCog className="h-5 w-5 text-[var(--color-git-blue)]" />
            Operação técnica
          </h2>
          <p className="mt-1 text-xs text-[var(--color-git-muted)]">Infraestrutura, segurança, auditoria e integridade do protocolo.</p>
        </div>
        <Badge className="chip-blue">sys-admin</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard icon={Users} label="cidadãos" value={stats?.totalCitizens ?? 0} color="blue" />
        <MetricCard icon={MapPinned} label="territórios" value={territories.length} color="green" />
        <MetricCard icon={Activity} label="issues abertas" value={pendingIssues} color="amber" />
        <MetricCard icon={GitMerge} label="prs ativos" value={activePRs} color="purple" />
      </div>
    </section>
  );
}

function GeneralAdminPanel({
  activePRs,
  pendingIssues,
  currentCycleLabel,
  currentCyclePhase,
  cycleStatus,
  isAuthenticated,
  onTriageIssue,
  onTriagePR
}: {
  activePRs: CivicPR[];
  pendingIssues: Issue[];
  currentCycleLabel?: string;
  currentCyclePhase?: string;
  cycleStatus: string;
  isAuthenticated: boolean;
  onTriageIssue: (issueId: string, status: IssueStatus) => void;
  onTriagePR: (prId: string, status: PRStatus) => void;
}) {
  return (
    <section className="space-y-4">
      <div className="glass-panel rounded-[20px] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <Landmark className="h-5 w-5 text-[var(--color-git-purple)]" />
              Rito geral do orçamento
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-[var(--color-git-muted)]">
              O Legislativo conduz o ciclo, consolida a matriz e faz a ponte com PPA, LDO e LOA.
            </p>
          </div>
          <Badge className="chip-purple">legislativo</Badge>
        </div>

        <div className="mt-4 rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.02)] p-4">
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--color-git-muted)]">Ciclo atual</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <CalendarClock className="h-4 w-4 text-[var(--color-git-blue)]" />
            <span className="text-sm font-bold text-white">{currentCycleLabel ?? 'nenhum ciclo ativo'}</span>
            <Badge className={currentCyclePhase ? statusClass(currentCyclePhase) : 'chip-gray'}>
              {currentCyclePhase ?? cycleStatus}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section className="glass-panel p-5 rounded-[20px] flex flex-col border border-[rgba(192,132,252,0.15)]">
          <div className="mb-4 flex items-center justify-between border-b border-[var(--color-git-border)] pb-4">
            <h3 className="font-display text-lg font-bold text-white">Esteira de PRs</h3>
            <Badge className="chip-purple">{activePRs.length} na fila</Badge>
          </div>

          {activePRs.length === 0 ? (
            <EmptyState label="Nenhum PR pendente" />
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

        <section className="glass-panel p-5 rounded-[20px] h-fit">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-white">Entrada institucional</h3>
            <Badge className="chip-amber">{pendingIssues.length} alertas</Badge>
          </div>

          {pendingIssues.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--color-git-muted)]">Nenhuma issue aguardando triagem.</p>
          ) : (
            <div className="space-y-3">
              {pendingIssues.map(issue => (
                <div key={issue.id} className="rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.02)] p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold text-[var(--color-git-muted2)]">{issue.id}</span>
                    <Badge className={statusClass(issue.status)}>{issue.status}</Badge>
                  </div>
                  <h4 className="text-sm font-bold leading-snug text-white">{issue.title}</h4>
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
    </section>
  );
}

function TerritorialAdminPanel({
  adminContext,
  territories
}: {
  adminContext: AdminContext;
  territories: Territory[];
}) {
  const represented = adminContext.canManageAllTerritories
    ? 'todos os territórios'
    : territories.map(territory => territory.name).join(', ');

  return (
    <section className="space-y-4">
      <div className="glass-panel rounded-[20px] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <MapPinned className="h-5 w-5 text-[var(--color-git-green)]" />
              Governança territorial
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-[var(--color-git-muted)]">
              Validação de vínculos, organização de demandas e maturação territorial antes da priorização.
            </p>
          </div>
          <Badge className="chip-green">territorial</Badge>
        </div>

        <p className="mt-4 text-sm text-[var(--color-git-text2)]">
          Escopo operacional: <span className="font-semibold text-white">{represented || 'nenhum território ativo'}</span>
        </p>
      </div>

      {territories.length > 0 ? (
        <BondValidationPanel territories={territories} />
      ) : (
        <div className="glass-panel rounded-[20px] p-6 text-center text-sm text-[var(--color-git-muted)]">
          Esta conta ainda não representa nenhum bairro ativo.
        </div>
      )}
    </section>
  );
}

function MetricCard({ icon: Icon, label, value, color }: { icon: typeof Activity, label: string, value: string | number, color: string }) {
  const styles = {
    blue: 'border-[rgba(56,189,248,0.2)] text-[#38bdf8] bg-[rgba(56,189,248,0.05)]',
    green: 'border-[rgba(52,211,153,0.2)] text-[#34d399] bg-[rgba(52,211,153,0.05)]',
    amber: 'border-[rgba(251,191,36,0.2)] text-[#fbbf24] bg-[rgba(251,191,36,0.05)]',
    purple: 'border-[rgba(192,132,252,0.2)] text-[#c084fc] bg-[rgba(192,132,252,0.05)]'
  }[color];

  return (
    <div className={`rounded-2xl border p-4 ${styles}`}>
      <div className="mb-3 flex items-center justify-between">
        <Icon className="h-5 w-5 opacity-80" />
      </div>
      <p className="font-mono text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</p>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 opacity-60">
      <CircleCheckBig className="mb-3 h-10 w-10 text-[var(--color-git-muted)]" />
      <p className="text-sm font-semibold text-white">{label}</p>
    </div>
  );
}

function levelLabel(level: string) {
  switch (level) {
    case 'technical':
      return 'técnico';
    case 'general':
      return 'geral';
    case 'territorial':
      return 'territorial';
    default:
      return level;
  }
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
