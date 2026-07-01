# Código Público: Arquitetura Constitucional em Software para Orçamento Participativo Municipal

## Code is Law como Infraestrutura Democrática — Sorteio Cívico, Contrapúblicos Territoriais e Accountability por Exposição

---

**Autores:** Dionatan Resende; Diego [sobrenome]

**Área:** Ciência Política Computacional / Governança Digital / Democracia Participativa

**Palavras-chave:** Orçamento Participativo; democracia digital; sorteio cívico; contrapúblicos subalternos; code is law; mini-públicos deliberativos; governança de comuns; accountability; blockchain; privacidade contextual

---

## Resumo

Este artigo apresenta o Código Público, uma infraestrutura digital aberta, auditável e parametrizável de Orçamento Participativo (OP) municipal. O sistema traduz princípios de teoria política — contrapúblicos subalternos (Fraser), sorteio democrático (Manin), mini-públicos deliberativos (Fishkin), governança policêntrica de comuns (Ostrom), proceduralismo epistêmico (Estlund), justiça distributiva (Rawls), capabilities (Sen e Nussbaum), não-dominação republicana (Pettit), democracia monitória (Keane) e privacidade contextual (Nissenbaum) — em regras operacionais implementadas em código. A tese central é que a arquitetura técnica pode funcionar como constituição institucional (Lessig): estados, filtros, faixas de parâmetros, cadeias de hash e âncoras externas substituem a confiança interpessoal por verificabilidade matemática. O artigo descreve a esteira completa — do problema territorial bruto à execução fiscalizada e ao aprendizado do ciclo seguinte — e analisa criticamente o sistema à luz dos cinco critérios democráticos de Dahl, identificando a inclusão como tensão central não resolvida. Conclui que a codificação de regras institucionais em software livre e auditável representa uma contribuição original à literatura de democracia participativa digital, distinta tanto das plataformas de participação consultiva quanto das organizações autônomas descentralizadas (DAOs), ao ancorar governança digital numa jurisdição real e em identidade civil verificada.

**Palavras-chave:** Orçamento Participativo. Democracia digital. Sorteio cívico. Code is law. Mini-públicos. Governança de comuns. Accountability. Privacidade contextual.

---

## Abstract

This paper introduces Código Público, an open, auditable, and parameterizable digital infrastructure for municipal Participatory Budgeting (PB). The system translates political theory principles — subaltern counterpublics (Fraser), democratic sortition (Manin), deliberative mini-publics (Fishkin), polycentric commons governance (Ostrom), epistemic proceduralism (Estlund), distributive justice (Rawls), capabilities (Sen and Nussbaum), republican non-domination (Pettit), monitory democracy (Keane), and contextual integrity (Nissenbaum) — into operational rules implemented in code. The central thesis is that technical architecture can function as institutional constitution (Lessig): states, filters, parameter ranges, hash chains, and external anchors replace interpersonal trust with mathematical verifiability. The article describes the complete pipeline — from raw territorial problem to audited execution and next-cycle learning — and critically analyzes the system against Dahl's five democratic criteria, identifying inclusion as the central unresolved tension. It concludes that codifying institutional rules in free, auditable software represents an original contribution to the literature on digital participatory democracy, distinct from both consultative participation platforms and Decentralized Autonomous Organizations (DAOs), by anchoring digital governance in a real jurisdiction and verified civil identity.

**Keywords:** Participatory Budgeting. Digital democracy. Civic sortition. Code is law. Mini-publics. Commons governance. Accountability. Contextual privacy.

---

## 1. Introdução

O Orçamento Participativo (OP) é, desde a experiência pioneira de Porto Alegre em 1989, uma das inovações democráticas mais estudadas e replicadas do mundo (Avritzer, 2003; Sintomer, Herzberg & Röcke, 2008; Wampler, 2007). Sua promessa é direta: transferir ao cidadão parte da decisão sobre a alocação de recursos públicos municipais. Sua frustração também é recorrente: a participação morre antes de entrar no orçamento, dentro de uma triagem invisível ou depois da aprovação, sem execução acompanhável.

A digitalização do OP, quando ocorre, costuma reproduzir dois padrões insuficientes. O primeiro é a **plataforma consultiva**: o cidadão vota em prioridades, mas o resultado não é vinculante, a triagem é opaca e a execução não é rastreada. O segundo é a **organização autônoma descentralizada (DAO)**: regras em blockchain, mas governança plutocrática (1 token = 1 voto), sem ancoragem em jurisdição real e sem resistência a identidades falsas (ataque Sybil). Nenhum dos dois resolve o problema central: **como transformar uma demanda territorial simples em decisão orçamentária rastreável, executável e aprendível — com regras públicas, auditáveis e contestáveis?**

