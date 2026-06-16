# Protocolo do Orçamento Participativo — Código Público

> Documento **canônico** da esteira do OP. Consolida e substitui o detalhamento de
> [fluxo.md](fluxo.md) como protocolo operacional de referência. A teoria está em
> [FUNDAMENTACAO-TEORICA.md](FUNDAMENTACAO-TEORICA.md); o estado real do que está
> construído vs. o alvo está em [lacunas.md](lacunas.md); a fórmula de carência e o
> modelo orçamentário detalhado estão em [ORCAMENTO-PARTICIPATIVO.md](ORCAMENTO-PARTICIPATIVO.md);
> auditoria e privacidade em [BLOCKCHAIN-E-AUDITORIA.md](BLOCKCHAIN-E-AUDITORIA.md).

O Código Público é infraestrutura pública, auditável e open source de **Orçamento
Participativo municipal**. Este protocolo descreve a esteira que transforma um
problema territorial simples em decisão orçamentária rastreável, executada e
aprendida.

A filosofia de desenho é explícita: **o protocolo não confia em ninguém em
particular.** Ele distribui poder entre protocolo (regra automática), povo (limiar
de apoio), colegiado (conselho sorteado) e instituição (Legislativo), e torna todo
desvio **visível e custoso**. É desenho para o pior caso, não para o melhor.

---

## 1. Regra comum, número local (o princípio que organiza tudo)

Seguindo o policentrismo de Elinor Ostrom: **a regra é comum, o número é local.**
Existe um **kernel comum** — regras democráticas mínimas que nenhum município pode
violar — e um **regimento local** — parâmetros que cada cidade calibra **dentro de
uma faixa com piso e teto**.

### 1.1 Kernel comum (inviolável)

Nenhum regimento local, sob nenhuma justificativa, pode:

- deixar um território reconhecido sem voz;
- criar mandato vitalício ou sem rotação;
- realizar sorteio não auditável;
- aplicar filtro sem justificativa pública;
- expor voto individual;
- tornar o recall impossível (quórum proibitivo) ou meramente simbólico;
- zerar o envelope de um território (a participação ficaria decorativa);
- gravar dado pessoal em blockchain;
- alterar histórico de forma invisível;
- substituir decisão popular por veto político **silencioso** (todo veto fora dos
  fundamentos formais vira incidente público — ver §8).

### 1.2 Regimento local (parâmetros calibráveis)

Cada município define seus números **dentro da faixa comum**. A faixa existe para
impedir que o parâmetro burle o kernel (um mandato de 10 anos burlaria a rotação;
um quórum de recall de 90% o tornaria impossível). O *default sugerido* é ponto de
partida, não obrigação.

| Parâmetro | Faixa comum (piso–teto) | Default sugerido | Regra comum que protege |
|---|---|---|---|
| Tamanho do conselho territorial | 3–7 membros | 5 | colegialidade (≥3 evita o "rei"); operabilidade (≤7) |
| Duração do mandato do conselho | 1 ciclo | 1 ciclo | sempre temporário |
| Mandatos consecutivos permitidos | 0–1 | 1 | rotação obrigatória |
| Limiar de apoio para maturação | 1%–10% dos vinculados (mín. absoluto definido pela cidade) | 3% ou 15 apoios | nunca simbólico, nunca proibitivo |
| Quórum de votação territorial válida | 5%–25% dos vinculados | 10% | participação real sem inviabilizar |
| Quórum de recall | 15%–40% dos vinculados | 25% | sempre possível, nunca impossível |
| Razão igual / carência do envelope territorial | de 30/70 a 70/30 | 50/50 | nenhum território sem piso; equidade preservada |
| Porção estruturante municipal | 0%–40% do envelope total | 20% | a maior parte é decidida no território |
| Janela de inscrição (conselho) | ≥ 10 dias | 15 dias | tempo real de divulgação |
| Janela de maturação | ≥ 21 dias | 30 dias | amadurecimento efetivo da demanda |
| Janela de votação territorial | ≥ 7 dias | 10 dias | acesso amplo, inclusive de quem vota tarde |
| Limite para faseamento plurianual | definido pela cidade, acima do envelope do ciclo | — | demanda cara vira fases, não lixo |

