# Mapa de Reaproveitamento do GitLaw

Este documento registra o que o projeto Código Público deve aproveitar do antigo projeto GitLaw, o que deve ser adaptado antes de entrar na base atual e o que deve permanecer apenas como referência conceitual.

O objetivo não é migrar o GitLaw para dentro do Código Público. O objetivo é aproveitar decisões maduras de domínio, fluxo institucional e experiência de uso, mantendo a arquitetura atual do Código Público em Go, PostgreSQL, Redis e React.

## Decisão Geral

O GitLaw deve ser tratado como uma referência de produto e domínio, não como fonte direta de infraestrutura.

O Código Público já tem uma direção técnica mais adequada para o MVP municipal:

- backend em Go;
- persistência oficial em PostgreSQL;
- Redis apenas como apoio operacional;
- autenticação cidadã por CPF normalizado e hash;
- contratos compartilhados entre front-end e backend;
- leitura pública e ações autenticadas separadas.

Por isso, a migração deve ser seletiva.

## Entra no Código Público

### 1. Máquina de estados de proposta

Origem no GitLaw:

- `GitLaw/packages/domain/src/proposal-state-machine.js`
- `GitLaw/docs/dominio/maquina-de-estados.md`
- `GitLaw/test/server/proposal-state-machine.test.js`

Decisão:

Adaptar a máquina de estados para o vocabulário do Código Público.

Modelo de referência:

```text
Rascunho
-> Aberto para debate
-> Em revisão pública
-> Em revisão técnica
-> Em revisão jurídica
-> Pronto para votação
-> Em votação
-> Aprovado pela consulta pública
-> Encaminhado à Câmara
-> Aprovado formalmente
-> Incorporado ao texto oficial
```

Também devem existir estados terminais:

- Rejeitado;
- Arquivado.

Uso esperado:

- validar transições de status no backend;
- impedir merge institucional fora do rito;
- orientar a UI com ações permitidas;
- servir como base para testes de regra de negócio.

### 2. Política de governança por repositório normativo

Origem no GitLaw:

- `GitLaw/packages/domain/src/gitlaw-domain.js`
- função `buildLawGovernancePolicy`
- `GitLaw/docs/protocolo/garantias-institucionais.md`

Decisão:

Trazer o conceito, mas modelar no Código Público como política de repositório normativo.

Entidade futura sugerida:

```text
repository_governance_policies
```

Campos candidatos:

- id;
- repository_name;
- approval_rule;
- approval_label;
- minimum_voting_window_days;
- requires_public_hearing;
- quorum_rule;
- protection_mode;
- codeowners_label;
- created_at;
- updated_at.

Uso esperado:

- Lei Orgânica com rito mais rígido;
- Plano Diretor com exigência de audiência pública;
- leis ordinárias com rito simplificado;
- PR cívico herdando as regras do repositório no momento da criação.

### 3. Snapshot de governança no PR cívico

Origem no GitLaw:

- `buildProposalGovernanceSnapshot`
- campo `governanca` em propostas.

Decisão:

O Código Público deve congelar no PR as regras institucionais aplicáveis no momento da criação.

Motivo:

Se a política do repositório mudar depois, o PR antigo continua auditável dentro do rito em que nasceu.

Campos futuros candidatos em `civic_prs` ou tabela relacionada:

- approval_rule;
- approval_label;
- minimum_voting_window_days;
- requires_public_hearing;
- public_hearing_registered;
- public_hearing_date;
- public_hearing_protocol;
- pending_requirements;
- governance_snapshot JSONB.

### 4. Eventos de domínio e criticidade institucional

Origem no GitLaw:

- `GitLaw/packages/infrastructure/src/protocol-event-policy.js`
- `GitLaw/packages/infrastructure/src/audit-ledger.js`
- `GitLaw/docs/protocolo/eventos.md`

Decisão:

Evoluir `audit_events` do Código Público para carregar mais semântica institucional.

Eventos sugeridos:

- citizen_registered;
- issue_created;
- issue_commented;
- issue_upvoted;
- pr_created;
- pr_commented;
- pr_upvoted;
- pr_status_changed;
- voting_created;
- vote_cast;
- voting_closed;
- pr_merged;
- release_created;
- execution_updated.

Campos candidatos:

- action;
- entity_type;
- entity_public_id;
- actor_id;
- actor_type;
- criticality;
- execution_layer;
- metadata;
- created_at.

Classificação sugerida:

```text
crítico       -> voto, merge, release, cidadania, alteração oficial
deliberativo  -> comentário, review, apoio
operacional   -> mudança de status, checks, triagem
informativo   -> leitura, sessão, navegação futura
```

### 5. UX de detalhe de PR

Origem no GitLaw:

- `GitLaw/apps/web/src/pages/PRDetalhe.tsx`

Decisão:

Aproveitar o desenho funcional da tela, não o estilo visual.

O Código Público deve adaptar para sua UI atual:

- Estado da governança;
- regras institucionais aplicáveis;
- motivo de bloqueio de voto ou merge;
- diff normativo;
- reviews e checks;
- votação relacionada;
- discussão pública;
- ações permitidas conforme status.

Não copiar:

- tema dark;
- layout mobile fixo;
- dependência de carteira;
- nomenclatura `propostas` quando o Código Público usa `PR cívico`.

### 6. Wizard de criação de PR cívico

Origem no GitLaw:

- `GitLaw/apps/web/src/pages/NovaProposta.tsx`

Decisão:

Transformar a criação de PR do Código Público em fluxo guiado.

Fluxo recomendado:

```text
1. Escolher repositório, artigo e issue vinculada
2. Editar texto e visualizar diff
3. Informar justificativa, impacto e revisar requisitos institucionais
4. Publicar PR cívico
```

Benefício:

Reduz a complexidade do formulário atual e deixa claro para o cidadão que ele está propondo uma alteração normativa, não apenas preenchendo um cadastro.

### 7. Componentes funcionais reutilizáveis

Origem no GitLaw:

- `GitLaw/apps/web/src/components/ui/DiffViewer.tsx`
- `GitLaw/apps/web/src/components/ui/VoteBar.tsx`
- `GitLaw/apps/web/src/components/ui/CIStatus.tsx`

Decisão:

Recriar esses componentes no design system do Código Público.

Componentes candidatos:

```text
src/shared/civic/NormativeDiffViewer.tsx
src/shared/civic/VotingResultBar.tsx
src/shared/civic/InstitutionalCheckStatus.tsx
```

Adaptações necessárias:

- usar a paleta clara atual;
- aceitar os tipos existentes em `src/types.ts`;
- não depender de variáveis CSS do GitLaw;
- não depender de aliases `@/` do GitLaw;
- manter compatibilidade com dados vindos da API Go.

### 8. Testes de ciclo institucional

Origem no GitLaw:

- `GitLaw/test/server/proposal-lifecycle.test.js`
- `GitLaw/test/server/proposal-state-machine.test.js`
- `GitLaw/test/server/protocol-event-policy.test.js`

Decisão:

Converter a intenção desses testes para testes do backend Go.

Casos importantes:

- PR não pode ser votado antes de ficar pronto para votação;
- cidadão não pode votar duas vezes;
- voto não expõe escolha individual nos resultados públicos;
- PR só pode ser incorporado se estiver em status permitido;
- merge cria release;
- merge registra eventos de auditoria;
- issue/PR/comentário/upvote exigem cidadão autenticado;
- evento crítico recebe classificação correta.

## Entra Depois

### 1. Voto com peso territorial

Origem no GitLaw:

- `calculateVoteWeight`
- `WeightedVoting.sol`
- regras de bairro impactado, adjacente e demais bairros.

Decisão:

Não entra no MVP atual.

Motivo:

O Código Público já implementou votação simples com uma pessoa, um voto. Voto ponderado por território é uma decisão política e jurídica sensível. Deve entrar apenas quando houver regra institucional clara.

Possível evolução:

```text
território impactado -> peso maior
território adjacente -> peso intermediário
demais territórios   -> peso padrão
```

### 2. Variações locais como forks territoriais

Origem no GitLaw:

- `ForkExperiment`;
- `NeighborhoodForks.sol`;
- páginas `BairroRepo` e `NovoFork`.

Decisão:

Guardar como evolução futura.

No Código Público, isso pode virar:

- branches territoriais;
- pilotos locais;
- experimentos normativos por comunidade;
- políticas públicas testadas em um território antes de virar regra municipal.

Não implementar agora porque o produto ainda precisa consolidar o fluxo principal:

```text
Lei -> Issue -> PR -> Review -> Votação -> Merge -> Release -> Execução
```

### 3. Autenticação por carteira e camada on-chain

Origem no GitLaw:

- contratos Solidity;
- sessão por assinatura;
- emissão de cidadania por token;
- sincronização protocolar.

Decisão:

Fica como referência futura.

O Código Público MVP deve manter:

- CPF normalizado e hasheado;
- JWT;
- cidadão territorial;
- auditabilidade em PostgreSQL.

Critério para retomar on-chain:

Somente quando houver uma garantia institucional clara que o banco auditável não resolva sozinho, como ancoragem pública de release legislativa ou prova externa de integridade.

### 4. Protocolo de ancoragem

Origem no GitLaw:

- `protocol-sync.js`;
- `protocol-state.json`;
- `listProtocolEventPolicies`.