Este artigo apresenta o Código Público, uma infraestrutura digital que propõe uma terceira via. A tese central é que a **arquitetura técnica pode funcionar como constituição institucional** (Lessig, 1999): não apenas uma ferramenta que auxilia o processo, mas parte do rito democrático. Estados da esteira são regras institucionais; filtros são camadas de maturidade testáveis; parâmetros locais são confinados a faixas com piso e teto; cadeias de hash tornam a adulteração detectável; âncoras externas tornam a reescrita do passado impossível de esconder.

O artigo está organizado da seguinte forma. A Seção 2 apresenta o referencial teórico em nove eixos. A Seção 3 descreve a arquitetura institucional do sistema. A Seção 4 detalha os mecanismos de design que traduzem teoria em operação. A Seção 5 avalia criticamente o sistema à luz dos critérios de Dahl. A Seção 6 discute limitações e tensões não resolvidas. A Seção 7 conclui.

---

## 2. Referencial Teórico

O Código Público não é apenas um sistema com fundamentação teórica — é um sistema onde **cada mecanismo é derivação operacional de um conceito político**. Esta seção apresenta os nove eixos teóricos que sustentam o desenho, nomeando em cada caso o que a teoria resolve e o que ela deixa em aberto.

### 2.1 Code is law — Lawrence Lessig

Lessig (1999) argumenta que a arquitetura técnica regula comportamento com a mesma eficácia que leis, mercados e normas sociais. O código não precisa de consentimento explícito para regular: quem controla a arquitetura controla o comportamento possível. No Código Público, essa tese é deliberadamente invertida: a arquitetura é aberta, auditável e parametrizável — para que a regulação seja **visível e contestável**, não invisível e arbitrária.

O `policy.go` é texto constitucional; os `*_policy_test.go` são controle de constitucionalidade. Estados, filtros, limiares de apoio, quóruns e faixas de parâmetros não são detalhes de implementação — são **regras institucionais codificadas**. A distinção entre kernel comum (regras invioláveis) e regimento local (parâmetros calibráveis) é a expressão de Lessig em software: o código é lei, mas lei revisável, testável e com limites explícitos.

### 2.2 Contrapúblicos subalternos — Nancy Fraser

Fraser (1990) critica a esfera pública única de Habermas por excluir os subalternos. A resposta são os **contrapúblicos subalternos**: espaços onde grupos marginalizados formulam suas demandas na sua própria linguagem, antes de competir na arena pública geral.

No Código Público, cada território é um contrapúblico fraseriano. A regra `1 território = 1 representação` garante que periferias, zonas rurais e comunidades pequenas existam politicamente no OP. O envelope dividido em dois níveis (piso igual + parcela por carência) dá ao contrapúblico **recurso próprio**: o território não precisa vencer a capital para deliberar — ele delibera dentro da sua fatia conhecida do orçamento.

O limite: o contrapúblico pressupõe a capacidade de **entrar**. Sem acesso digital, sem alfabetização funcional ou sob dominação local, o território pode existir no sistema e não existir na vida das pessoas. A UI que traduz a constituição interna em linguagem comum é condição de possibilidade.

### 2.3 Produção entre pares e epistemologia do fork — Yochai Benkler

Benkler (2006) descreve a **produção entre pares baseada em comuns** como terceiro modo de organização — nem hierarquia, nem mercado — que funciona quando as contribuições são modulares, granulares e de baixo custo de integração.

O Git não é apenas metáfora no Código Público: é **epistemologia política**. A demanda deixa de ser oráculo e vira artefato versionado, falível e forkável — com autor, histórico, alternativas e revisão por pares. Uma demanda inviável não morre: vira forks mais viáveis. O agrupamento de demandas similares e a criação de soluções alternativas (forks) são mecanismos benklearianos: contribuições modulares, de baixo custo, integráveis por protocolo.

A evolução do protocolo reforçou essa leitura com os **dois portões de aptidão**: o portão A é protocolar (o sistema decide objetivamente), o portão B é popular (a comunidade decide por apoio). Modularidade, granularidade e integração automática — Benkler em operação.

### 2.4 Sorteio democrático — Bernard Manin e Hélène Landemore

Manin (1997) demonstra que a eleição é, por natureza, **aristocrática**: seleciona os percebidos como superiores. Em Atenas, o método democrático era o sorteio; a eleição era o método oligárquico. Landemore (2020) reforça: representação aberta, rotativa e não-eleitoral pode ser mais legítima que o filtro eleitoral.

No Código Público, o conselho territorial (3–7 membros) é selecionado por inscrição e **sorteio auditável** entre cidadãos com vínculo territorial validado. A semente vem de fonte pública e futura que o operador não controla; o hash da lista elegível é publicado antes do resultado; o sorteio é reproduzível e verificável. A legitimidade tem duas fontes: **origem** (aleatoriedade pura, incapturável) e **exercício** (mandato limitado, justificativa, recurso, recall, auditoria).

