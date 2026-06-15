# Estrutura do App — alvo e caminho de migração

> Como o Código Público **deveria** ser organizado, por quê, e como sair do que
> temos hoje sem big bang. Complementa [ARQUITETURA.md](ARQUITETURA.md) (que
> descreve stack e padrões); aqui o foco é **organização de pastas, fronteiras
> de módulo e regras de dependência**.
>
> Honestidade: o código atual **diverge** do alvo em dois pontos — o pacote
> `backend/internal/public` (módulo-deus) e o `frontend/src/lib/api.ts`
> (arquivo-deus). Os módulos novos (`territorial`, `audit`) já nascem no formato
> certo. O alvo é convergência **incremental** (padrão *strangler*), não
> reescrita.

---

## 1. Princípios

1. **Monólito modular.** Um binário no back-end, um bundle no front. Módulos com
   fronteiras claras, sem microsserviços. Simples de operar (essencial numa VPS
   de 952 MB), fácil de decompor depois.
2. **Domínio acima de camada técnica.** Organize por *assunto* (issues, PRs,
   votações, território), não por *tipo de arquivo* (todos os controllers juntos).
   Quem mexe em "votação" deveria abrir uma pasta, não sete.
3. **Regra no centro, I/O na borda.** A regra institucional vive em funções
   puras (policy), testáveis sem banco e sem HTTP. SQL fica no repositório; HTTP
   no handler. O meio nunca contém regra.
4. **Dependências apontam para dentro.** Domínios dependem de um *kernel*
   compartilhado; **nunca** uns dos outros diretamente. O grafo é acíclico.
5. **Contrato explícito e espelhado.** Vocabulários (status, papéis, tipos)
   existem em um lugar por camada e evoluem juntos.

---

## 2. Visão de alto nível

```
            ┌───────────────── camada de borda ─────────────────┐
            │  HTTP handlers (back)        Páginas/UI (front)    │
            └───────────────────────────────────────────────────┘
                                 │ chama
            ┌──────────────── camada de aplicação ──────────────┐
            │  Services (orquestram, autorizam)  Hooks (estado)  │
            └───────────────────────────────────────────────────┘
                                 │ delega regra
            ┌──────────────── camada de domínio ────────────────┐
            │  Policy pura (regras, máquinas de estado)          │  ← testável
            └───────────────────────────────────────────────────┘
                                 │ fatos
            ┌──────────────── camada de dados ──────────────────┐
            │  Repositories (SQL)            API client (fetch)  │
            └───────────────────────────────────────────────────┘
```

A regra de ouro: **a camada de domínio não conhece HTTP nem SQL**. É o que
permite testá-la como "constituição".

---

## 3. Back-end — estrutura-alvo

### 3.1 Layout

```
backend/
  cmd/api/                bootstrap: lê config, monta deps, registra rotas, sobe
  internal/
    kernel/               ← compartilhado por todos os domínios (sem regra de negócio)
      web/                helpers HTTP (Error, WriteJSON), decode genérico
      audit/              trilha com hash encadeado (audit.Insert)
      contracts/          vocabulários controlados (status, papéis, tipos)
      platform/           config, database (pool pgx), redis, middleware, health
    auth/                 identidade do cidadão (JWT, bcrypt, CPF-HMAC)
    issues/              ┐
    prs/                 │ domínios cívicos — cada um:
    votings/             │   handler.go  service.go  repository.go
    releases/            │   policy.go   policy_test.go   models.go
    executions/          │
    lawtext/             │ (lei orgânica / artigos)
    territories/         │ (leitura de territórios + stats)
    territorial/         ┘ (governança: vínculos, maintainers, recall) — JÁ no formato
    blockchain/           interface de ancoragem (Anchorer)
  migrations/
```

Cada domínio tem **a mesma forma**: `handler` (HTTP) → `service` (orquestra +
autoriza) → `policy` (regra pura + teste) → `repository` (SQL) + `models`
(tipos do contrato daquele domínio).

### 3.2 Regras de dependência

```
domínio ──► kernel          ✅ (web, audit, contracts, platform)
domínio ──► auth            ✅ (todos precisam do ator autenticado)
domínio ──► outro domínio   ❌ direto — use uma das saídas abaixo
kernel  ──► domínio         ❌ nunca (o kernel não conhece ninguém)
```