> Os limites rígidos da faixa comum são, eles próprios, um **comum** — definidos
> pelo protocolo e protegidos por testes de policy. O município escolhe o número;
> não escolhe se a regra existe. (Decisão sobre as faixas exatas: ver §11.)

---

## 2. Papéis

### 2.1 Maintainer Geral (Legislativo)

Representa o Legislativo municipal no rito institucional.

- abre o ciclo: calendário, territórios e divisão do envelope (§5–§6);
- valida o Maintainer Técnico;
- recebe a matriz consolidada;
- conduz a institucionalização na Câmara e o merge em PPA/LDO/LOA;
- aplica o **filtro de admissibilidade** (lista fechada de fundamentos formais — §8),
  sempre justificado e contestável.

**Não pode** recusar por mérito político de forma silenciosa: todo veto fora dos
fundamentos formais abre incidente público (§8).

### 2.2 Maintainer Técnico (TI da prefeitura / sysadmin)

Opera a infraestrutura. Configura parâmetros aprovados, garante disponibilidade,
segurança e auditoria. **Não decide mérito político** — papel técnico, sem mérito
político.

### 2.3 Conselho Territorial (sorteado — não um indivíduo)

A correção central deste protocolo: o território é facilitado por um **conselho
colegiado de 3–7 cidadãos sorteados** (regimento local), não por uma pessoa única.

O conselho **facilita**, não governa:

- organiza e convoca; registra; orienta agrupamento e fork;
- pede complementação quando falta informação;
- decide **apenas os casos genuinamente ambíguos** do filtro territorial (§4),
  sempre por maioria do colegiado e com justificativa pública.

O conselho **não** decide aptidão por discricionariedade: a aptidão é resolvida por
protocolo + limiar de apoio (os dois portões da §4). Limites do kernel: não apaga
histórico, não rejeita por opinião pessoal, não impede contestação, não vira
autoridade privada.

**Território sem inscritos não fica mudo:** opera em **modo-assembleia** (decisões
abertas da comunidade vinculada) até que haja inscritos para o sorteio; o Maintainer
Geral pode zelar **proceduralmente** (convocar, registrar), nunca decidir mérito.

### 2.4 Cidadãos do território

Cadastram-se, criam vínculo territorial, abrem demandas, apoiam/não apoiam,
comentam, votam e fiscalizam a execução.

---

## 3. A esteira (visão geral)

```txt
0   Calendário publicado + envelope dividido (territorial: piso+carência | estruturante)
1   Cadastro + vínculo territorial
2   Inscrição + sorteio do CONSELHO territorial (3–7)  | modo-assembleia se vazio
3   Demanda simples
4   Apoio / não-apoio                → limiar de maturação é POPULAR
5   Agrupamento / fork               → conselho FACILITA, não decide sozinho
6   Maturação territorial
7   Filtro territorial PROTOCOLAR    → Portão A (sistema) + Portão B (apoio); ambíguo → conselho
8   Circuit breaker jurídico-orçamentário → custo vs SUB-ENVELOPE do território
9   Demanda apta
10  Votação territorial              → dentro da fatia do território
11  Consolidação: territorial (já financiada) + matriz estruturante (carência)
12  Filtro institucional             → admissibilidade formal | veto político → INCIDENTE PÚBLICO
13  Institucionalização na Câmara (PPA / LDO / LOA)
14  Release do ciclo
15  Execução fiscalizada             → com prazo
16  Aprendizado                      → escreve memória → ajusta carência e reentrada do próximo ciclo
```

Não é uma linha reta: é uma **linha de produção com retornos controlados** (§9).