### 2.5 Mini-públicos deliberativos — James Fishkin

Fishkin (2009, 2018) demonstrou empiricamente que **mini-públicos** — grupos de cidadãos comuns, selecionados aleatoriamente e informados sobre o tema — produzem decisões mais ponderadas que votações diretas desinformadas ou que delegação a especialistas.

A passagem do Maintainer Territorial individual para o **conselho colegiado de 3–7 sorteados** é uma escolha fiskiniana: a qualidade da decisão vem do processo deliberativo entre iguais, não da expertise individual. A colegialidade garante pluralidade de perspectivas, a justificativa obrigatória força a deliberação, e a rotação por ciclo assegura diversidade temporal.

A diferença: nos *deliberative polls* de Fishkin, os participantes deliberam por dias intensivos sobre um tema nacional; no Código Público, o conselho opera ao longo de todo o ciclo sobre os problemas concretos do seu próprio território. É deliberação enraizada no cotidiano.

O limite: mini-públicos são tão bons quanto a informação que recebem. A esteira de maturação (apoio, complementos, evidências, filtragem protocolar) é a resposta de design.

### 2.6 Proceduralismo epistêmico — David Estlund

Estlund (2008) dissolve o falso dilema entre legitimidade formal ("seguiu o rito") e legitimidade epistêmica ("o resultado é bom"): um procedimento é legítimo quando é **justo** *e* **tende a acertar mais que as alternativas** — sem nunca garantir o acerto (falibilismo).

A esteira de maturação do OP é proceduralismo epistêmico em operação: a demanda que chega à votação passou por filtro protocolar *e* apoio popular *e* deliberação colegiada para o ambíguo. O procedimento não garante o acerto, mas multiplica as chances de que o resultado seja defensável.

### 2.7 Governança de comuns e policentrismo — Elinor Ostrom

Ostrom (1990) demonstra que comunidades podem governar recursos compartilhados sem privatização nem controle estatal centralizado, desde que criem regras adaptadas ao contexto local. O insight premiado com o Nobel é o **policentrismo**: cada comum escreve as próprias regras.

No Código Público, a expressão operacional é a separação entre **kernel comum** (regras invioláveis: território com voz, sorteio, mandato temporário, privacidade, auditoria) e **regimento local** (parâmetros calibráveis: calendário, mandato, quórum, envelope, índice de carência). A inovação é a **tabela de faixas com piso e teto**: o município escolhe o número; não escolhe se a regra existe. Um mandato de 10 anos burlaria a rotação; um quórum de recall de 90% o tornaria impossível — as faixas impedem.

A regra é comum, o número é local. É Ostrom codificada.

### 2.8 Justiça distributiva e capabilities — John Rawls, Amartya Sen e Martha Nussbaum

O envelope em dois níveis opera o **princípio da diferença** de Rawls (1971): desigualdade na distribuição só é justa se beneficia os menos favorecidos. O piso igual garante igualdade formal; a parcela por carência realiza equidade rawlsiana.

A questão seguinte é: **o que a carência mede?** Se mede apenas renda, perde dimensões essenciais. Sen (1999) e Nussbaum (2011) oferecem a resposta: importa não o que as pessoas *têm*, mas o que elas **podem ser e fazer** — suas capacidades reais. O índice de carência deve ser multidimensional: saúde, educação, saneamento, transporte, segurança, moradia, renda e histórico de frustração no OP.

O limite: a abordagem de capabilities é exigente em dados. No primeiro ciclo, o índice pode ser proxy simplificado; nos ciclos seguintes, a própria execução do OP gera dados que o alimentam. A carência é autoevolutiva — mas o bootstrap é necessariamente imperfeito.

### 2.9 Não-dominação, democracia monitória e privacidade contextual — Pettit, Keane, Nissenbaum

Três teorias convergem na camada de vigilância e proteção do sistema.

**Philip Pettit** (1997, 2012): liberdade é ausência de dominação — poder arbitrário sobre você. O *eyeball test*: você é livre quando pode encarar quem tem poder sobre você sem medo. As salvaguardas do Código Público (mandato, colegialidade, recall, justificativa, auditoria, impossibilidade de apagar histórico) combatem o *imperium* (dominação pública). A denúncia sigilosa combate o *dominium* (dominação privada — patrão, milícia, clientelismo).

**John Keane** (2009): poder legítimo é poder continuamente monitorado. A cadeia de hash encadeada torna a adulteração detectável; a âncora externa (Diário Oficial, blockchain pública) torna a reescrita do passado impossível de esconder. O incidente público de divergência institucional — ativado quando o Legislativo veta fora dos fundamentos formais — é monitoramento não só da infraestrutura, mas do **poder político**.

