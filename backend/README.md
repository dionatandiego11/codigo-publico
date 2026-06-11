# Backend do Código Público

Backend da plataforma Código Público.

A etapa atual entrega a base HTTP com Go, Chi, PostgreSQL, Redis, CORS, logs simples, health check, schema PostgreSQL, endpoints públicos de leitura, autenticação básica de cidadão e primeiras ações cívicas autenticadas.

## Stack

- Go
- Chi
- PostgreSQL
- Redis
- Docker Compose
- `.env`

## Estrutura

```text
backend/
  cmd/api/main.go
  internal/config/config.go
  internal/database/postgres.go
  internal/redis/redis.go
  internal/middleware/cors.go
  internal/health/handler.go
  migrations/001_init.sql
  migrations/002_seed.sql
  migrations/003_citizens.sql
  migrations/004_civic_writes.sql
  migrations/005_voting_module.sql
  migrations/006_contract_constraints.sql
  docker-compose.yml
  .env.example
  go.mod
  README.md
```

## Rodando no WSL 2 com Ubuntu

Entre na pasta do backend:

```bash
cd backend
```

Crie o arquivo de ambiente local:

```bash
cp .env.example .env
```

Suba PostgreSQL e Redis:

```bash
docker compose up -d
```

Instale as dependências Go:

```bash
go mod tidy
```

Execute a API:

```bash
go run ./cmd/api
```

## Health Check

Endpoint disponível:

```text
GET /api/v1/health
```

Exemplo:

```bash
curl http://localhost:8080/api/v1/health
```

Resposta saudável:

```json
{
  "status": "ok",
  "timestamp": "2026-06-10T12:00:00Z",
  "checks": {
    "api": {
      "status": "ok"
    },
    "postgres": {
      "status": "ok"
    },
    "redis": {
      "status": "ok"
    }
  }
}
```

Se PostgreSQL ou Redis estiverem indisponíveis, o endpoint retorna `503 Service Unavailable` com `status: "degraded"` e o erro da dependência.

## Endpoints Públicos de Leitura

Todos os endpoints abaixo usam PostgreSQL como fonte de dados e retornam JSON compatível com os tipos já usados pelo front-end.

```text
GET /api/v1/territories
GET /api/v1/territories/{id}

GET /api/v1/organic-law/articles
GET /api/v1/organic-law/articles/{id}

GET /api/v1/issues
GET /api/v1/issues/{id}

GET /api/v1/prs
GET /api/v1/prs/{id}
GET /api/v1/prs/{id}/diff
GET /api/v1/prs/{id}/reviews
GET /api/v1/prs/{id}/checks

GET /api/v1/releases
GET /api/v1/releases/{id}
GET /api/v1/executions
GET /api/v1/public-stats
```

IDs públicos como `#044`, `#045`, `art-12` e `campo-grande` são aceitos nas rotas de detalhe quando aplicável. UUIDs internos também podem ser usados.

## Autenticação de Cidadão

Endpoints disponíveis:

```text
POST /api/v1/citizens/register
POST /api/v1/auth/login
GET /api/v1/me
GET /api/v1/me/dashboard
```

Cadastro:

```bash
curl -X POST http://localhost:8080/api/v1/citizens/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Dionatan Santos",
    "cpf": "123.456.789-09",
    "birthDate": "1990-01-01",
    "phone": "+55 11 99999-0000",
    "email": "dionatan@example.com",
    "territoryId": "campo-grande"
  }'
```

Login MVP:

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "cpf": "12345678909",
    "birthDate": "1990-01-01"
  }'
```

Perfil autenticado:

```bash
curl http://localhost:8080/api/v1/me \
  -H "Authorization: Bearer <token>"
```

Regras implementadas:

- CPF é normalizado removendo caracteres não numéricos.
- CPF nunca é armazenado puro.
- O banco salva apenas `cpf_hash`, calculado com HMAC-SHA256 e `CPF_HASH_SECRET`.
- Login MVP usa CPF + data de nascimento.
- As respostas nunca expõem CPF.
- `/me` usa middleware JWT.

## Escrita Cívica Autenticada

Endpoints disponíveis:

```text
POST /api/v1/issues
POST /api/v1/issues/{id}/comments
POST /api/v1/issues/{id}/upvote

