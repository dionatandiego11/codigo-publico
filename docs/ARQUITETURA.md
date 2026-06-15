# Arquitetura

Arquitetura-alvo do Código Público após a virada para Orçamento Participativo.

## Eixo de domínio

O domínio principal passa a ser:

```txt
Ciclo OP
→ território
→ demanda
→ proposta/fork
→ filtro
→ votação territorial
→ matriz OP
→ institucionalização
→ release do ciclo
→ execução
→ aprendizado
```

`issues`, `prs` e `law_articles` permanecem como legado útil e referência de versionamento, mas não devem comandar o crescimento do sistema.

## Stack

```txt
Front-end:       React + TypeScript + Vite
Back-end:        Go + Chi
Banco oficial:   PostgreSQL
Cache/locks:     Redis
Infra local:     Docker Compose
Auditoria:       audit_events + hash chain
Blockchain:      ancoragem de hashes, nunca dados pessoais
```

## Monólito modular

Um binário Go, módulos por domínio.

```txt
backend/
  cmd/api/
  internal/
    auth/
    config/
    database/
    redis/
    middleware/
    health/
    audit/
    blockchain/
    web/
    territorial/
    op/
      cycles/
      demands/
      proposals/
      filters/
      votings/
      matrix/
      institutionalization/
      execution/
      learning/
    public/        legado: lei, issues, PRs, releases antigas, stats
  migrations/
```

## Front-end por features

```txt
src/
  app/
  shared/
    api/
    ui/
    layout/
  contracts/
  auth/
  features/
    op/
      cycles/
      demands/
      proposals/
      matrix/
      execution/
    territorial/
    maintainers/
    votings/
    audit/
    legacy/
```

## Padrões

| Padrão | Uso |
|---|---|
| Modular monolith | simples de operar e evoluir |
| Repository pattern | SQL isolado por domínio |
| Service layer | orquestra fluxo e autorização |
| Policy pura | regra institucional testável |
| State machine | estados da esteira do OP |
| Audit trail | todo movimento relevante gera evento |
| Domain events | ações nomeadas como `op.demand.created` |
| ABAC | vínculo territorial, papel e território do ator |

## Kernel comum vs domínio

Kernel técnico:

- HTTP helpers;
- config;
- banco;
- Redis;
- auditoria;
- contratos;
- erros;
- autenticação de request.

Domínio:

- ciclo;
- mandato;
- filtros;
- sorteio;
- votação;
- matriz;
- execução;
- aprendizado.

Regra:

> Se o código sabe o que é território, demanda, quórum, sorteio ou carência, ele não é kernel; é domínio.

## Contratos

Os vocabulários devem ser compartilhados entre:

```txt
src/contracts/
backend/internal/*/contracts.go
backend/migrations/*_constraints.sql
```

Vocabulários prioritários do OP:

- status do ciclo;
- status da demanda;
- status da proposta;
- tipos de filtro;
- resultados do circuit breaker;
- status da votação;
- status da matriz;
- status de institucionalização;
- status de execução.

## Auditoria

Eventos relevantes:

```txt
op.cycle.opened
territorial.bond.requested
maintainer.application.submitted
maintainer.draw.completed
op.demand.created
op.demand.supported
op.demand.grouped
op.proposal.forked
op.filter.applied
op.vote.cast
op.matrix.published
op.institutionalized
op.release.created
op.execution.updated
op.learning.recorded
```

## Migração

O caminho não é reescrever tudo.

1. Criar domínio `op` novo.
2. Manter `public` como legado.
3. Reaproveitar autenticação, auditoria, territórios e votação quando couber.
4. Criar contratos novos do OP.
5. Migrar a home e a navegação para ciclo/território/demanda.
6. Deixar Lei/PR/release antigos como camada secundária ou compatibilidade.