---

## 4. Os dois portões de aptidão (Fix do gargalo)

A "demanda apta" não depende do julgamento de ninguém. Ela atravessa **dois portões
que não dependem de pessoa**, e só o caso ambíguo sobe ao conselho.

**Portão A — protocolar (o sistema decide):**

- a demanda é do território declarado?
- não é duplicada (senão → agrupamento)?
- tem a informação mínima do formulário?
- é competência pública (não é demanda privada)?

**Portão B — popular (a comunidade decide):**

- atingiu o limiar de apoio para maturação (regimento local, §1.2)?

**Só o ambíguo sobe ao conselho:** casos onde "é do território?" ou "é público?" são
genuinamente discutíveis. Decisão por maioria do colegiado, justificativa pública,
contestável. Isso elimina o porteiro discricionário que um filtro humano único
representaria.

---

## 5. Calendário (a camada de tempo)

O OP é movido a prazo e **precisa caber no ciclo fiscal**: a votação tem de fechar
antes do prazo legal de envio da LOA. O ciclo publica, no stage 0, um calendário com
janelas mínimas (regimento local, §1.2):

```txt
[inscrição] → [sorteio] → [demandas + apoio] → [maturação] → [filtros]
→ [votação territorial] → [consolidação/matriz] → [institucionalização]
→ [release] → [execução: ao longo do exercício] → [aprendizado: início do próximo ciclo]
```

A janela de votação **não pode** terminar depois do prazo legal da LOA — checagem do
sistema. Cada janela respeita o piso comum (ex.: maturação ≥ 21 dias) para que
nenhuma cidade comprima a participação a ponto de torná-la decorativa.

---

## 6. Envelope em dois níveis (Fix da escassez)

No stage 0, o envelope municipal do ciclo é dividido **antes** da votação, para que a
escassez seja conhecida e o circuit breaker tenha sentido.

```txt
Envelope do ciclo
├─ Porção territorial   = piso igual (todo território) + parcela por carência
│     → vira SUB-ENVELOPE de cada território; o cidadão vota sabendo sua fatia
└─ Porção estruturante  = projetos que cruzam territórios; decididos na matriz (§7)
```

- **Piso igual** garante o princípio "1 território = 1": mesmo o menor território tem
  recurso próprio (kernel: envelope territorial nunca zero).
- **Parcela por carência** realiza a equidade: o território desassistido recebe mais.
  A razão igual/carência é regimento local (default 50/50). Fórmula de carência em
  [ORCAMENTO-PARTICIPATIVO.md](ORCAMENTO-PARTICIPATIVO.md).
- O **circuit breaker (§8/§10)** passa a checar o custo da demanda contra o
  **sub-envelope do território**, não contra um número municipal abstrato.

No 1º ciclo o envelope é valor de **bootstrap** definido pelo Legislativo; nos
ciclos seguintes, é a fração consolidada participativamente no PPA.

---

## 7. Consolidação e matriz (Fix da arena)

Com o envelope já dividido, a matriz **não é arena de territórios competindo pelo
mesmo bolo**. Ela tem três tarefas, nenhuma discricionária:

1. **Consolidar** os vencedores territoriais — cada um já financiado dentro da sua
   fatia. A matriz registra, não re-prioriza.
2. **Alocar a porção estruturante** — grandes projetos que cruzam territórios; aqui a
   carência reentra como critério de prioridade.
3. **Detectar conflito e sinergia** — dois territórios pedindo o mesmo regional viram
   um item mesclado (agrupamento entre territórios).

A carência entra **na divisão do envelope (§6)**, não numa disputa final — o
território pequeno não precisa "ganhar" da capital para existir.

---

## 8. Filtro institucional: admissibilidade vs veto político (Fix da assimetria)

O que hoje é um filtro único do Legislativo é dividido em **dois atos com
consequências diferentes**:

**Filtro de admissibilidade** — lista *fechada* de fundamentos formais:

- inconstitucional ou ilegal;
- fora da competência municipal;
- sem fonte de custeio;
- excede o envelope (mesmo após faseamento);
- depende de outro ente federativo.

Aqui o Legislativo pode filtrar. A saída é a **tabela de retorno (§9)**: reformular,
fork, faseamento ou reivindicação externa. Legítimo, justificado, contestável.

**Veto político** — qualquer recusa **fora** dessa lista. Isto **não é filtro**: é o
Legislativo derrubando o que o povo aprovou. A resposta não é re-votação (seria
infinita) — é **exposição**:

- abre automaticamente um **incidente público de divergência institucional**;
- registra: proposta aprovada pelo povo, recusada pela Câmara, fundamento declarado,
  responsáveis identificados;
- a accountability é política e pública (a próxima eleição), com o registro imutável.

> É democracia monitória aplicada: não se obriga a Câmara a obedecer, mas torna-se
> **impossível ela derrubar a vontade popular em silêncio**. O kernel proíbe o veto
> silencioso, não o veto fundamentado.

---

## 9. Retornos da esteira

Quando algo não avança, o sistema **não encerra** — ele aponta o caminho de volta.

| Problema encontrado | O que não deve acontecer | Caminho correto |
|---|---|---|
| Falta informação | Arquivar sem orientação | Voltar para maturação |
| Demanda duplicada | Apagar a demanda | Agrupar |
| Soluções diferentes | Criar conflito improdutivo | Criar fork |
| Fora do território | Rejeitar sem saída | Reterritorializar ou permitir contestação |
| Custo alto demais | Apenas bloquear | Dividir em fases ou enviar a ciclo plurianual |
| Fora da competência municipal | Apagar | Encaminhar como reivindicação externa |
| Inconstitucional ou ilegal | Deletar | Bloquear com fundamento e permitir reformulação |
| Não teve apoio | Matar definitivamente | Manter como demanda dormente (reentrada §10) |
| Legislativo recusou (formal) | Sumir com a proposta | Devolver com justificativa formal auditável |
| Legislativo recusou (político) | Recusa silenciosa | Incidente público de divergência (§8) |

> Regra geral: **toda negativa gera caminho de correção, fork, recurso ou memória
> pública.**

---

## 10. Execução e aprendizado (Fix da memória)

Participação sem execução é teatro. O ciclo só fecha quando a decisão aprovada vira
**item fiscalizável**, com estados: não iniciada, em planejamento, em licitação, em
execução, atrasada, paralisada, concluída, cancelada, **frustrada**.

E a execução **produz memória mensurável**:

- cada item executado/frustrado escreve no histórico do território com status e data;
- o próximo ciclo **lê** esse histórico:
  - **frustração** dá **reentrada prioritária** à demanda não cumprida;
  - **frustração crônica** **aumenta o peso de carência** do território no próximo
    envelope (§6) — o território mal atendido recebe mais, não menos.
- **demanda dormente** (sem apoio suficiente) fica no backlog do território e
  **ressurge automaticamente** se reatingir o limiar de apoio em ciclo futuro.

Aprendizado deixa de ser palavra e vira número que move o envelope.

---

## 11. Distinção: demanda, proposta, projeto, item institucionalizado

- **Demanda** — o problema bruto. *"Falta médico no PSF do meu bairro."*
- **Proposta** — a demanda amadurecida em solução. *"Escala mínima de clínico geral
  3×/semana no PSF."*
- **Projeto priorizado** — a proposta que venceu a votação territorial / consolidação.
- **Item institucionalizado** — o que entrou no rito formal: Câmara, PPA, LDO, LOA,
  emenda, plano de execução, compromisso oficial.

---

## 12. Agrupamento e fork

Demandas parecidas são **agrupadas** (evita dispersão). Soluções diferentes para o
mesmo problema viram **forks** — a demanda original não morre.