POST /api/v1/prs
POST /api/v1/prs/{id}/comments
POST /api/v1/prs/{id}/upvote
```

Todos exigem:

```text
Authorization: Bearer <token>
```

Criação de issue:

```bash
curl -X POST http://localhost:8080/api/v1/issues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "Falta base para consulta digital",
    "type": "Lacuna normativa",
    "territory": "Todo o Município",
    "theme": "Participação Popular",
    "description": "A Lei Orgânica precisa prever consultas digitais auditáveis.",
    "relatedArticleId": "art-12",
    "relatedRepository": "Lei Orgânica Municipal"
  }'
```

Criação de PR cívico:

```bash
curl -X POST http://localhost:8080/api/v1/prs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "Criar consulta digital anual",
    "repository": "Lei Orgânica Municipal",
    "targetTitle": "Título II — Participação Popular",
    "affectedArticles": "Artigo 12",
    "authorType": "Iniciativa Popular",
    "citizenSummary": "Permite consultas digitais com auditoria pública.",
    "justification": "Amplia participação de cidadãos que não conseguem ir a audiências presenciais.",
    "linkedIssueIds": ["#044"],
    "diffs": [
      {
        "articleNumber": 12,
        "titleRef": "Art. 12 — Participação Popular",
        "beforeText": "Texto vigente.",
        "afterText": "Texto proposto.",
        "rationale": "Aprimorar participação digital.",
        "lines": [
          { "type": "removed", "content": "- Texto vigente." },
          { "type": "added", "content": "+ Texto proposto." }
        ]
      }
    ]
  }'
```

Regras implementadas:

- Criar issue e PR cívico exige cidadão autenticado.
- Comentário e apoio exigem cidadão autenticado.
- O autor real é o cidadão do JWT; `authorName` enviado pelo cliente é ignorado.
- Apoios usam tabelas próprias com unicidade por cidadão e entidade.
- Cada criação, comentário e novo apoio registra `audit_event`.
- Votação formal e merge institucional continuam fora do escopo.

## Votações

Endpoints públicos:

```text
GET /api/v1/votings
GET /api/v1/votings/{id}
GET /api/v1/votings/{id}/results
```

Endpoint autenticado:

```text
POST /api/v1/votings/{id}/vote
```

Votar:

```bash
curl -X POST http://localhost:8080/api/v1/votings/vote-046/vote \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{ "selection": "Aprovo" }'
```

Opções aceitas:

```text
Aprovo
Rejeito
Abstenção
```

Regras implementadas:

- Somente cidadão autenticado pode votar.
- Cada cidadão só pode votar uma vez por votação.
- A tabela `voting_votes` usa `UNIQUE(voting_id, citizen_id)`.
- O resultado público é agregado.
- Nenhum endpoint expõe voto individual.
- O `receiptCode` é aleatório e não codifica a escolha do voto.
- Cada voto aceito registra `audit_event` com ação `vote_cast`, sem incluir a escolha no metadata.

## Merge Institucional e Releases

Endpoint institucional autenticado:

```text
POST /api/v1/prs/{id}/merge
```

Consulta pública de releases:

```text
GET /api/v1/releases
GET /api/v1/releases/{id}
```

Merge institucional:

```bash
curl -X POST http://localhost:8080/api/v1/prs/%23046/merge \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token-institucional>" \
  -d '{
    "promulgatedBy": "Mesa Diretora da Câmara Municipal",
    "formalApprovalReference": "Emenda Orgânica Municipal nº 01/2026",
    "officialDocumentUrl": "Diário Oficial Eletrônico - Edição 2601",
    "releaseDate": "2026-06-10"
  }'
