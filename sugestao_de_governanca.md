# Sugestão de Governança — documento de trabalho

> Status: **rascunho para refinamento**. Este documento consolida a próxima
> etapa de governança territorial do Código Público. Ele ainda **não** está
> implementado no backend — serve para você decidir as regras antes de virarem
> código e teste. Pontos marcados com **[DECIDIR]** são escolhas em aberto.

## Síntese

> O Código Público não deve apenas permitir participação; ele deve definir
> quem tem legitimidade territorial para participar, como essa legitimidade é
> validada, como pode ser contestada, como se recorre e como tudo permanece
> auditável.

O projeto deixou de ser produto cívico e virou **constituição operacional
para participação territorial**. Isso muda o padrão de rigor: cada regra aqui
é uma regra institucional, não uma feature.

---

## Parte 1 — Cidadania municipal vs. cidadania territorial

Distinção central que precisa ficar explícita no modelo:

```txt
Cidadão Municipal (não associado a um território-base validado)
  - participa de temas AMPLOS da cidade
  - com peso menor / nível reduzido
  - pode acompanhar, abrir issues informativas, votar em consultas gerais

Cidadão Territorial (vínculo T3+ validado)
  - cidadão pleno
  - participa de temas do seu território com peso integral
  - pode contestar, recorrer, pedir saída do maintainer
```

Regra:

> O morador da cidade pode votar em temas amplos da cidade, mas em nível menor.
> Para ser cidadão pleno (nível mais alto), precisa do vínculo territorial
> validado ("associação").

**[DECIDIR]** Como se calcula o peso do voto municipal vs. territorial?
Opções: (a) peso binário (conta/não conta por escopo), (b) peso fracionário
fixo (ex.: municipal = 0,5), (c) quórum separado por categoria. Recomendação:
começar com (a) — binário por escopo — por ser auditável e explicável.

---

## Parte 2 — Período de descanso contra contestação abusiva

Regra nova a adicionar ao protocolo de vínculo:

> Vínculo confirmado após contestação (resultado "Mantido") não pode ser
> recontestado por **180 dias**, salvo apresentação de **fato novo**.

Objetivo: impedir perseguição local por recontestação repetida.

Implementação prevista:

```txt
- bond_contestations registra decided_at quando "Mantido"
- nova contestação no mesmo bond exige:
    (created_at - última decisão "Mantido") > 180 dias
    OU flag fato_novo = true com justificativa adicional
- violação → 409 com mensagem clara ("vínculo em período de descanso até DD/MM")
```

**[DECIDIR]** O que qualifica como "fato novo"? Sugestão: exigir um campo
`new_fact_description` obrigatório e registrar que houve invocação de fato novo
na auditoria — o mérito é avaliado pelo maintainer, mas o uso fica rastreável
(para coibir abuso do próprio "fato novo").

**[DECIDIR]** 180 dias é o número certo? Alternativas discutíveis: 90 dias
(mais permissivo), 365 dias (mais protetivo).

> **Estado:** implementado provisoriamente em **180 dias** como regra pura e
> testada (`policy.CanReopenContestation`, constante `RecontestationCooldown`).
> Trocar o número é editar uma constante; a decisão final permanece aberta.

---

## Parte 3 — Protocolo de maintainers territoriais

**Este é o maior risco político do sistema.** Quem controla a porta de entrada
do bairro controla geografia política. O processo de escolha e remoção precisa
ser tão auditável quanto o vínculo do cidadão.

> Um maintainer territorial não pode ser vitalício, invisível nem removido
> informalmente.

### 3.1 Formas de escolha

```txt
1. eleição territorial          (futuro — entre vínculos T3+ do território)
2. indicação pelo legislativo
3. nomeação provisória pelo executivo
4. designação emergencial (legislativo ou executivo)
```

**[DECIDIR]** A nomeação pelo executivo é o vetor de captura mais provável.
Salvaguarda sugerida: nomeação do executivo é **sempre provisória** (status
`provisional`, mandato curto) e **nunca** pode converter-se em `active`
permanente sem passar por eleição territorial ou ratificação do legislativo.

### 3.2 Status do maintainer (máquina de estados)

