# Contribuindo com o Código Público

Bem-vindo(a). Este guia leva você de "acabei de clonar" a "rodei os testes e
entendi a arquitetura". Leia também os documentos em [`docs/`](docs/) — em
especial [CONCEITO](docs/CONCEITO.md), [ARQUITETURA](docs/ARQUITETURA.md) e
[FUNDAMENTACAO-TEORICA](docs/FUNDAMENTACAO-TEORICA.md).

> Antes de tudo: este projeto trata regras de governança como **constituição
> executável**. Mudança em regra institucional (vínculo, maintainer, votação)
> exige teste. Veja a seção [Constituição como código](#constituição-como-código).

---

## 1. Pré-requisitos

| Ferramenta | Versão | Para quê |
| --- | --- | --- |
| **Go** | 1.25+ | back-end (`backend/`) |
| **Node** | 22+ | front-end (`frontend/`) |
| **Docker** + Compose | recente | PostgreSQL e Redis locais |
| **Git** | qualquer | — |

Não é preciso instalar PostgreSQL nem Redis na máquina — o Docker Compose cuida
disso.

---

## 2. Subindo o ambiente local

```bash
# 1. Banco e cache (na raiz do repositório)
docker compose up -d
#    Sobe postgres:16 (com as migrations aplicadas automaticamente) e redis.

# 2. Back-end (em backend/)
cd backend
cp .env.example .env        # valores default já funcionam com o compose
go mod tidy
go run ./cmd/api            # API em http://localhost:8080

# 3. Front-end (em frontend/, outro terminal)
cd frontend
npm install
npm run dev                 # SPA em http://localhost:3000
```

Confira a saúde:

```bash
curl http://localhost:8080/api/v1/health
```

Deve retornar `status: ok` com `postgres` e `redis` ok. O front em
`localhost:3000` fala com a API em `localhost:8080` (default de desenvolvimento;
em produção a URL é relativa via `frontend/.env.production`).

> As migrations são montadas em `docker-entrypoint-initdb.d` e rodam **na
> primeira** inicialização do volume do Postgres. Para reaplicar do zero:
> `docker compose down -v && docker compose up -d` (apaga os dados locais).

---

## 3. Rodando os testes

```bash
# Back-end: build + vet + testes
cd backend
go build ./...
go vet ./...
go test ./...

# Front-end: checagem de tipos + build
cd frontend
npm run lint     # tsc --noEmit
npm run build
```

Os testes mais importantes são os **constitucionais** (regras puras de
governança), que rodam **sem banco**:

```bash
go test ./internal/territorial/   # vínculo + protocolo de maintainers
go test ./internal/public/        # resolução de votação, máquina de estados de PR
go test ./internal/audit/         # encadeamento de hash
```

---

## 4. Estrutura do monorepo

```
frontend/                 SPA React + TypeScript + Vite (mobile-first)
  src/
    pages/                telas (cada rota é um componente)
    shared/               UI compartilhada, layout, feedback (toasts)
    hooks/                estado por domínio (useIssues, usePRs, ...)
    auth/                 contexto de sessão (JWT, login/cadastro)
    lib/api.ts            cliente HTTP de alto nível
    api/client.ts         fetch + injeção de token + ApiError
    contracts/civic.ts    vocabulários controlados (espelho do back-end)
  .env.production         VITE_API_URL=/api/v1 (build de produção)

backend/
  cmd/api/                bootstrap HTTP
  internal/
    auth/                 identidade do cidadão (JWT, bcrypt, CPF via HMAC)
    public/               domínio cívico (issues, PRs, votações, releases)
    territorial/          governança territorial (vínculos, maintainers, recall)
    audit/                trilha de auditoria com hash encadeado
    blockchain/           interface de ancoragem (Anchorer)
    web/                  helpers HTTP compartilhados
    config/ database/ redis/ middleware/ health/
  migrations/             SQL numerado (001..NNN)

infra/                    Docker, nginx, OpenTofu (infra como código)
docs/                     documentação conceitual, protocolos, operação
docker-compose.yml        ambiente local
```

---

## 5. Arquitetura e padrões

O back-end é um **monólito modular** (um binário, módulos por domínio em
`internal/`). Cada módulo segue:

- **Repository** — isola o acesso ao PostgreSQL (SQL fica aqui).
- **Service** — orquestra e autoriza; delega as **regras** à camada de política.
- **Policy (pura)** — funções sem banco que encodam a regra institucional
  (máquina de estados, tetos, quóruns). **É a parte testável.**
- **Handler** — adapta HTTP ↔ service.

Autorização combina **RBAC** (papel: `sysadmin`, papéis institucionais, cidadão)
e **ABAC** (atributo: é maintainer *deste* território, é dono do vínculo, tem
vínculo aprovado no mesmo território).

Vocabulários controlados são **espelhados em três camadas** e evoluem juntos:

```
frontend/src/contracts/civic.ts
backend/internal/public/contracts.go
backend/migrations/006_contract_constraints.sql
```

---

## 6. Como adicionar uma migration

```bash
# Crie o próximo número em sequência
backend/migrations/012_minha_mudanca.sql
```

- Use SQL idempotente quando possível (`ADD COLUMN IF NOT EXISTS`,
  `CREATE INDEX IF NOT EXISTS`).
- `gen_random_uuid()` requer `pgcrypto` (já habilitado).
- Localmente, recrie o volume (`docker compose down -v && up -d`) para reaplicar.
- Em produção, a aplicação é manual e **não se re-roda** uma migration aplicada —
  ver [docs/OPERACAO.md §7](docs/OPERACAO.md).

---

## 7. Como adicionar um endpoint (o fluxo padrão)

Exemplo seguindo o módulo `territorial`:

1. **Migration** (se houver schema novo).
2. **Modelos/constantes** (`*_models.go`) — tipos de request/response e
   vocabulário.
3. **Policy pura** (`*_policy.go`) — a regra, como função testável.
4. **Teste da policy** (`*_policy_test.go`) — cenários da regra.
5. **Repository** — o SQL + auditoria (`audit.Insert`).
6. **Service** — resolve fatos, chama a policy, persiste.
7. **Handler** — lê o corpo, chama o service, escreve JSON.
8. **Rota** em `cmd/api/main.go` (no grupo autenticado, se exigir login).

Regras de negócio recusadas devem retornar `web.Error` com o status certo
(403 sem permissão, 409 transição inválida, 400 payload inválido) — o front
distingue isso de erro de rede e **não** aplica fallback local.

---

## 8. Constituição como código

As regras institucionais não são CRUD: são a **constituição operacional** do
sistema. Por isso:

- **Mudou uma regra de governança?** Escreva/atualize o teste da policy.
  Exemplos do que é "regra": quem pode nomear um maintainer, o quórum de recall,
  o período de descanso de contestação, as transições da máquina de estados de PR.
- **Defaults políticos** (mandato de 90/365 dias, recall 50%+1, descanso de 180
  dias) ficam em **constantes nomeadas e documentadas como provisórias** — nunca
  enterrados no meio de uma função. São decisões políticas, tratadas como tais
  (ver `docs/sugestao_de_governanca.md`).
- O custo de um bug aqui não é um bug — é uma **injustiça institucional** (alguém
  excluído do próprio bairro por erro de código). Teste antes de promulgar.

---

## 9. Convenções de código

**Go**
- Erros de domínio via `web.NewError(status, msg)`; o handler traduz para HTTP.
- Toda escrita relevante gera evento de auditoria encadeado (`audit.Insert`).
- Transições com `FOR UPDATE` para serializar escrita concorrente.
- Status de domínio em **português** (`"Aprovado"`, `"Em votação"`) — é o
  vocabulário do contrato; mantenha a consistência.

**TypeScript / React**
- Componentes de página em `pages/`; UI reaproveitável em `shared/`.
- Use as classes do design system (`btn-primary`, `btn-secondary`, `field`,
  `chip-*`, `glass-panel`) em vez de estilos ad-hoc — ver `src/index.css`.
- Toda chamada autenticada passa pelo `api/client.ts` (injeta o token sozinho).
- Esconda o jargão do cidadão: a UI traduz status técnico para linguagem comum.

**Geral**
- Não versione segredos. `.env`, `*.key`, `deploy/` e `chave_oracle/` estão no
  `.gitignore`.

---

## 10. Fluxo de contribuição

1. **Branch** a partir da `main` (`git switch -c feat/minha-mudanca`).
2. Commits pequenos e descritivos.
3. Rode **tudo** antes de abrir PR: `go build/vet/test` e `npm run lint && build`.
4. Abra o PR descrevendo o **porquê**, não só o quê. Se mexeu em regra de
   governança, aponte o teste que a cobre.
5. O **CI** (GitHub Actions) roda build + vet + test no Go e tsc + build no
   front a cada push/PR (`.github/workflows/ci.yml`).

---

## 11. Precisa de contexto?

| Pergunta | Documento |
| --- | --- |
| O que é o projeto e o ciclo cívico | [docs/CONCEITO.md](docs/CONCEITO.md) |
| Stack, módulos e padrões | [docs/ARQUITETURA.md](docs/ARQUITETURA.md) |
| Governança, maintainers, instâncias | [docs/GOVERNANCA-TERRITORIAL.md](docs/GOVERNANCA-TERRITORIAL.md), [docs/PROTOCOLO-DE-MAINTAINERS-TERRITORIAIS.md](docs/PROTOCOLO-DE-MAINTAINERS-TERRITORIAIS.md) |
| Vínculo, níveis T0–T4, contestação | [docs/PROTOCOLO-DE-VINCULO-TERRITORIAL.md](docs/PROTOCOLO-DE-VINCULO-TERRITORIAL.md) |
| Auditoria e blockchain | [docs/BLOCKCHAIN-E-AUDITORIA.md](docs/BLOCKCHAIN-E-AUDITORIA.md) |
| Fundamentos teóricos e desafios | [docs/FUNDAMENTACAO-TEORICA.md](docs/FUNDAMENTACAO-TEORICA.md) |
| Operação em produção | [docs/OPERACAO.md](docs/OPERACAO.md) |
| Referência da API | [backend/README.md](backend/README.md) |
| Roadmap | [proximos-passos.md](proximos-passos.md) |

Obrigado por contribuir com uma infraestrutura cívica aberta. 🏛️