```

Regras implementadas:

- O merge exige cidadão autenticado com papel institucional no campo `role`.
- Papéis aceitos: `admin`, `institutional_admin`, `legislative_admin`, `procurador`, `secretario`, `vereador`, `mesa_diretora`.
- O PR só pode ser incorporado se estiver em `Aprovado formalmente`.
- O merge aplica o `afterText` dos diffs normativos nos artigos afetados.
- O PR muda para `Incorporado ao texto oficial`.
- Uma release legislativa é criada automaticamente, com versão gerada como `vANO.N` se `version` não for enviada.
- São registrados `audit_event` com ações `pr_merged` e `release_created`.
- O merge representa o cumprimento do rito formal; votos e apoios populares não executam incorporação por si só.

## Painel do Cidadão

Endpoint autenticado:

```text
GET /api/v1/me/dashboard
```

Retorna o painel pessoal do cidadão logado: issues e PRs criados, recibos de votação (com a seleção do próprio cidadão), PRs apoiados, território e data de registro. O CPF nunca aparece na resposta.

## Contratos de API

O contrato público entre front-end, API e PostgreSQL usa:

- JSON em `camelCase`;
- data civil em ISO date: `YYYY-MM-DD`;
- timestamp em RFC3339: `2026-06-11T12:00:00Z`;
- IDs públicos de issues e PRs com `#`, por exemplo `#044`;
- IDs públicos de votações com prefixo `vote-`, por exemplo `vote-046`;
- artigos expostos como `art-{numero}`, por exemplo `art-12`;
- territórios expostos por `slug`, por exemplo `campo-grande`;
- UUIDs internos aceitos em rotas de detalhe quando aplicável, mas não usados como identificador principal na UI.

Vocabulários controlados ficam espelhados em:

- front-end: `src/contracts/civic.ts`;
- backend: `backend/internal/public/contracts.go`;
- PostgreSQL: `backend/migrations/006_contract_constraints.sql`.

Status oficiais de issue:

```text
Aberta
Em triagem
Em debate
Vinculada a PR
Em análise técnica
Resolvida
Arquivada
```

Status oficiais de PR cívico:

```text
Rascunho
Aberto para debate
Em revisão pública
Em revisão técnica
Em revisão jurídica
Aguardando ajustes
Pronto para votação
Em votação
Aprovado pela consulta pública
Encaminhado à Câmara
Aprovado formalmente
Incorporado ao texto oficial
Rejeitado
Arquivado
```

Opções oficiais de voto:

```text
Aprovo
Rejeito
Abstenção
```

## Triagem Institucional

Endpoints autenticados que exigem papel institucional (`admin`, `institutional_admin`, `legislative_admin`, `procurador`, `secretario`, `vereador`, `mesa_diretora`):

```text
POST /api/v1/issues/{id}/status
POST /api/v1/prs/{id}/status
```

Corpo:

```json
{ "status": "Em triagem" }
```

Regras implementadas:

- O status é validado contra a lista oficial de status de issues e PRs.
- `Incorporado ao texto oficial` não é aceito pela triagem; a incorporação exige o endpoint de merge institucional.
- Cada mudança registra `audit_event` com `fromStatus` e `toStatus`.

## Escopo Desta Etapa

Implementado:

- bootstrap HTTP;
- rota `GET /api/v1/health`;
- endpoints públicos de leitura;
- cadastro, login MVP e rota `/me`;
- middleware JWT;
- criação de issues e PRs cívicos autenticados;
- comentários e apoios autenticados em issues e PRs;
- módulo de votação com recibo e resultado agregado;
- merge institucional com criação de release legislativa;
- auditoria de ações cívicas relevantes;
- conexão com PostgreSQL;
- conexão com Redis;
- CORS configurável;
- logs simples;
- Docker Compose para PostgreSQL e Redis;
- migrations iniciais com tabelas de domínio e seed conceitual.

Ainda não implementado:

- criação, edição ou remoção de entidades;
- autenticação avançada;
- autorização por permissões;
- repositórios;
- comandos de negócio;
- integração com o front-end.
