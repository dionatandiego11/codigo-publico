# Estrutura do App — alvo e migração

Este documento define como organizar o Código Público para o novo eixo de produto: infraestrutura de Orçamento Participativo.

## Princípios

1. **Domínio antes de camada técnica.** Organizar por OP, território, demanda, matriz e execução, não por “controllers” ou “pages”.
2. **Regra no centro.** Estados, filtros, sorteio, votação e execução vivem em policy pura testável.
3. **I/O na borda.** HTTP e SQL não devem conter regra institucional.
4. **Contratos explícitos.** Status e tipos devem existir no front, back e banco.
5. **Migração incremental.** O legado `public` continua, mas o novo crescimento deve ir para `op`.

## Back-end alvo

```txt
backend/
  cmd/api/
  internal/
    platform/
      config/
      database/
      redis/
      middleware/
      health/
    kernel/
      web/
      audit/
      contracts/
    auth/
    territorial/
      bonds/
      maintainers/
      contestations/
    op/
      cycles/
      demands/
      proposals/
      filters/
      votings/
      matrix/
      institutionalization/
      releases/
      execution/
      learning/
    public/
      legacy/
```

Cada subdomínio deve seguir:

```txt
handler.go
service.go
repository.go
policy.go
policy_test.go
models.go
contracts.go
```

## Domínios do OP

### `op/cycles`

Abre e fecha ciclos do OP.

Entidades:

- `op_cycles`;
- calendário;
- envelope;
- status.

### `op/demands`

Entrada simples do cidadão.

Entidades:

- `budget_demands`;
- apoios;
- comentários;
- anexos;
- demandas dormentes.

### `op/proposals`

Demanda amadurecida.

Entidades:

- `budget_proposals`;
- forks;
- agrupamentos;
- histórico de maturação.

### `op/filters`

Filtros territoriais, jurídico-orçamentários e institucionais.

Entidades:

- `budget_filters`;
- justificativas;
- retorno da esteira;
- recurso.

### `op/votings`

Votação territorial.

Entidades:

- votação;
- voto individual protegido;
- resultado agregado;
- recibo sem revelar escolha.

### `op/matrix`

Matriz municipal do OP.

Entidades:

- `op_matrix_items`;
- proposta priorizada;
- território;
- valor;
- status institucional.

### `op/institutionalization`

Relação com Câmara, PPA, LDO e LOA.

Entidades:

- atos;
- anexos;
- emendas;
- publicações;
- divergências.

### `op/execution`

Acompanhamento da execução.

Entidades:

- `execution_items`;
- status;
- evidências;
- atrasos;
- justificativas.

### `op/learning`

Memória do ciclo.

Entidades:

- `cycle_learning_events`;
- execução frustrada;
- demanda dormente;
- impacto no próximo ciclo.

## Front-end alvo

```txt
src/
  app/
    App.tsx
    router.ts
    providers.tsx
  shared/
    api/
      client.ts
    ui/
    layout/
    feedback/
  contracts/
    op.ts
    territorial.ts
    audit.ts
  auth/
  features/
    op/
      cycles/
      demands/
      proposals/
      filters/
      votings/
      matrix/
      execution/
    territorial/
      bonds/
      maintainers/
    audit/
    legacy/
      law/
      prs/
      issues/
```

## Primeira experiência do usuário

A home deve mostrar:

- ciclo atual do OP;
- meu território;
- prazo do ciclo;
- orçamento disponível;
- demandas abertas;
- propostas aptas para votação;
- matriz do OP;
- itens em execução.

Não deve começar por branch, kernel, PR ou Lei Orgânica.

## Camada de tradução

O backend fala vocabulário institucional:

```txt
op_filter_returned_to_maturation
budget_proposal_ready_for_voting
institutionalization_blocked
```

O front traduz:

```txt
Sua proposta voltou para ajuste.
Esta proposta está pronta para votação.
A Câmara informou um impedimento e explicou o motivo.
```

## Migração do front

1. Criar `src/shared/api/client.ts`.
2. Criar contratos `src/contracts/op.ts`.
3. Criar `features/op/cycles`.
4. Criar `features/op/demands`.
5. Migrar home para ciclo/território/demanda.
6. Mover telas antigas para `features/legacy`.
7. Fatiar `lib/api.ts` até virar apenas compatibilidade ou desaparecer.

## Migração do back

1. Criar migrations das entidades OP.
2. Criar módulo `internal/op`.
3. Implementar leitura pública do ciclo atual.
4. Implementar demanda simples.
5. Implementar apoio e maturação.
6. Implementar fork e agrupamento.
7. Implementar filtros.
8. Implementar votação territorial.
9. Implementar matriz.
10. Implementar institucionalização e execução.

## Anti-padrões

- crescer `internal/public`;
- colocar regra em handler;
- esconder filtro no service;
- deixar status como string solta;
- gravar voto individual em resposta pública;
- gravar dado pessoal em blockchain;
- fazer o front aplicar localmente algo que o back recusou;
- transformar Maintainer Técnico em decisor político.

## Tabela de convergência

| Área | Atual | Alvo |
|---|---|---|
| Centro do produto | Lei/issue/PR | Ciclo OP/território/demanda |
| Backend principal | `internal/public` | `internal/op` |
| Front principal | páginas cívicas legadas | features de OP |
| Votação | aprovação simples | priorização territorial |
| Release | legislativa/normativa | release do ciclo OP |
| Execução | módulo auxiliar | fechamento do ciclo |
| Blockchain | auditoria genérica | hashes do OP e sorteio |

## Regra final

> Todo código novo deve responder: em qual etapa da esteira do OP isso vive?