**Helen Nissenbaum** (2009): privacidade não é segredo — é integridade contextual. No OP, os contextos e suas normas são distintos: o voto exige sigilo absoluto (liberdade de consciência); o filtro exige transparência radical (accountability do poder); a denúncia exige proteção (segurança de quem contesta). Blockchain guarda hash, nunca dado pessoal.

---

## 3. Arquitetura Institucional

### 3.1 A esteira do OP

O Código Público organiza o Orçamento Participativo como uma **esteira de produção cívica** com 17 estágios e retornos controlados:

```
0   Calendário publicado + envelope dividido
1   Cadastro + vínculo territorial
2   Inscrição + sorteio do conselho territorial (3–7)
3   Demanda simples
4   Apoio / não-apoio → limiar de maturação popular
5   Agrupamento / fork → conselho facilita
6   Maturação territorial
7   Filtro territorial protocolar → Portão A (sistema) + Portão B (apoio)
8   Circuit breaker jurídico-orçamentário → custo vs sub-envelope
9   Demanda apta
10  Votação territorial → dentro da fatia do território
11  Consolidação: territorial + matriz estruturante
12  Filtro institucional → admissibilidade formal | veto político → incidente
13  Institucionalização na Câmara (PPA / LDO / LOA)
14  Release do ciclo
15  Execução fiscalizada
16  Aprendizado → memória → ajusta carência e reentrada
```

A esteira não é linear: é uma linha de produção com **retornos controlados**. Quando algo não avança, o sistema não encerra — aponta o caminho de volta: voltar para maturação, agrupar, criar fork, fasear, enviar para ciclo plurianual, encaminhar como reivindicação externa. A regra do kernel comum é: **toda negativa gera caminho de correção, fork, recurso ou memória pública.**

### 3.2 Papéis institucionais

O sistema distribui poder entre quatro atores com responsabilidades e limites explícitos:

**Maintainer Geral (Legislativo municipal):** abre o ciclo, define calendário e envelope, recebe a matriz consolidada, conduz a institucionalização. Pode aplicar filtro de admissibilidade com fundamento formal. Não pode vetar silenciosamente — veto fora dos fundamentos formais abre incidente público.

**Maintainer Técnico (TI institucional):** opera a infraestrutura. Configura parâmetros aprovados, garante disponibilidade, segurança e auditoria. Não decide mérito político.

**Conselho Territorial (3–7 cidadãos sorteados):** facilita o território — organiza, convoca, registra, orienta agrupamento e fork, pede complementação. Decide apenas os casos genuinamente ambíguos do filtro territorial, por maioria e com justificativa pública. Não governa; não apaga histórico; não rejeita por opinião pessoal.

**Cidadão Territorial:** cadastra-se, cria vínculo territorial, abre demandas, apoia, comenta, vota e fiscaliza.

### 3.3 Regra comum vs. regra local

O sistema opera em duas camadas, seguindo o policentrismo de Ostrom:

O **kernel comum** é a lista de regras invioláveis: nenhum território sem voz; mandato sempre temporário; sorteio auditável; filtro com justificativa; voto sigiloso; recall sempre possível; envelope territorial nunca zero; dado pessoal nunca em blockchain; alteração invisível de histórico proibida; veto silencioso proibido.

O **regimento local** é a tabela de parâmetros calibráveis, cada um com faixa (piso–teto) definida pelo protocolo: tamanho do conselho (3–7), limiar de apoio (1%–10%), quórum de votação (5%–25%), quórum de recall (15%–40%), razão igual/carência do envelope (30/70 a 70/30), janela de maturação (≥ 21 dias), janela de votação (≥ 7 dias), porção estruturante (0%–40%).

A faixa existe para impedir que o parâmetro burle o kernel. O município escolhe o número; não escolhe se a regra existe.

### 3.4 Evolução da nomenclatura institucional

O sistema distingue quatro estágios de amadurecimento da participação cidadã:

**Demanda** — o problema bruto. *"Falta médico no PSF do meu bairro."*

**Proposta** — a demanda amadurecida em solução. *"Escala mínima de clínico geral 3×/semana no PSF."*

**Projeto priorizado** — a proposta que venceu a votação territorial ou a consolidação.

**Item institucionalizado** — o que entrou no rito formal: PPA, LDO, LOA, emenda, plano de execução, compromisso oficial.

---

## 4. Mecanismos de Design: Da Teoria à Operação

Esta seção detalha os seis mecanismos de design que traduzem os princípios teóricos em operação técnica.

### 4.1 O sorteio auditável