**Quando um domínio precisa de outro** (ex.: ao encerrar uma votação, avançar o
PR vinculado):
- **Curto prazo:** uma *porta* — uma interface pequena que o domínio chamador
  declara e o outro implementa (inversão de dependência), montada no
  `cmd/api`. Nada de importar o `repository` do vizinho.
- **Médio prazo:** **eventos de domínio** — o domínio publica `voting.closed`; um
  assinante no domínio de PRs reage. A trilha de auditoria já é, conceitualmente,
  metade de um event log; dá para evoluir para um barramento interno simples.

### 3.3 O que é "kernel" e o que **não** é

Kernel é infraestrutura sem opinião de negócio: serializar JSON, abrir
transação, validar token, gravar auditoria, declarar o vocabulário. Se um pacote
do kernel precisasse saber o que é "quórum" ou "vínculo T3", ele **não** é kernel
— é domínio.

### 3.4 Caminho de migração do `public` (strangler)

O pacote `internal/public` hoje concentra issues, PRs, votações, releases,
execuções, lei, territórios-leitura, dashboard, stats e triagem — todos pendurados
em **um** `Repository` e **um** `Service` (mais `queries.go`, `scanners.go`,
`utils.go` compartilhados). Decompor exige cuidado:

1. **Não reescreva.** Extraia um domínio **quando for tocá-lo** de qualquer modo.
2. **Comece pelos mais isolados:** `releases` e `executions` (quase só leitura)
   são os primeiros candidatos — pouco acoplamento.
3. **Mova helpers compartilhados para o kernel** conforme saem (`scanners`,
   formatadores de data, `nullable*`).
4. **`votings` e `prs` por último** — são os mais acoplados (a máquina de estados
   de PR, o `voting_closer`). Quando extrair, formalize a porta votação→PR.
5. Cada extração entra **com seu `policy_test.go`** — extrair sem teste é perder
   a oportunidade. O `territorial` é o gabarito a seguir.

> Meta realista: não "zerar o `public`", e sim **parar de crescê-lo** e
> esvaziá-lo aos poucos. Todo domínio novo nasce fora dele (como o `territorial`).

---

## 4. Front-end — estrutura-alvo

### 4.1 Layout (orientado a feature)

```
frontend/src/
  app/                    composição da aplicação
    App.tsx               só roteamento + orquestração (sem telas)
    providers.tsx         Auth, Toast, Router
    router.ts             history API, deep links
  shared/                 transversal, sem domínio
    ui/                   design system (Badge, btn, field, glass) + ui.tsx
    layout/               Navbar, BottomNav
    feedback/             ToastContext
    api/                  client.ts (fetch + token + ApiError)
  contracts/              civic.ts (espelho do back-end)
  auth/                   contexto de sessão + modal de login
  features/               ← cada domínio reúne TUDO seu
    issues/   { pages, components, useIssues, api.ts }
    prs/      { ... }
    votings/
    territorial/   (vínculo do cidadão + painel do maintainer)
    law/           (lei orgânica, artigos, diff)
    citizen/       (minha área, dashboard)
    admin/         (console institucional)
  types.ts                tipos de domínio compartilhados
  index.css               tokens + classes do design system
```

A ideia central: **co-localização**. Tudo de "votações" — a página, os
componentes, o hook de estado, as chamadas de API — vive em `features/votings/`.
Abrir o domínio é abrir uma pasta.

### 4.2 A divergência atual e a migração

Hoje o front usa **split por camada técnica**: `pages/` (todas as telas),
`hooks/` (todos os estados), `lib/api.ts` (todas as chamadas). Funciona, mas o
`lib/api.ts` virou um arquivo-deus e mexer numa feature exige saltar entre três
pastas.

Migração incremental:
1. **Fatie o `lib/api.ts`** primeiro — mova cada bloco de funções para
   `features/<domínio>/api.ts`. É o passo de maior alívio e o de menor risco
   (só mover funções + ajustar imports). O `client.ts` (fetch/token) fica em
   `shared/api`.
2. **Mova página + hook + componentes** de um domínio para `features/<domínio>/`
   quando for mexer nele.
3. `App.tsx` permanece como está (já é só roteador) — passa a importar de
   `features/*` em vez de `pages/*`.

> O design system (`btn-*`, `field`, `glass-panel`, `chip-*` em `index.css`) e o
> `shared/ui` **não** se movem para features — são transversais. Regra: se dois
> domínios usam, é `shared/`.