```txt
provisional   → nomeado em caráter temporário, mandato curto
active         → mandato pleno e vigente
under_review   → em processo de revisão (recursos reformados / moção popular)
suspended      → temporariamente sem poderes, aguardando decisão
removed        → destituído por processo concluído
expired        → mandato terminou sem renovação
```

**[DECIDIR]** Quem pode mover cada transição? Proposta inicial:

```txt
provisional → active      : eleição territorial OU ratificação legislativa
active → under_review     : Maintainer Geral (de ofício) OU moção popular atingiu limiar
under_review → suspended  : Maintainer Geral
under_review → active      : Maintainer Geral (revisão arquivada)
suspended → removed        : Maintainer Geral (processo concluído) OU resultado de moção
qualquer → expired         : sistema (fim de mandato sem renovação)
```

### 3.3 Mandato

```txt
- todo maintainer tem início e fim de mandato
- maintainer provisório: prazo curto (ex.: 90 ou 180 dias)  [DECIDIR número]
- renovação exige justificativa pública (registrada em auditoria)
- fim de mandato sem renovação → status expired automático
```

**[DECIDIR]** Duração do mandato pleno (`active`): 1 ano? 2 anos? Alinhado a
algum ciclo institucional do município?

### 3.4 Destituição

```txt
1. decisões recorrentes reformadas pelo Maintainer Geral
   (limiar de reformas em janela de tempo → under_review automático)  [DECIDIR limiar]
2. moção popular do próprio bairro
   - quórum: X% dos vínculos T3+ ativos do território  [DECIDIR — proposta: 50% + 1]
   - exige justificativa e período de votação
3. NUNCA destituível pelo executivo
   - exceção: caso especial estritamente definido  [DECIDIR quais casos, se algum]
```

Regra forte:

> O maintainer responde ao território (moção popular) e à instância recursal
> (Maintainer Geral), **não** ao executivo que eventualmente o nomeou.

### 3.5 Auditoria

Toda transição de status de maintainer gera evento encadeado:

```txt
maintainer.appointed · maintainer.activated · maintainer.review_opened
maintainer.suspended · maintainer.removed · maintainer.expired
maintainer.mandate_renewed · maintainer.recall_motion_opened
maintainer.recall_motion_decided
```

---

## Parte 4 — Bairro sem maintainer (válvula anti-exclusão)

A regra original ("sem maintainer = não aceita vínculos") é forte, mas tem
efeito distributivo perverso: bairros organizados ganham voz rápido; periferia
desorganizada — quem mais precisa — fica em leitura pública indefinidamente.

**Válvula:** em vez de bloquear tudo, o território sem maintainer aceita
participação provisória e de baixo impacto.

```txt
Território SEM maintainer ativo:
  leitura pública              : SIM
  cadastro provisório (T1)     : SIM  ← entra em fila, sem poder deliberativo
  fila de interessados         : SIM
  issues informativas          : SIM
  abertura de issue formal     : LIMITADA  [DECIDIR o que é "limitada"]
  vínculo T3 (validado)        : NÃO
  votação local                : NÃO
  solicitação de maintainer    : SIM  ← caminho para sair da condição
  maintainer institucional temp: SIM  ← designação emergencial provisória
  temas de baixo impacto       : SIM  [DECIDIR a lista]
```

Isso preserva o incentivo à organização comunitária **sem** excluir quem ainda
não se organizou.

**[DECIDIR]** "Issue formal limitada" e "temas de baixo impacto" precisam de
definição objetiva — provavelmente uma lista de categorias permitidas em modo
provisório (ex.: infraestrutura e transparência sim; alteração normativa não).

---

## Parte 5 — UI que esconde a constituição

Condição de adoção. Se o cidadão precisar entender "T3" ou "contestação
escalada" para reportar um buraco, o projeto falha.

O cidadão **nunca** vê:

```txt
T0 T1 T2 T3 T4 · pending_local_review · appealed_to_general_maintainer
contestação escalada · ABAC · state machine · trust_level
```

O cidadão vê:

```txt
Qual é o seu bairro?
Você mora, trabalha ou estuda aqui?
Envie uma comprovação (conta de luz, telefone…)
Seu pedido está em análise.
Este bairro ainda não tem representante — você pode acompanhar enquanto aguarda.
```

### Tabela de tradução status técnico → linguagem cidadã

```txt
pending_local_review            → "Seu pedido foi enviado ao representante do bairro."
appealed_to_general_maintainer  → "Seu recurso foi enviado para revisão geral."
territory_without_maintainer    → "Este bairro ainda não tem representante ativo.
                                   Seu cadastro ficará em fila provisória."
approved (T3)                   → "Você está validado como morador do seu bairro."
contested                       → "Seu vínculo está em revisão. Você pode enviar
                                   uma explicação."
revoked                         → "Seu vínculo foi encerrado. Veja o motivo e seus
                                   direitos de recurso."
```

Princípio: **a UI traduz a constituição interna em linguagem comum.** O backend
guarda o rigor; a interface entrega simplicidade.

---

## Parte 6 — Arquitetura institucional consolidada

```txt
SysAdmin Municipal
  - infraestrutura, segurança, usuários administrativos
  - SEM poder silencioso sobre mérito político (toda ação relevante é auditada)

Maintainer Geral  (associável ao Legislativo)
  - instância recursal
  - revisão de conflitos territoriais
  - validação institucional / merge geral
  - decide recursos e contestações escaladas
  - abre revisão e destitui maintainer territorial por processo

Maintainer Territorial
  - primeira análise de vínculo
  - organização do bairro e validação de problemas locais
  - poder limitado e auditado, mandato com prazo
  - responde ao território e ao Maintainer Geral, não ao executivo

Cidadão Territorial
  - participa a partir do território-base
  - pode recorrer, contestar vínculo suspeito, abrir problemas do bairro
  - pode iniciar/assinar moção de saída do Maintainer Territorial

Cidadão Municipal (sem vínculo territorial validado)
  - participa de temas amplos da cidade, em nível reduzido
```

---

## Ordem de execução recomendada

```txt
1. Testar regras de vínculo, recurso e contestação (testes "constitucionais")
2. Especificar nomeação/destituição de maintainers (este doc → protocolo final)
3. Desenhar UI simples de vínculo territorial
4. Só então: blockchain/OpenTofu como camadas de prova e infraestrutura
```

Por que esta ordem: o custo de um bug mudou de natureza. Um erro na máquina de
estados do vínculo não é mais um bug — é uma **injustiça institucional**
(alguém excluído do próprio bairro por erro de código). Código que funciona
como constituição se testa **antes** de promulgar.

### Artefatos a produzir

```txt
docs/GOVERNANCA-TERRITORIAL.md                      (atualizar com maintainers)
docs/PROTOCOLO-DE-MAINTAINERS-TERRITORIAIS.md       (novo — derivado deste doc)
docs/PROTOCOLO-DE-VINCULO-TERRITORIAL.md            (atualizar: período de descanso)
backend/internal/territorial/*_test.go              (testes das regras)
```

---

## Riscos abertos a vigiar

```txt
- Captura via nomeação do executivo        → mandato provisório obrigatório
- Exclusão da periferia desorganizada      → válvula do bairro sem maintainer
- Contestação como arma de perseguição     → período de descanso de 180 dias
- Complexidade afastando o cidadão comum   → UI que esconde a constituição
- Bug = injustiça institucional            → testes antes de qualquer feature nova
```

---

## Decisões pendentes (consolidado [DECIDIR])

1. Peso do voto municipal vs. territorial (proposta: binário por escopo)
2. Definição objetiva de "fato novo" na recontestação
3. Janela de descanso: 90 / 180 / 365 dias (proposta: 180)
4. Conversão de maintainer provisório → ativo (proposta: só por eleição/ratificação)
5. Transições da máquina de estados do maintainer (quem move cada uma)
6. Duração do mandato pleno
7. Limiar de reformas que abre revisão automática do maintainer
8. Quórum de moção popular de destituição (proposta: 50% + 1 dos T3+)
9. Casos especiais (se algum) em que o executivo poderia intervir
10. Definição de "issue formal limitada" e "temas de baixo impacto" em bairro sem maintainer
```