Demanda original: *"Quero uma UTI no PSF do bairro."*

- fork A: ampliar horário de atendimento;
- fork B: criar sala de estabilização;
- fork C: reforçar transporte sanitário;
- fork D: contratar equipe adicional;
- fork E: encaminhar para pactuação regional de saúde.

O Git opera por baixo: a proposta é artefato versionado, com autor, histórico,
alternativas e revisão por pares.

---

## 13. Circuit breaker jurídico-orçamentário

Camada de proteção do protocolo — **não existe para humilhar nem matar
participação**, e sim para impedir que propostas avancem sem compatibilidade mínima
com orçamento, competência ou direitos. Checa o custo contra o **sub-envelope do
território (§6)**.

Respostas possíveis: passa; precisa de informação; precisa ser adaptada; precisa
virar fork; excede o sub-envelope; depende de outro ente; incompatível com regra
constitucional; vai para ciclo plurianual; vira reivindicação externa.

Todo bloqueio tem: fundamento público, explicação simples, possibilidade de
reformulação quando cabível, possibilidade de contestação, registro em auditoria.

---

## 14. Release do ciclo

Versão pública, consolidada e auditável do ciclo. Registra: demandas aprovadas,
propostas priorizadas, territórios beneficiados, vínculo com PPA/LDO/LOA, valores,
prazos, status institucional, hash de auditoria, itens em execução, divergências e
recusas justificadas.

A release **não substitui** o ato oficial publicado — é o registro público e
auditável. Havendo divergência entre o sistema e o ato oficial, abre-se **incidente
público de divergência institucional**.

---

## 15. Auditoria e privacidade (resumo — detalhe em doc próprio)

- toda ação relevante gera evento na **cadeia de hash encadeada**;
- o **sorteio do conselho** é auditável: hash da lista de inscritos + seed pública e
  imprevisível, registrados antes do resultado;
- dados pessoais (CPF, voto individual, denúncia, contestação sensível) ficam
  **criptografados, fora da blockchain**; a blockchain guarda **apenas hash**;
- acesso a conteúdo sigiloso exige **rito formal** e **gera auditoria**.

Detalhe em [BLOCKCHAIN-E-AUDITORIA.md](BLOCKCHAIN-E-AUDITORIA.md).

---

## 16. Síntese

```txt
O cidadão abre uma demanda simples.
O território (em conselho sorteado, ou em assembleia) amadurece.
O sistema filtra por protocolo; o povo qualifica por apoio.
A comunidade vota dentro da sua fatia conhecida do orçamento.
A matriz consolida o que já está financiado e aloca o estruturante.
O Legislativo institucionaliza — e qualquer veto político fica público.
A execução é fiscalizada com prazo.
O próximo ciclo aprende: a frustração move o envelope.
```

A diferença para a esteira anterior: ela confiava em bons sorteados e num Legislativo
bem-intencionado. Esta **distribui o poder** (protocolo, povo, colegiado, instituição)
e torna **todo desvio visível e custoso**.

---

## 17. Decisões em aberto (o martelo é local, dentro da faixa comum)

Estes pontos **não** são valores fixos: são **faixas comuns** a serem fechadas no
protocolo (piso/teto) e **números a serem escolhidos por cada município** dentro
delas (regimento local). Ver [lacunas.md](lacunas.md).

- faixas exatas de cada parâmetro da tabela §1.2 (piso/teto que o protocolo trava);
- fórmula e limites do **índice de carência** (ver ORCAMENTO-PARTICIPATIVO);
- existência e valor de **ajuda de custo** ao sorteado (sem ela, o sorteio pode
  excluir o vulnerável — risco 🔴 do lacunas);
- regra para **inscrito único** no sorteio (aclamação condicionada? mandato reduzido?);
- evento(s) a serem **ancorados externamente** (matriz? release? sorteio?);
- rito de **registro de divergência** entre o sistema e o ato oficial.