O sorteio do conselho territorial é o mecanismo de seleção central. Seu design responde a dois requisitos simultâneos: **legitimidade democrática** (Manin) e **verificabilidade técnica** (Keane).

O fluxo é:

1. O Maintainer Geral abre o período de inscrição com convite ativo.
2. Cidadãos com vínculo territorial validado se inscrevem.
3. O sistema publica o hash da lista de elegíveis **antes** do sorteio.
4. Uma seed pública e imprevisível é definida (fonte futura que o operador não controla).
5. O algoritmo determinístico sorteia titular e suplentes.
6. Resultado publicado; janela de contestação aberta.
7. Confirmação do conselho; registro completo em audit log.

A verificabilidade é matemática: qualquer cidadão pode reproduzir o sorteio a partir da lista publicada e da seed pública. A adulteração da lista quebraria o hash publicado antes; a manipulação da seed exigiria controlar uma fonte pública futura.

Cenários limítrofes: se houver apenas uma pessoa inscrita, aclamação condicionada com janela de contestação e checagem de impedimentos. Se não houver inscritos, o território opera em **modo-assembleia** (decisões abertas da comunidade vinculada) até que haja inscritos — o Maintainer Geral pode zelar proceduralmente, nunca decidir mérito.

### 4.2 O envelope em dois níveis

O envelope municipal do ciclo é dividido **antes** da votação, para que a escassez seja conhecida e o circuit breaker tenha sentido:

```
Envelope do ciclo
├─ Porção territorial   = piso igual + parcela por carência
│     → vira sub-envelope de cada território
└─ Porção estruturante  = projetos que cruzam territórios
```

O **piso igual** garante que nenhum território fique sem recurso — é a igualdade formal rawlsiana. A **parcela por carência** distribui mais para quem precisa mais — é o princípio da diferença. A razão entre as duas parcelas é regimento local (default 50/50, faixa 30/70 a 70/30).

O cidadão vota sabendo **quanto seu território tem disponível**. A escassez é informação deliberativa, não surpresa pós-votação. O circuit breaker checa o custo contra o sub-envelope do território, não contra um número municipal abstrato.

No primeiro ciclo, o envelope é valor de bootstrap definido pelo Legislativo; nos ciclos seguintes, é a fração consolidada participativamente no PPA.

### 4.3 Os dois portões de aptidão

A "demanda apta" não depende do julgamento de ninguém. Ela atravessa dois portões que não dependem de pessoa:

**Portão A — protocolar (o sistema decide):** a demanda é do território declarado? Não é duplicada? Tem informação mínima? É competência pública?

**Portão B — popular (a comunidade decide):** atingiu o limiar de apoio para maturação (regimento local)?

Só o caso genuinamente ambíguo — "é do território?" ou "é público?" como questão disputável — sobe ao conselho colegiado, por maioria e com justificativa pública.

Esse design elimina o **porteiro discricionário**: nenhum indivíduo decide sozinho se uma demanda popular existe ou não. É a resposta de design ao risco de tecnocracia como portão (Fraser) e ao proceduralismo epistêmico (Estlund): o procedimento qualifica sem retirar a voz.

### 4.4 O filtro institucional com incidente público

O mecanismo mais original do sistema é a divisão do filtro institucional em **dois atos com consequências diferentes**:

**Filtro de admissibilidade** — lista *fechada* de fundamentos formais: inconstitucional, fora da competência, sem fonte de custeio, excede o envelope, depende de outro ente. Aqui o Legislativo pode filtrar legitimamente, com retorno para o território.

**Veto político** — qualquer recusa fora dessa lista. A resposta não é re-votação (seria infinita) nem obediência forçada (seria inconstitucional). É **exposição**: um incidente público de divergência institucional abre automaticamente, registrando proposta aprovada pelo povo, recusada pela Câmara, fundamento declarado, responsáveis identificados, registro imutável na cadeia de hash.

É democracia monitória (Keane) operacionalizada: não se obriga o poder a obedecer, mas torna-se impossível ele agir em silêncio. O kernel proíbe o veto silencioso, não o veto fundamentado.

A accountability é política e pública: a próxima eleição decide. O sistema cria a prova; a democracia precisa de quem a leia.

### 4.5 A cadeia de auditoria e as âncoras externas

Cada evento relevante gera um `audit_event` na cadeia de hash encadeada:

```
prev_hash  = hash do evento anterior
event_hash = SHA-256(prev_hash | ator | ação | entidade | metadata)
```

Alterar o passado quebra a cadeia — a adulteração é matematicamente detectável.

Âncoras externas (Diário Oficial, blockchain pública) ancoram hashes em repositórios imutáveis por design. Podem ser ancorados: hash da lista do sorteio, seed pública, hash do resultado, matriz do OP, release do ciclo, eventos de execução. **Nunca** são ancorados: CPF, nome, endereço, voto individual, denúncia identificável, dado sensível.

