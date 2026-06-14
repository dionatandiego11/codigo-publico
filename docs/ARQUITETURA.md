# Arquitetura

## Stack

```txt
Front-end:        React + TypeScript + Vite (frontend/)
Back-end:         Go + chi (backend/)
Banco principal:  PostgreSQL (fonte oficial da verdade)
Cache/Fila:       Redis
Infra local:      Docker Compose (raiz)
Proxy/produção:   Nginx (infra/nginx)
CI/CD:            GitHub Actions (.github/workflows)
Infra como código: OpenTofu (infra/opentofu)
Auditoria:        audit_events com hash encadeado
Blockchain:       ancoragem de provas (nunca dados pessoais)
```

## Estrutura do monorepo

```txt
codigo-publico/
  frontend/            SPA React (pages/, shared/, hooks/, contracts/, auth/)
  backend/
    cmd/api/           bootstrap HTTP
    internal/
      auth/            identidade do cidadão (JWT, bcrypt, CPF via HMAC)
      config/          configuração por env
      database/        pool PostgreSQL
      redis/           cliente Redis
      middleware/      CORS
      health/          health check
      public/          domínio cívico legado (issues, PRs, votações, releases)
      territorial/     governança territorial (vínculos, maintainers, recursos)
      audit/           trilha de auditoria com hash encadeado
      blockchain/      interface de ancoragem externa (Anchorer)
      web/             helpers HTTP compartilhados
    migrations/        SQL numerado (001..010)
  infra/
    docker/            Dockerfile da API
    nginx/             config de produção
    opentofu/          environments/{dev,staging,production} + modules/
  docs/                documentos conceituais
  docker-compose.yml   ambiente local completo
```

## Padrões adotados

| Padrão             | Onde |
| ------------------ | ---- |
| Modular Monolith   | um binário Go, módulos por domínio em `internal/` |
| Repository Pattern | `Repository` isola o acesso ao PostgreSQL em cada módulo |
| Service Layer      | `Service` concentra regras de negócio e autorização |
| RBAC               | papéis: sysadmin, papéis institucionais, cidadão |
| ABAC               | atributos: maintainer do território X, dono do vínculo, vínculo aprovado no mesmo território |
| State Machine      | tramitação de PRs (`pr_statemachine.go`) e ciclo do vínculo territorial |
| Audit Trail        | `audit.Insert` — todo evento relevante, com hash encadeado |
| Domain Events      | ações nomeadas (`bond.approved`, `pr.status_changed`, `vote_cast`) registradas na trilha |

## Decisões de migração

`internal/public` é o módulo legado que concentra o domínio cívico original
(issues, PRs, votações, releases, fiscalização). A divisão por domínio
(`issues/`, `prs/`, `votings/`...) deve acontecer **incrementalmente**: cada
novo domínio já nasce como módulo próprio (como `territorial/`), e os
existentes são extraídos quando forem tocados — nunca em um big bang.

## Contratos

Vocabulários controlados são espelhados em três camadas e devem evoluir
juntos:

```txt
frontend/src/contracts/civic.ts
backend/internal/public/contracts.go
backend/migrations/006_contract_constraints.sql
```