Decisão:

Referência arquitetural futura.

Antes de implementar, o Código Público precisa definir:

- quais eventos precisam de ancoragem;
- qual camada é autoritativa;
- quem opera a chave institucional;
- como corrigir divergência entre banco local e camada externa;
- como cidadãos verificam a prova.

## Fica Apenas Como Referência

### 1. API Node/Express

Origem:

- `GitLaw/apps/api/src/server.js`

Decisão:

Não migrar.

Motivo:

O Código Público já tem backend em Go com Chi, Postgres, Redis, migrations e separação inicial em handlers, services e repositories.

O que pode ser reaproveitado:

- desenho dos endpoints como inspiração;
- tratamento de erros de domínio;
- persistência de eventos após mutação.

### 2. JSON store

Origem:

- `GitLaw/data/store.json`
- `GitLaw/packages/infrastructure/src/json-store.js`

Decisão:

Não migrar.

Motivo:

O PostgreSQL é a fonte oficial do Código Público.

O JSON store pode servir apenas para entender seeds e cenários de teste.

### 3. Tema visual dark/mobile

Origem:

- `GitLaw/apps/web/src/index.css`;
- páginas mobile-first do GitLaw.

Decisão:

Não copiar.

Motivo:

O Código Público precisa de uma experiência mais institucional, clara e legível em desktop e mobile. O GitLaw tem uma linguagem mais experimental, escura e próxima de app cripto/GitHub mobile.

O que aproveitar:

- hierarquia funcional das telas;
- clareza de ações;
- mensagens de bloqueio;
- componentes de diff, voto e checks.

### 4. Contratos Solidity

Origem:

- `GitLaw/contracts/CidadaniaToken.sol`;
- `GitLaw/contracts/WeightedVoting.sol`;
- `GitLaw/contracts/GitLawRepository.sol`;
- `GitLaw/contracts/NeighborhoodForks.sol`.

Decisão:

Não integrar agora.

Uso como referência:

- modelagem de garantias;
- eventos críticos;
- regras de voto;
- futuro estudo de ancoragem de releases.

### 5. Dependências e estrutura de monorepo do GitLaw

Origem:

- `GitLaw/node_modules`;
- `GitLaw/apps`;
- `GitLaw/packages`;
- `GitLaw/contracts`.

Decisão:

Não incorporar à estrutura principal do Código Público.

Observação:

Se o GitLaw permanecer na raiz apenas como material de consulta, `GitLaw/node_modules` não deve ser versionado nem considerado parte do build do Código Público.

## Impacto Sugerido no Código Público

### Front-end

Prioridade alta:

- criar tela guiada de novo PR cívico;
- melhorar tela de detalhe de PR;
- criar componentes próprios para diff, resultado de votação e checks;
- mostrar claramente motivo de ação bloqueada.

Prioridade média:

- criar página de repositório com política institucional;
- mostrar histórico de commits normativos por artigo;
- expor estado da governança da proposta.

### Backend

Prioridade alta:

- formalizar máquina de estados de PR;
- validar transições no service;
- ampliar testes de votação, merge e release;
- enriquecer `audit_events`.

Prioridade média:

- adicionar política de governança por repositório;
- congelar snapshot de governança no PR;
- separar melhor eventos de domínio de logs operacionais.

### Banco de Dados

Possíveis migrations futuras:

```text
normative_repositories
repository_governance_policies
civic_pr_governance_snapshots
domain_event_policies
legislative_commits
territory_adjacencies
local_normative_branches
```

Nem todas devem entrar agora. A ordem recomendada é:

1. `normative_repositories`;
2. `repository_governance_policies`;
3. `civic_pr_governance_snapshots`;
4. `legislative_commits`;
5. `territory_adjacencies`;
6. `local_normative_branches`.

## Ordem Recomendada de Execução

1. Recriar componentes de UI úteis no design atual do Código Público.
2. Transformar criação de PR em wizard.
3. Melhorar detalhe de PR com governança, diff, checks, votação e discussão.
4. Implementar máquina de estados de PR no backend.
5. Criar testes de ciclo institucional.
6. Evoluir auditoria para eventos de domínio classificados.
7. Adicionar política de governança por repositório.
8. Avaliar branches territoriais e ancoragem externa apenas depois do fluxo principal estar sólido.

## Resumo de Decisão

O GitLaw contribui principalmente com maturidade conceitual:

- proposta como unidade de deliberação;
- rito institucional explícito;
- voto com regras claras;
- governança por documento;
- auditoria semântica;
- consolidação como commit normativo;
- variação local como fork territorial.

O Código Público deve incorporar essas ideias gradualmente, mantendo a arquitetura atual e evitando importar complexidade técnica antes de ela representar uma garantia institucional real.
