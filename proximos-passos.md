# Próximos Passos — Código Público

Roteiro de evolução da plataforma, organizado por prioridade. Atualizado em 11/06/2026.

## Onde estamos

A base está funcional de ponta a ponta:

- **Backend Go** com autenticação JWT (CPF protegido por HMAC-SHA256), escrita cívica auditada, votação com unicidade por cidadão e resultado agregado, máquina de estados de PRs com transições por papel (`pr_statemachine.go`), triagem institucional, merge institucional que aplica diffs e gera release, trilha de auditoria dupla (`audit_events` + `pr_transition_events`).
- **Front-end React** mobile-first integrado à API com fallback local de demonstração, roteamento real via History API com deep links (`/prs/046`, `/issues/118`), design system unificado (tokens, `btn-*`, `field`, chips), toasts de feedback, indicador de saúde da API e console institucional dirigido por `GET /prs/{id}/transitions`.
- **Contratos formais** espelhados nas três camadas: `src/contracts/civic.ts`, `backend/internal/public/contracts.go` e constraints no PostgreSQL (migration 006).

---

## Prioridade 1 — Confiabilidade (antes de crescer)

O projeto não tem nenhum teste automatizado. Esse é o maior risco atual: as regras mais sensíveis (voto único, transições de estado, merge institucional) só são verificadas manualmente.

- [ ] **Testes de serviço no Go** (`httptest` + banco de teste via Docker):
  - voto: unicidade por cidadão, recibo não revela escolha, resultado agregado;
  - máquina de estados: transições válidas/inválidas, papéis, estados terminais;
  - merge: exige `Aprovado formalmente` + papel institucional, aplica diffs, gera release;
  - dashboard: nunca expõe CPF.
- [ ] **Testes unitários puros da `PRStateMachine`** (sem banco — a tabela de transições merece cobertura exaustiva).
- [ ] **Vitest no front**: hooks (`useIssues`, `usePRs`, `useVotings`) — caminho API, fallback de rede e rejeição 4xx sem mutação local.
- [ ] **CI no GitHub Actions**: `go vet` + `go test` + `tsc --noEmit` + `vite build` em todo push/PR.
- [ ] **Migrations versionadas com ferramenta** (golang-migrate ou goose) — hoje os `.sql` são aplicados manualmente e não há controle de quais já rodaram.

## Prioridade 2 — Fechar os ciclos abertos no backend

- [ ] **Encerramento automático de votações**: a máquina já tem `VotingResolutionTrigger` (quórum + maioria → aprovado/rejeitado), mas nada o invoca. Criar um job (goroutine com ticker ou comando `cmd/close-votings`) que encerre votações vencidas pelo prazo e dispare a transição `system`.
- [ ] **Endpoint real de repositórios** (`GET /repositories`): é o último mock do front e a UI agora é repositório-cêntrica. Exige tabela `repositories` + seed + contadores (issues/PRs/releases por repositório).
- [ ] **Escrita de reviews e checks institucionais**: hoje só há leitura. `POST /prs/{id}/reviews` (papel institucional, tipo de revisão do vocabulário) e execução de checks com resultado persistido.
- [ ] **Comentários em artigos da Lei Orgânica**: a tabela e o modelo existem (`ArticleComment`), falta o `POST /organic-law/articles/{id}/comments`.
- [ ] **Rate limiting com Redis**: o Redis está conectado mas só serve ao health check. Aplicar limite por IP/cidadão em `/auth/login`, `/citizens/register` e `/votings/{id}/vote` (mitiga força bruta de CPF+data de nascimento).

## Prioridade 3 — Identidade e segurança

- [ ] **Integração com gov.br (OAuth2)** como identidade forte — CPF + data de nascimento são dados semi-públicos no Brasil e servem apenas para MVP. Isso muda o patamar de legitimidade das consultas.
- [ ] **Expiração e renovação de sessão**: refresh token ou re-login suave quando o JWT expira (hoje o front só limpa o token no 401).
- [ ] **Gestão de papéis institucionais**: hoje o papel é editado direto no banco. Criar endpoint administrativo auditado para conceder/revogar papéis (`admin` concede, tudo vira `audit_event`).
- [ ] **Revisão de segurança**: headers (CSP, HSTS), validação de tamanho de payloads, sanitização de conteúdo de comentários no render.

## Prioridade 4 — Experiência do usuário

- [ ] **Detalhe do PR mostrar a tramitação**: expor a linha do tempo real de `pr_transition_events` (quem moveu, quando, por qual gatilho) na página do PR — a auditoria existe, falta a vitrine.
- [ ] **Busca**: campo de busca em issues, PRs e artigos (no front primeiro; `ILIKE`/`tsvector` no Postgres depois).
- [ ] **Estados de carregamento**: usar a classe `.skeleton` (já existe no CSS) nas listas enquanto a API responde, em vez de mostrar o fallback instantâneo.
- [ ] **Acessibilidade**: revisar contraste dos tons `--color-git-muted`, navegação por teclado no modal e nas abas, `aria-*` nos botões de voto.
- [ ] **PWA**: manifest + service worker — o formato mobile do app pede instalação na tela inicial.
- [ ] **Notificações reais**: "seu PR mudou de status", "votação que você participou foi encerrada" — começa com polling do dashboard, evolui para push.

## Prioridade 5 — O salto institucional

O que transforma o protótipo em plataforma:

- [ ] **Onboarding de município real**: importador de Lei Orgânica a partir do PDF/HTML da câmara (parsing de artigos, capítulos e seções para o schema existente). Meta: importar uma lei real em um fim de semana.
- [ ] **Multi-tenancy**: hoje o sistema assume um único município (Novo Horizonte). Decidir entre instância por município (mais simples, recomendado para o piloto) ou tenant por linha.
- [ ] **Exportação de dados abertos**: endpoints públicos de dump (JSON/CSV) de issues, PRs, votações agregadas e releases — coerente com o princípio de auditabilidade.
- [ ] **Vínculo com iniciativa popular formal**: fluxo de coleta de apoios com os requisitos do art. 29 da CF (percentual do eleitorado) e protocolo formal na câmara — é o caminho mais curto para a plataforma ter efeito jurídico real.
- [ ] **Buscar o município-piloto**: nenhum item acima importa sem uma câmara ou prefeitura parceira disposta a tratar a plataforma como canal de entrada do processo legislativo.

## Dívidas conhecidas (pequenas, não urgentes)

- [ ] `package.json` ainda se chama `react-example` v0.0.0; deps `@google/genai`, `express` e `dotenv` não são usadas — limpar.
- [ ] Criar arquivo `LICENSE` (Apache 2.0 é declarado nos fontes e no README, mas o arquivo não existe).
- [ ] README principal desatualizado: descreve a estrutura antiga (`src/components/`) e diz que "não há backend" — reescrever refletindo `src/pages/` + backend Go.
- [ ] `getAdminDashboard`, `getOrganicLawVersions` e outros aliases em `src/lib/api.ts` sem consumidores — remover os mortos.
- [ ] O hint de tipos `FormEvent is deprecated` (React 19): trocar por `React.FormEvent` inline ou handlers tipados.

---

## Sugestão de sequência

1. **Semana 1–2**: CI + testes da máquina de estados e do módulo de votação (Prioridade 1 é pré-requisito de tudo).
2. **Semana 3–4**: encerramento automático de votações + endpoint de repositórios + tramitação visível no PR.
3. **Mês 2**: rate limiting, reviews institucionais, importador de Lei Orgânica.
4. **Mês 3+**: gov.br, dados abertos e a conversa com o primeiro município real.