### 4.3 A camada de tradução (específica deste app)

Há uma responsabilidade que merece destaque por ser o coração do produto: a
**tradução da constituição interna para linguagem cidadã** (status técnico →
"seu pedido está em análise"). Isso vive na borda de cada feature (ex.:
`features/territorial/TerritoryBondView`), nunca no back-end. O back-end fala o
vocabulário do contrato; o front traduz para o cidadão. Mantenha essa fronteira.

---

## 5. Os contratos (a costura entre as camadas)

Vocabulários controlados (status de issue/PR, opções de voto, papéis, tipos de
vínculo) existem em **um lugar por camada** e mudam **juntos**:

```
frontend/src/contracts/civic.ts          ← o front conhece os valores válidos
backend/internal/kernel/contracts/...     ← o back valida contra eles
backend/migrations/006_contract_*.sql      ← o banco impõe CHECK constraints
```

Alterar um vocabulário é uma mudança em três arquivos coordenados. Tratar isso
como contrato evita o bug clássico de o front mandar um status que o back recusa
e o banco nem conhece.

---

## 6. Onde coloco X? (guia de decisão)

| Vou escrever… | Vai em… |
| --- | --- |
| uma regra de negócio (quem pode, qual quórum, transição válida) | `policy.go` do domínio (+ teste) |
| um `SELECT`/`INSERT` | `repository.go` do domínio |
| autorização + orquestração de passos | `service.go` do domínio |
| leitura do corpo HTTP / escrita do JSON | `handler.go` do domínio |
| um helper que serializa JSON / abre tx / grava auditoria | `kernel/` |
| um valor de vocabulário (novo status, novo papel) | os **três** arquivos de contrato |
| um componente usado por 2+ features | `shared/ui` |
| um componente de uma feature só | `features/<dom>/` |
| tradução status técnico → texto do cidadão | borda da feature no front |
| uma constante política (mandato, quórum, prazo) | constante **nomeada** na `policy`, documentada como provisória |

---

## 7. Anti-padrões a evitar (e onde já apareceram)

- **Módulo-deus** (`internal/public`): um pacote que sabe de tudo. Sintoma: um
  `Repository` com 40 métodos de domínios diferentes. Cura: extração por domínio.
- **Arquivo-deus de API** (`lib/api.ts`): todas as chamadas num arquivo. Cura:
  `api.ts` por feature.
- **Regra no handler/service**: `if status == "..."` espalhado pela camada de
  aplicação. Cura: a decisão é uma função pura na `policy`.
- **SQL no service**: query fora do repositório. Cura: todo SQL no `repository`.
- **Domínio importando domínio**: `votings` importando o `repository` de `prs`.
  Cura: porta/interface ou evento.
- **Fallback que mascara regra**: o front aplicar localmente o que o back recusou
  (4xx). Cura: erro de negócio (4xx) é mensagem, não fallback (já corrigido).

---

## 8. Tabela de convergência (atual → alvo)

| Domínio | Hoje | Alvo | Prioridade de extração |
| --- | --- | --- | --- |
| territorial | módulo próprio ✅ | igual | — (gabarito) |
| audit | módulo próprio ✅ | vai para `kernel/audit` | baixa |
| auth | módulo próprio ✅ | igual | — |
| releases | dentro de `public` | `internal/releases` | **alta** (isolado) |
| executions | dentro de `public` | `internal/executions` | **alta** (isolado) |
| lawtext | dentro de `public` | `internal/lawtext` | média |
| territories(leitura)+stats | dentro de `public` | `internal/territories` | média |
| issues | dentro de `public` | `internal/issues` | média |
| prs | dentro de `public` | `internal/prs` | baixa (acoplado) |
| votings | dentro de `public` | `internal/votings` | baixa (acoplado a prs) |
| front: api | `lib/api.ts` único | `features/*/api.ts` | **alta** (fácil, alívio grande) |
| front: telas/hooks | `pages/` + `hooks/` | `features/*` | incremental |

---

## 9. Resumo em uma frase

> Organize por **domínio**, isole a **regra** em funções puras testáveis, deixe
> **I/O na borda**, faça as **dependências apontarem para um kernel sem opinião**,
> e **trate vocabulário como contrato** — convergindo de forma incremental, um
> domínio por vez, sempre que tocar nele.