A blockchain serve como **cartório de integridade**, não como banco de dados. É a resposta ao *quis custodiet ipsos custodes*: no topo da hierarquia não há instância superior para apelar — a resposta é matemática, não institucional.

### 4.6 O aprendizado como variável do envelope

O ciclo não termina na votação. Cada item aprovado vira **item fiscalizável** com estados: não iniciada, em planejamento, em licitação, em execução, atrasada, paralisada, concluída, cancelada, frustrada.

A execução produz **memória mensurável**:

- Frustração dá reentrada prioritária à demanda não cumprida no próximo ciclo.
- Frustração crônica aumenta o peso de carência do território no próximo envelope — o território mal atendido recebe mais, não menos.
- Demanda dormente (sem apoio suficiente) fica no backlog e ressurge automaticamente se reatingir o limiar de apoio.

O aprendizado deixa de ser retórica e vira **número que move o envelope**. É a diferença entre prometer que o próximo ciclo vai aprender e obrigar que ele aprenda.

---

## 5. Análise Crítica: O Teste de Dahl

Robert Dahl (1989) define cinco critérios de um processo democrático. Utilizamos essa grade como instrumento de autoavaliação do sistema:

### 5.1 Participação efetiva

**Avaliação: forte, com ressalvas.**

O sistema garante que todo cidadão com vínculo territorial pode demandar, apoiar, comentar, votar e fiscalizar. O conselho colegiado (3–7) reduz o risco de território sem facilitador. O modo-assembleia garante que território sem inscritos para o sorteio não fica mudo.

A ressalva é que a participação efetiva depende de acesso digital, letramento funcional e ausência de coerção local. O sistema pode garantir o direito formal e não garantir a capacidade real (Sen, 1999).

### 5.2 Igualdade de voto

**Avaliação: forte.**

O voto é sigiloso, individual e igualitário. O envelope dividido em sub-envelopes territoriais garante que cada território vota sobre recurso real, não sobre promessa abstrata. A ponderação por vínculo territorial (escala T0–T5) na priorização é compensada pela igualdade estrita na votação territorial.

### 5.3 Entendimento esclarecido

**Avaliação: diferencial do sistema.**

A esteira de maturação (demanda → apoio → complemento → fork → filtro → conselho → votação) é uma tentativa de criar as condições para deliberação informada. Os dois portões de aptidão (protocolar + popular) e a deliberação colegiada para o ambíguo reforçam o proceduralismo epistêmico. A linguagem dupla (técnica no backend, cidadã na UI) é condição de acessibilidade.

### 5.4 Controle da agenda

**Avaliação: forte, reforçado.**

A demanda nasce do cidadão, não da pauta institucional. O filtro institucional com lista fechada de fundamentos impede que o Legislativo controle a agenda por omissão. O veto político abre incidente público — a agenda popular não desaparece em silêncio.

### 5.5 Inclusão dos adultos

**Avaliação: o ponto fraco central.**

O vínculo territorial é condição de participação plena. Ele garante resistência a Sybil (uma pessoa, um voto) e ancoragem territorial. Mas também é barreira de entrada: quem não tem documento, quem não acessa gov.br, quem não tem endereço formal, quem vive em situação irregular — todos são excluídos.

A tensão é estrutural: abrir mão do vínculo enfraquece a Sybil-resistência e a ancoragem territorial; mantê-lo exclui os mais vulneráveis. Mansbridge (1999) mostra que essa exclusão se concentra onde mais importa: entre os subalternos que o sistema mais quer servir.

É a contradição que define o futuro do projeto.

---

## 6. Discussão: Limitações e Tensões Não Resolvidas

### 6.1 O trade-off entre representação descritiva e incapturabilidade do sorteio

Pitkin (1967) distingue representação descritiva (parece com quem representa) de substantiva (age pelos interesses). O sorteio puro privilegia a substantiva e a formal, mas não garante a descritiva. O conselho colegiado mitiga parcialmente (5 sorteados espelham mais que 1), mas não resolve: um conselho de 5 pode, por azar, não incluir mulheres, jovens, idosos ou minorias.

A alternativa — cotas — reintroduz o vetor de captura (quem decide quais grupos entram?). O projeto optou pela neutralidade incapturável do sorteio puro, com monitoramento estatístico do espelhamento ao longo dos ciclos. É trade-off declarado, não resolvido.

### 6.2 O problema do alarme

Recall, contestação e denúncia são alarmes de incêndio (McCubbins & Schwartz, 1984). Mas fiscalizar é bem público, e atores dispersos o sub-provêm (Olson, 1965). O risco real não é o alarme ser puxado demais — é **nunca ser puxado**.

Falta um ator com incentivo estrutural para fiscalizar. Na prática real do OP, o monitoramento eficaz é feito por subconjuntos organizados (associações, observatórios, conselhos, imprensa local). Dar status institucional a esses atores-alarme é trabalho em aberto.

### 6.3 A accountability por exposição depende de audiência

O incidente público de divergência é exposição — mas exposição só funciona se alguém vê. Se a página pública de divergências não tiver audiência, o veto político é registrado no sistema mas invisível na cidade. O sistema cria a prova; a democracia precisa de quem a leia.

### 6.4 A privacidade contextual tem casos limítrofes

Nissenbaum (2009) define privacidade como fluxo de informação conforme as normas do contexto. Mas há casos onde o contexto é disputável: uma contestação de vínculo territorial é contexto de poder (deveria ser pública) ou de vulnerabilidade (deveria ser protegida)? O protocolo precisa resolver esses limítrofes caso a caso.

### 6.5 A escala institucional não é a escala técnica

O código escala por fork e deploy. A confiança escala por reputação, adoção e verificação. Quando múltiplos municípios adotarem o kernel, a governança do próprio kernel precisará de institucionalização — consórcio, fundação ou comunidade de prática com rito próprio (Hooghe & Marks, 2001). Sem piloto bem-sucedido, o federalismo do kernel é teoria.

### 6.6 A dependência do Estado

A identidade forte via gov.br é resistência a Sybil e ancoragem em jurisdição real. Mas reintroduz dependência do Estado — o mesmo Estado cujo poder o sistema pretende monitorar. No contexto OP, a tensão é aceitável (o OP já é política pública, o Estado é operador legítimo). Fora desse contexto, seria contradição.

### 6.7 A lacuna entre teoria e implementação

A teoria avançou significativamente; o protocolo está documentado com rigor. Mas a implementação em código está em progresso. O sistema atual ainda carrega o modelo anterior (Lei Orgânica → issue → PR cívico) em partes do frontend. A migração para o eixo OP (ciclo → território → demanda → proposta → votação → matriz → execução) é a distância que define o roadmap técnico.

---

## 7. Contribuição Original e Posicionamento

O Código Público se posiciona numa lacuna específica da literatura:

**Não é plataforma consultiva.** Plataformas como Decidim, Consul ou Pol.is permitem deliberação e votação, mas geralmente não codificam a esteira orçamentária completa, não dividem envelope por território, não implementam sorteio auditável com hash publicado, e não criam incidentes públicos de divergência institucional.

**Não é DAO.** Organizações autônomas descentralizadas operam governança em blockchain, mas degeneram em plutocracia (1 token = 1 voto), não resistem a Sybil sem identidade civil, e não se ancoram em jurisdição real. O Código Público é deliberadamente não-plutocrático: o peso vem do vínculo territorial, nunca do capital.

**Não é e-gov tradicional.** Sistemas de governo eletrônico digitalizam processos existentes. O Código Público propõe que a **arquitetura técnica é parte do rito institucional** — não ferramenta para um rito que existe sem ela.

A contribuição original é a **codificação de regras institucionais em software livre e auditável**, onde:

- cada mecanismo é derivação operacional de um conceito político explícito;
- a confiança é substituída por verificabilidade matemática;
- o poder é distribuído entre protocolo, povo, colegiado e instituição;
- todo desvio é visível e custoso;
- a execução produz memória que move o próximo ciclo.

---

## 8. Conclusão

O Código Público aposta que a arquitetura é constituição (Lessig): território como contrapúblico com recurso próprio (Fraser), entrada sem barreira e forkável (Benkler), seleção por sorteio democrático em conselho colegiado (Manin + Fishkin) com identidade forte e não-plutocrática (anti-Sybil), decisão por procedimento que tende a acertar (Estlund) sob maturação deliberativa (Habermas parcial), regras comuns e parâmetros locais em faixas (Ostrom), recurso distribuído por justiça distributiva (Rawls) medida em capabilities multidimensionais (Sen + Nussbaum), poder limitado e contestável (Pettit) protegido até do *dominium* (denúncia sigilosa), privacidade como integridade contextual (Nissenbaum), filtro institucional que expõe o veto político (McCubbins & Schwartz), vigiado por matemática e democracia monitória (Keane), execução que vira aprendizado mensurável (Fung), governança multinível para escala (Hooghe & Marks) — e tudo aferido pelos critérios de Dahl, com a **inclusão** como o desafio que ainda não vencemos.

O sistema não é apenas um app para votar. É uma tentativa de demonstrar que **regras públicas implementadas em código podem reduzir arbitrariedade, captura e invisibilidade na decisão orçamentária municipal** — sem prometer vencer o que nenhum sistema vence sozinho.

A honestidade exige reconhecer que a teoria avançou mais que a implementação, que a inclusão permanece como tensão central, que a accountability por exposição depende de audiência, e que o federalismo do kernel é promessa sem piloto. Mas a aposta permanece: se o código é lei, então a lei pode ser aberta, auditável, testável e contestável — e essa é uma contribuição que a democracia participativa digital ainda não havia tentado com esse grau de rigor.

---

## Referências

AVRITZER, Leonardo. Democracy and the Public Space in Latin America. Princeton: Princeton University Press, 2002.

BENKLER, Yochai. *The Wealth of Networks: How Social Production Transforms Markets and Freedom*. New Haven: Yale University Press, 2006.

BUTERIN, Vitalik; WEYL, E. Glen; OHLHAVER, Puja. Decentralized Society: Finding Web3's Soul. *SSRN*, 2022.

COHEN, Julie E. *Between Truth and Power: The Legal Constructions of Informational Capitalism*. New York: Oxford University Press, 2019.

DAHL, Robert A. *Democracy and Its Critics*. New Haven: Yale University Press, 1989.

DOUCEUR, John R. The Sybil Attack. In: *Peer-to-Peer Systems*. Springer, 2002. p. 251–260.

ESTLUND, David M. *Democratic Authority: A Philosophical Framework*. Princeton: Princeton University Press, 2008.

FISHKIN, James S. *When the People Speak: Deliberative Democracy and Public Consultation*. Oxford: Oxford University Press, 2009.

FISHKIN, James S. *Democracy When the People Are Thinking: Revitalizing Our Politics Through Public Deliberation*. Oxford: Oxford University Press, 2018.

FRASER, Nancy. Rethinking the Public Sphere: A Contribution to the Critique of Actually Existing Democracy. *Social Text*, n. 25/26, p. 56–80, 1990.

FUNG, Archon. Empowered Participation: Reinventing Urban Democracy. Princeton: Princeton University Press, 2004.

HABERMAS, Jürgen. *Between Facts and Norms: Contributions to a Discourse Theory of Law and Democracy*. Tradução de William Rehg. Cambridge: MIT Press, 1996.

HOOGHE, Liesbet; MARKS, Gary. *Multi-Level Governance and European Integration*. Lanham: Rowman & Littlefield, 2001.

KEANE, John. *The Life and Death of Democracy*. London: Simon & Schuster, 2009.

LANDEMORE, Hélène. *Open Democracy: Reinventing Popular Rule for the Twenty-First Century*. Princeton: Princeton University Press, 2020.

LESSIG, Lawrence. *Code and Other Laws of Cyberspace*. New York: Basic Books, 1999.

MANIN, Bernard. *The Principles of Representative Government*. Cambridge: Cambridge University Press, 1997.

MANSBRIDGE, Jane. Should Blacks Represent Blacks and Women Represent Women? A Contingent "Yes". *The Journal of Politics*, v. 61, n. 3, p. 628–657, 1999.

McCUBBINS, Mathew D.; SCHWARTZ, Thomas. Congressional Oversight Overlooked: Police Patrols versus Fire Alarms. *American Journal of Political Science*, v. 28, n. 1, p. 165–179, 1984.

NISSENBAUM, Helen. *Privacy in Context: Technology, Policy, and the Integrity of Social Life*. Stanford: Stanford University Press, 2009.

NUSSBAUM, Martha C. *Creating Capabilities: The Human Development Approach*. Cambridge: Harvard University Press, 2011.

OLSON, Mancur. *The Logic of Collective Action: Public Goods and the Theory of Groups*. Cambridge: Harvard University Press, 1965.

OSTROM, Elinor. *Governing the Commons: The Evolution of Institutions for Collective Action*. Cambridge: Cambridge University Press, 1990.

PETTIT, Philip. *Republicanism: A Theory of Freedom and Government*. Oxford: Oxford University Press, 1997.

PETTIT, Philip. *On the People's Terms: A Republican Theory and Model of Democracy*. Cambridge: Cambridge University Press, 2012.

PITKIN, Hanna F. *The Concept of Representation*. Berkeley: University of California Press, 1967.

RAWLS, John. *A Theory of Justice*. Cambridge: Harvard University Press, 1971.

SEN, Amartya. *Development as Freedom*. New York: Knopf, 1999.

SINTOMER, Yves; HERZBERG, Carsten; RÖCKE, Anja. Les budgets participatifs en Europe: Des services publics au service du public. Paris: La Découverte, 2008.

WAMPLER, Brian. *Participatory Budgeting in Brazil: Contestation, Cooperation, and Accountability*. University Park: Penn State University Press, 2007.
