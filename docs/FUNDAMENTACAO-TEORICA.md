# Fundamentação Teórica — Código Público

Este documento explica a base política do Código Público como **infraestrutura de
Orçamento Participativo municipal**. A teoria não é enfeite: cada conceito vira
**regra operacional** — território, sorteio, contestabilidade, auditoria,
deliberação, orçamento, execução e aprendizado.

O projeto não abandona a metáfora de Git. Ela passa a operar como **infraestrutura
interna de rastreabilidade** (histórico, forks, diffs, merge, release), enquanto a
tese pública fica centrada em território, orçamento, execução e aprendizado.

> Profundidade é honestidade: a maior parte do que segue descreve o **alvo**, e o
> sistema ainda não o alcançou (ver [lacunas.md](lacunas.md)). Onde nomeamos um
> mecanismo, dizemos também o seu **limite**.

## Tese central

O Código Público é uma constituição operacional para Orçamento Participativo:

```txt
território
→ demanda simples
→ maturação
→ filtros públicos
→ votação territorial
→ matriz do OP
→ institucionalização no PPA/LDO/LOA
→ execução fiscalizada
→ aprendizado do ciclo seguinte
```

A aposta: **regras públicas implementadas em código podem reduzir arbitrariedade,
captura e invisibilidade na decisão orçamentária municipal** — sem prometer vencer
o que nenhum sistema vence sozinho.

---

# Parte I — A unidade e a entrada

## 1. Code is law — Lawrence Lessig

O sistema assume a tese de que **arquitetura técnica regula comportamento
político**. No Código Público:

- estados da esteira são regras institucionais;
- filtros precisam ser públicos e testáveis;
- parâmetros locais devem ser explícitos e **confinados a faixas com piso e teto**
  (ver [PROTOCOLO-OP.md §1.2](PROTOCOLO-OP.md));
- todo movimento relevante gera auditoria;
- constantes de política não podem ficar escondidas como detalhe técnico;
- o calendário do ciclo, com janelas mínimas, é ele próprio uma regra — não um
  detalhe operacional.

O `policy.go` é texto constitucional; os `*_policy_test.go` são o controle de
constitucionalidade. **O código não é só ferramenta — é parte do rito.**

A originalidade de Lessig está em perceber que o código **não precisa de
consentimento explícito para regular**: quem controla a arquitetura controla o
comportamento possível. No Código Público, invertemos a direção: a arquitetura é
deliberadamente aberta, auditável e parametrizável — para que a regulação seja
**visível e contestável**, não invisível e arbitrária. O kernel comum
([PROTOCOLO-OP.md §1.1](PROTOCOLO-OP.md)) é a lista de coisas que nenhum
parâmetro local pode burlar — ele é a constituição do sistema.

## 2. Território como unidade — e os contrapúblicos de Nancy Fraser

A unidade democrática base é o território (bairro, comunidade, distrito, zona
rural), com a regra:

```txt
1 território = 1 representação
```

Isso evita que regiões populosas dominem comunidades pequenas e dá existência
política direta a periferias e zona rural. **A justiça social começa pela justiça
territorial.**

A teoria que sustenta essa escolha é a crítica de **Nancy Fraser** ("Rethinking
the Public Sphere", 1990) à esfera pública única de Habermas: ela excluía os
subalternos. A resposta de Fraser são os **contrapúblicos subalternos** — espaços
onde grupos marginalizados formulam suas demandas **na sua própria linguagem**,
longe do olhar dominante. **Cada território no Código Público é, deliberadamente,
um contrapúblico fraseriano:** o lugar onde a periferia enuncia seu problema antes
de competir no nível municipal.

A evolução do protocolo reforça essa leitura: com o **envelope dividido em dois
níveis** ([PROTOCOLO-OP.md §6](PROTOCOLO-OP.md)), cada território recebe um
sub-envelope próprio (piso igual + parcela por carência). O contrapúblico não é
apenas simbólico — ele tem **recurso próprio**. A periferia não precisa "ganhar"
da capital para existir: ela delibera dentro da sua fatia conhecida.

> **O limite:** o contrapúblico só funciona se a periferia conseguir **entrar**.
> Daí a regra de "começar pelo problema simples" e a obrigação de uma UI que
> traduza a constituição interna em linguagem comum. Território sem acesso vira
> exclusão com outro nome. E o contrapúblico fraseriano pressupõe espaço
> **seguro** — daí a importância da denúncia sigilosa e da proteção contra
> *dominium* (§15).

## 3. Deliberação sem barreira — e a epistemologia do fork (Yochai Benkler)

O cidadão não precisa preencher um caderno técnico para participar. A entrada é
crua:

> Falta médico no PSF do meu bairro.

E a maturidade vem por **camadas**: apoios, não-apoios, comentários, evidências,
perguntas, agrupamento, **fork**, filtros, justificativas e retorno à esteira. O
sistema evita dois extremos: o **voto bruto sem informação** e a **tecnocracia que
bloqueia na porta**.

A teoria por trás da mecânica de fork/agrupamento é a **produção entre pares** de
**Yochai Benkler** (*The Wealth of Networks*, 2006): um terceiro modo de
organização — nem hierarquia, nem mercado — que funciona quando as contribuições
são **modulares, granulares e de baixo custo de integração**. O Git não é só
metáfora: é uma **epistemologia política**. A demanda deixa de ser oráculo e vira
**artefato versionado, falível e forkável** — com autor, histórico, alternativas e
revisão por pares. Uma demanda inviável não morre: vira forks mais viáveis
(ampliar horário, sala de estabilização, pactuação regional). E a **reputação
pública** registrada (quantas demandas o conselho validou, recusou, com que
justificativa) funciona como moeda — mais poderosa que punição formal.

A evolução do protocolo adicionou os **dois portões de aptidão**
([PROTOCOLO-OP.md §4](PROTOCOLO-OP.md)): o portão A é protocolar (o sistema
decide: é do território? não é duplicada? tem informação mínima?), o portão B é
popular (a comunidade decide: atingiu o limiar de apoio?). Só o caso genuinamente
ambíguo sobe ao conselho colegiado. Isso é Benkler em operação: modularidade
(cada portão é independente), granularidade (a contribuição do cidadão é um apoio)
e baixo custo de integração (o sistema computa automaticamente).

---

# Parte II — A seleção e a representação

## 4. Sorteio e legitimidade — Bernard Manin e Hélène Landemore

**Bernard Manin** (*The Principles of Representative Government*, 1997) traz o
argumento mais afiado a favor do sorteio: o **princípio da distinção**. A eleição
**não é** um método neutro — ela é, por natureza, **aristocrática**: seleciona os
percebidos como superiores (mais visíveis, mais ricos, mais conectados). Em
Atenas, o método **democrático** era o **sorteio**; a eleição era o método
**oligárquico**. Ou seja: trocar eleição por sorteio não é só "reduzir captura" —
é escolher o método historicamente **democrático** de seleção. **Hélène
Landemore** (*Open Democracy*, 2020) reforça: representação aberta, rotativa e
não-eleitoral (mini-públicos) pode ser mais legítima que o filtro eleitoral.

No Código Público, o conselho territorial:

- é temporário (duração de 1 ciclo);
- nasce de **inscrição + sorteio auditável** entre cidadãos vinculados;
- é **colegiado** (3–7 membros, conforme regimento local — nunca uma pessoa única);
- responde ao território e ao Maintainer Geral;
- pode sofrer recall;
- deve justificar filtros e decisões por maioria do colegiado.

A legitimidade tem duas partes:

```txt
origem      = sorteio auditável entre cidadãos vinculados
exercício   = mandato limitado, justificativa, recurso, recall e auditoria
```

E o sorteio é **incapturável** justamente porque é puro: ninguém compra ou coage o
acaso. A semente vem de uma **fonte pública e futura** que o operador não controla,
e o sorteio inteiro é registrado na auditoria — *sorteio auditável*.

## 5. O conselho colegiado como mini-público — James Fishkin

A decisão de substituir o Maintainer Territorial individual por um **conselho de
3–7 cidadãos sorteados** não é apenas medida de segurança contra captura — é uma
escolha teórica deliberada.

**James Fishkin** (*When the People Speak*, 2009; *Democracy When the People Are
Thinking*, 2018) demonstrou empiricamente que **mini-públicos deliberativos** —
grupos de cidadãos comuns, selecionados aleatoriamente e informados sobre o tema
— produzem decisões mais ponderadas que votações diretas desinformadas ou que
delegação a especialistas. A qualidade da decisão não vem da expertise individual,
mas do **processo deliberativo entre iguais informados**.

O conselho territorial do Código Público é, na prática, um mini-público fiskiniano
territorializado:

- **seleção aleatória** reduz viés de auto-seleção;
- **colegiado** (mínimo 3) garante pluralidade de perspectivas;
- **justificativa obrigatória** força a deliberação — não basta votar, é preciso
  explicar;
- **mandato de 1 ciclo** impede cristalização;
- **rotação** garante diversidade ao longo do tempo.

A diferença em relação aos mini-públicos clássicos de Fishkin: nos *deliberative
polls*, os participantes deliberam por dias intensivos sobre um tema nacional; no
Código Público, o conselho opera ao longo de todo o ciclo do OP sobre os
**problemas concretos do seu próprio território**. É deliberação enraizada no
cotidiano, não no experimento.

A colegialidade também mitiga o risco nomeado por Manin: se o sorteio puro pode
eventualmente selecionar alguém sem qualquer interesse na função, o conselho
colegiado dilui esse risco — um membro desengajado não compromete o todo.

> **O limite:** mini-públicos são tão bons quanto a **informação** que recebem.
> Fishkin insiste na fase de *briefing* equilibrado antes da deliberação. No OP
> territorial, a "informação" é vivida — o conselheiro mora no bairro. Mas quando
> o tema é técnico (custo de obra, competência federativa, legalidade), o
> conselho depende da qualidade dos filtros e do circuit breaker (§13) para não
> deliberar no vazio. A maturação (§3) é a resposta de design: a demanda chega ao
> conselho já enriquecida por apoio, complementos, evidências e filtragem
> protocolar.

## 6. O que o sorteio puro abre mão — Hanna Pitkin e Jane Mansbridge

Aqui está a honestidade que separa rigor de propaganda. A decisão de usar
**aleatoriedade pura, sem cotas**, tem um custo nomeável.

**Hanna Pitkin** (*The Concept of Representation*, 1967) distingue quatro
representações: formal (como é autorizado), **descritiva** (parece com quem
representa), simbólica e substantiva (age pelos interesses). O sorteio puro
privilegia a formal e a substantiva, mas **não garante a descritiva** — um
conselho pequeno pode, por azar, não espelhar a diversidade do território.

**Jane Mansbridge** ("Should Blacks Represent Blacks?", 1999) diz **quando** essa
lacuna dói mais: sob **desconfiança** e **interesses não cristalizados** — ou seja,
**exatamente na periferia desconfiada da elite**, que é o público que o sistema
mais quer servir. A lacuna não é uniforme; concentra-se onde mais importa.

A evolução para **conselho colegiado** mitiga parcialmente o problema. Pitkin
avalia representação por indivíduo; um conselho de 5 sorteados tem mais chance de
espelhar a diversidade territorial do que 1 indivíduo. Não é garantia — a lei dos
grandes números exigiria centenas — mas é progresso: um conselho de 5 tem 5×
mais chance de incluir uma mulher, um jovem, um idoso do que uma pessoa única. A
rotação por ciclo amplia o espelhamento ao longo do tempo.

> **A escolha assumida:** o projeto prefere a **neutralidade incapturável** do
> sorteio puro a impor estratos (que exigiriam alguém decidindo "quais grupos
> entram" — um novo vetor de captura). O preço é abrir mão do espelhamento
> garantido. Mitigações: conselho colegiado (3–7), pool amplo de inscritos,
> rotação por ciclo, e **monitorar** se os conselhos espelham — sem reintroduzir
> cotas. É um trade-off declarado, não resolvido.

## 7. Identidade, Sybil e não-plutocracia — gov.br como prova de pessoa

A democracia digital morre de **ataque Sybil** (Douceur, 2002): identidades falsas
capturam a votação. O vínculo territorial validado pelo **gov.br** é, tecnicamente,
**resistência a Sybil** — o problema mais difícil do campo (toda a literatura de
*proof of personhood*; os *soulbound tokens* de Buterin/Weyl/Ohlhaver, 2022).
Garante **uma pessoa, um voto**, sem biometria global e sem token.

E isso posiciona o projeto contra as **DAOs**, que quase sempre degeneram em
**plutocracia** (1 token = 1 voto = quem tem mais dinheiro decide). O Código
Público é deliberadamente **não-plutocrático**: o peso vem do **vínculo
territorial** (escala T0–T5), **nunca do capital**. É o que o mundo das DAOs tenta
e falha em ser — governança digital Sybil-resistente, não-plutocrática e ancorada
numa jurisdição real.

> **O limite:** identidade forte reintroduz dependência do Estado (gov.br). No
> contexto OP isso é aceitável — o OP já é política do Executivo, o Estado já é o
> operador legítimo. Fora desse contexto, seria uma tensão.

---

# Parte III — A decisão e seus limites

## 8. Proceduralismo epistêmico — David Estlund

O sistema **não presume** que todo voto popular produz automaticamente a melhor
decisão. **David Estlund** (*Democratic Authority*, 2008) dissolve o falso dilema
entre "legítimo porque seguiu o rito" e "legítimo porque o resultado é bom": um
procedimento é legítimo quando é **justo** *e* **tende a acertar mais que as
alternativas** — sem nunca garantir o acerto (falibilismo).

Daí a **linha de maturidade**:

```txt
demanda simples → apoio → informação → agrupamento → fork → filtro → votação
```

A legitimidade vem de um procedimento público que **tende a melhorar** a decisão
**sem retirar a voz** do cidadão. O merge institucional não é automático: o rito
qualifica.

A evolução do protocolo reforçou o proceduralismo epistêmico com dois mecanismos
concretos: os **dois portões de aptidão** (§3/[PROTOCOLO-OP.md §4](PROTOCOLO-OP.md))
e o **conselho colegiado** (§5). Os portões garantem que a demanda que chega à
votação passou por filtro protocolar *e* apoio popular — não basta um, precisa dos
dois. O conselho garante que o caso ambíguo é resolvido por deliberação entre
iguais, não por autoridade individual. Estlund diria: o procedimento não garante o
acerto, mas **multiplica as chances** de que o resultado seja defensável.

## 9. Governança de comuns — Elinor Ostrom

O OP é um **comum institucional**: cidadãos disputam recursos escassos, regras de
prioridade e execução pública. **Elinor Ostrom** (*Governing the Commons*, 1990)
ajuda a separar o que é regra comum do que é regra local:

```txt
kernel comum
  regras democráticas mínimas: território com voz, sorteio, mandato temporário,
  privacidade, auditoria, retornos da esteira

regimento local
  parâmetros: calendário, mandato, envelope, índice de carência, prazos, quórum
```

O município **parametriza** o rito, mas **não viola** limites comuns:

- nenhum território reconhecido sem voz;
- maintainer vitalício proibido;
- filtro sem justificativa proibido;
- voto individual exposto proibido;
- dado pessoal em blockchain proibido;
- alteração invisível de histórico proibida.

A evolução do protocolo trouxe a expressão mais madura do policentrismo
ostromiano: a **tabela de faixas comuns** ([PROTOCOLO-OP.md §1.2](PROTOCOLO-OP.md)).
Cada parâmetro — tamanho do conselho, limiar de apoio, quórum de votação, quórum
de recall, razão igual/carência, janela de maturação, janela de votação — tem
**piso e teto** definidos pelo protocolo. O município escolhe o número; não
escolhe se a regra existe. É Ostrom aplicada: **a regra é comum, o número é
local.**

Os pisos e tetos existem para impedir que o parâmetro local burle o kernel: um
mandato de 10 anos burlaria a rotação; um quórum de recall de 90% o tornaria
impossível; um envelope territorial de 0% esvaziaria o OP.

> O insight que vale o Nobel de Ostrom é o **policentrismo**: cada comum escreve as
> próprias regras. O risco a vigiar: até onde vai a autonomia antes de
> descaracterizar o modelo. Os **pisos e tetos das faixas** são a resposta do
> protocolo — eles são, eles próprios, um comum, protegidos por testes de policy.
> As faixas exatas ainda são decisão em aberto (ver [lacunas.md](lacunas.md)).

## 10. Deliberação e a reabilitação parcial de Habermas

A fundamentação original critica Habermas (§2) via Fraser — com razão: a **esfera
pública única** de Habermas excluía os subalternos. Mas o Código Público, ao
construir a esteira de maturação, **reabilita parcialmente** um Habermas posterior.

**Jürgen Habermas** (*Between Facts and Norms*, 1996) define a legitimidade
democrática como produto de um **processo deliberativo** onde os afetados podem
influenciar a decisão por meio de argumentos. A "situação ideal de fala" — onde o
melhor argumento vence sem coerção — é impossível na prática. Mas a esteira de
maturação do OP é uma **aproximação estruturada**:

```txt
demanda simples (afirmação)
→ apoio / não-apoio (teste de relevância)
→ comentários e evidências (informação)
→ agrupamento ou fork (reformulação)
→ filtro protocolar (checagem objetiva)
→ conselho colegiado para o ambíguo (deliberação entre iguais)
→ votação (decisão informada)
```

Cada camada acrescenta informação, pluralidade e oportunidade de revisão. Não é a
situação ideal de fala — mas é **deliberação mediada por design**, onde o sistema
cria as condições para que o melhor argumento tenha chance de emergir.

A reabilitação é parcial porque **Fraser continua necessária**: a deliberação só é
justa se houver contrapúblicos (territórios com recurso próprio) onde os
subalternos formulam suas demandas antes de competir na arena municipal. Habermas
fornece o processo; Fraser fornece a estrutura que impede que o processo perpetue
a desigualdade.

> **O limite:** Habermas pressupõe que a deliberação é acessível a todos os
> afetados. Em territórios sem acesso digital, sem alfabetização funcional ou
> sob dominação local (*dominium*, §15), a esteira de maturação pode existir no
> sistema e não existir na vida das pessoas. A UI que traduz a constituição
> interna em linguagem comum ([PROTOCOLO-OP.md §16](PROTOCOLO-OP.md)) é condição
> de possibilidade — sem ela, Habermas vira teoria de gabinete.

## 11. Justiça distributiva — o envelope como princípio da diferença (John Rawls)

O Código Público distribui recurso público entre territórios desiguais. Isso é
**justiça distributiva**, e o autor canônico é **John Rawls** (*A Theory of
Justice*, 1971).

Rawls formula o **princípio da diferença**: desigualdade na distribuição de bens
primários (renda, riqueza, oportunidades, bases sociais do autorrespeito) só é
justa se **beneficia os menos favorecidos** da sociedade. Não basta que todos
ganhem algo — é preciso que a distribuição favoreça quem está pior.

O envelope em dois níveis ([PROTOCOLO-OP.md §6](PROTOCOLO-OP.md)) é a
implementação operacional do princípio da diferença:

```txt
Envelope do ciclo
├─ Piso igual (todo território) → igualdade formal
├─ Parcela por carência         → princípio da diferença (território pior recebe mais)
└─ Porção estruturante          → projetos que cruzam territórios
```

O **piso igual** garante que nenhum território fique sem recurso (igualdade
formal). A **parcela por carência** distribui mais para quem precisa mais
(equidade rawlsiana). A razão entre as duas parcelas — configurável no regimento
local, com faixa de 30/70 a 70/30, default 50/50 — é o **dial** entre igualdade e
equidade.

Rawls também fundamenta a regra do kernel que proíbe **zerar o envelope de um
território**: se o piso é zero, a participação vira teatro — o território delibera
sobre nada. É a liberdade formal que não vale sem **liberdade real** (bens
primários).

> **O limite:** Rawls opera com o **véu da ignorância** — agentes racionais
> escolheriam o princípio da diferença sem saber sua posição social. No OP real, os
> agentes sabem exatamente quem são e onde moram. A parcela por carência não é
> escolhida sob véu — é negociada sob interesse. A faixa comum com piso e teto é a
> salvaguarda: o município pode inclinar mais para igualdade ou mais para equidade,
> mas **não pode eliminar nenhuma das duas**.

## 12. Carência e capabilities — medir privação, não só renda (Amartya Sen e Martha Nussbaum)

O índice de carência determina quanto cada território recebe além do piso igual. A
pergunta é: **o que a carência mede?**

Se mede apenas renda, perde dimensões essenciais: um bairro pode ter renda média
mas não ter saneamento, médico, escola ou transporte. A **abordagem das
capabilities** de **Amartya Sen** (*Development as Freedom*, 1999) e **Martha
Nussbaum** (*Creating Capabilities*, 2011) oferece a resposta: o que importa não é
o que as pessoas *têm*, mas o que elas **podem ser e fazer** — suas capacidades
reais.

Sen define desenvolvimento como expansão de **liberdades substantivas**: não basta
ter renda se não há saúde, educação, segurança ou participação política
disponíveis. Nussbaum complementa com uma **lista de capabilities centrais** que
toda sociedade justa deveria garantir: vida, saúde, integridade corporal,
imaginação e pensamento, emoções, razão prática, afiliação, relação com outras
espécies, jogo e controle sobre o ambiente político e material.

No Código Público, o índice de carência deve ser **multidimensional**:

```txt
carência territorial = f(
  saúde:        distância de PSF, cobertura de ESF, leitos
  educação:     vagas, evasão, distância de escola
  saneamento:   água, esgoto, coleta
  transporte:   acesso, frequência, distância
  segurança:    ocorrências, iluminação
  moradia:      inadequação, risco
  renda:        vulnerabilidade econômica
  histórico OP: frustração acumulada, promessas não cumpridas
)
```

A fórmula exata é regimento local (ver
[ORCAMENTO-PARTICIPATIVO.md](ORCAMENTO-PARTICIPATIVO.md)), mas o kernel comum
deve impedir que a carência seja reduzida a uma única dimensão — seria trair Sen
e Nussbaum, e, mais importante, seria injusto com o território que sofre
privações invisíveis em indicadores simplistas.

> **O limite:** a abordagem de capabilities é exigente em dados. Muitos
> municípios não têm informação desagregada por território. No primeiro ciclo, o
> índice pode ser **proxy simplificado** (indicadores disponíveis + diagnóstico
> territorial participativo); nos ciclos seguintes, a própria execução do OP gera
> dados que alimentam o índice. A carência é autoevolutiva — mas o bootstrap é
> necessariamente imperfeito.

## 13. Orçamento, escassez e circuit breaker

O OP lida com **desejo público sob escassez**. O sistema aceita a demanda inicial,
mas aplica filtros públicos (competência municipal, custo > envelope, demanda
privada, vedação constitucional, dependência de outro ente, faseamento, impacto
permanente sem fonte).

A evolução do protocolo tornou o circuit breaker mais preciso: o custo da demanda
é checado contra o **sub-envelope do território** ([PROTOCOLO-OP.md §6](PROTOCOLO-OP.md)),
não contra um número municipal abstrato. Isso significa que o cidadão sabe,
**antes de votar**, quanto seu território tem disponível — e a escassez se torna
informação deliberativa, não surpresa pós-votação.

O **circuit breaker não humilha** a demanda — ele **traduz, devolve, faseia ou
transforma em reivindicação externa**. Toda negativa tem fundamento público,
explicação simples, possibilidade de reformulação e contestação, e registro em
auditoria. É o "não" que mantém a participação viva.

As respostas possíveis do circuit breaker formam uma **tabela de retorno**
([PROTOCOLO-OP.md §9](PROTOCOLO-OP.md)) — nunca é "recusado, fim". É sempre
"recusado *assim*, mas há *este* caminho". Essa regra é tão central que está no
kernel comum: **toda negativa gera caminho de correção, fork, recurso ou memória
pública.**

---

# Parte IV — O poder e a sua vigilância

## 14. Não-dominação — Philip Pettit (imperium e dominium)

**Philip Pettit** (*Republicanism*, 1997; *On the People's Terms*, 2012): liberdade
é **ausência de dominação** (poder arbitrário sobre você), não mera ausência de
interferência. O *eyeball test*: você é livre quando pode encarar quem tem poder
sobre você sem medo. O conselho territorial é **necessário e perigoso** — pode
organizar o território, mas não pode virar autoridade informal.

Salvaguardas (contra o ***imperium*** — a dominação pelo poder público): mandato
temporário, limite de mandatos, **colegialidade** (decisão por maioria, não por
indivíduo), recall, justificativa obrigatória, recurso ao Maintainer Geral, audit
log, impossibilidade de apagar histórico. O sistema é deliberadamente **mais
editorial que eleitoral**: seu valor está em *poder desafiar* decisões, não só em
*escolher* — a **contestabilidade** de Pettit.

A evolução para conselho colegiado é, em termos pettitianos, uma salvaguarda
estrutural: o poder do facilitador territorial é **distribuído** entre 3–7 membros,
nenhum dos quais governa sozinho. A dominação exige concentração; a colegialidade
a dificulta.

> **A cegueira a encarar — *dominium*.** Pettit também nomeia a dominação pelo
> poder **privado** (patrão, dono de terra, milícia). O sistema combate bem o
> *imperium*, mas a governança territorial é **pública** — contestar ou assinar um
> recall **expõe** o cidadão ao *dominium*. Protegemos o voto (sigiloso), não a
> governança. É a tensão que a próxima seção endereça.

## 15. Risco de dominação local — denúncia sigilosa

Transparência radical é boa contra o abuso de cargo, mas **perigosa** em
territórios capturados por patrões, grupos econômicos, clientelismo ou violência.
Por isso:

- **denúncia sigilosa** deve existir;
- contestação sensível pode ser protegida;
- dados pessoais ficam **criptografados, fora da blockchain**;
- blockchain guarda **apenas hash**;
- acesso a dado sensível exige **rito formal** e **gera auditoria**.

É a resposta de design à tensão *imperium × dominium*: contestar o poder local não
pode custar a segurança de quem contesta.

O conselho colegiado também mitiga o *dominium* por outro ângulo: se o facilitador
é um grupo de 5 sorteados, coagir todos é mais caro e mais visível do que coagir
1 pessoa. Não é proteção total — o *dominium* opera por medo difuso, não por
operação cirúrgica — mas é uma barreira a mais.

## 16. Privacidade como integridade contextual — Helen Nissenbaum e Julie Cohen

O Código Público opera com dados sensíveis: CPF, endereço, voto individual,
denúncia, contestação. A tentação é tratar privacidade como "esconder dados". A
teoria mais robusta é a **integridade contextual** de **Helen Nissenbaum**
(*Privacy in Context*, 2009): privacidade não é segredo — é a garantia de que a
informação **flui conforme as normas do contexto** em que foi produzida.

No OP, os contextos são claros e suas normas são diferentes:

```txt
Contexto de escolha (voto)
  → norma: sigilo absoluto — a escolha individual nunca é revelada
  → razão: liberdade de consciência; coerção é impossível sem saber o voto

Contexto de poder (filtro, decisão, institucionalização)
  → norma: transparência radical — toda decisão é pública, justificada, auditada
  → razão: accountability; o poder sem luz é dominação

Contexto de vulnerabilidade (denúncia, contestação sensível)
  → norma: sigilo protegido — conteúdo criptografado, hash público, rito de acesso
  → razão: proteção contra dominium; quem contesta o poder local não pode ser exposto

Contexto de identidade (CPF, endereço, documento)
  → norma: mínimo necessário — o sistema valida sem armazenar o que não precisa
  → razão: LGPD, minimização, proporcionalidade
```

**Julie Cohen** (*Between Truth and Power*, 2019) acrescenta a dimensão
**estrutural**: a privacidade não é apenas direito individual — é **condição de
possibilidade** da cidadania. Sem privacidade do voto, não há liberdade de
escolha. Sem proteção da denúncia, não há fiscalização. A blockchain pública é
deliberadamente **cega**: ela prova que algo existiu e não foi alterado, sem saber
*o quê* ou *quem*.

> **O limite:** a integridade contextual depende de **quem define os contextos**.
> No Código Público, os contextos são definidos pelo protocolo (kernel comum) e
> pelo regimento local. Mas há casos limítrofes: uma contestação de vínculo
> territorial é contexto de poder (deveria ser pública) ou contexto de
> vulnerabilidade (deveria ser protegida)? O protocolo precisa resolver esses
> limítrofes caso a caso — e cada resolução deve ser justificada e auditável.

## 17. O problema do alarme — Mancur Olson e McCubbins & Schwartz

Recall, contestação e denúncia são **alarmes de incêndio** (McCubbins & Schwartz,
1984): em vez de vigilância constante e cara, gatilhos que ativam a fiscalização
quando algo erra. Mas há um problema mais fundo — **Mancur Olson** (*The Logic of
Collective Action*, 1965): fiscalizar é um **bem público**, e atores dispersos o
**sub-provêm**. O risco real não é o *over-firing* (o cooldown de contestação já o
contém) — é o **alarme nunca ser puxado**.

> **Lacuna declarada:** falta um **ator com incentivo estrutural** para fiscalizar.
> Na prática real do OP, o monitoramento eficaz é feito por um **subconjunto
> organizado** (associações de moradores, observatórios, conselhos de política
> pública, imprensa local), não por "todos". Dar status a esses atores-alarme é
> trabalho em aberto.

## 18. O filtro institucional e o incidente público — accountability por exposição

A evolução do protocolo resolveu a assimetria mais perigosa do sistema original:
o Legislativo podia **vetar silenciosamente** o que o povo aprovou. A solução não
é obrigar a Câmara a obedecer (seria inconstitucional), nem criar re-votação
infinita. A solução é **exposição**.

O filtro institucional ([PROTOCOLO-OP.md §8](PROTOCOLO-OP.md)) agora opera em
dois atos com consequências diferentes:

**Filtro de admissibilidade** — lista *fechada* de fundamentos formais
(inconstitucional, fora da competência, sem fonte, excede envelope, depende de
outro ente). Aqui o Legislativo pode filtrar legitimamente, com retorno para o
território (reformulação, fork, faseamento, reivindicação externa).

**Veto político** — qualquer recusa *fora* dessa lista. Isto **não é filtro**:
é o Legislativo derrubando o que o povo aprovou. A resposta é um **incidente
público de divergência institucional**:

- abre automaticamente;
- registra: proposta aprovada pelo povo, recusada pela Câmara, fundamento
  declarado, responsáveis identificados;
- o registro é imutável (cadeia de hash + âncora externa);
- a accountability é política e pública — a próxima eleição decide.

Isso é **democracia monitória** (§19) operacionalizada: não se obriga o poder a
obedecer, mas torna-se **impossível ele agir em silêncio**. O kernel proíbe o
veto silencioso, não o veto fundamentado.

A teoria por trás é a convergência de **McCubbins & Schwartz** (alarme de
incêndio: o incidente público é o alarme) com **Keane** (democracia monitória:
o poder legítimo é continuamente monitorado) e **Pettit** (contestabilidade: o
valor está em poder desafiar, não só em escolher). O incidente público é o
mecanismo onde as três teorias se encontram.

> **O limite:** accountability por exposição só funciona se alguém **vê** o
> incidente. Se a página pública de divergências não tiver audiência, o veto
> político é exposto no sistema mas invisível na cidade. Daí a importância de
> que a sociedade civil (o "ator-alarme" de §17) tenha acesso e incentivo para
> amplificar. O sistema cria a prova; a democracia precisa de quem a leia.

## 19. Democracia monitória — John Keane (e o "quem vigia o vigia")

**John Keane** (*The Life and Death of Democracy*, 2009): poder legítimo é poder
**continuamente monitorado**. O sistema não confia em virtude individual — cria
monitoramento permanente: audit events, hash chain, release do ciclo, incidentes
de divergência institucional, execução fiscalizada, âncoras externas.

E aqui o argumento mais forte do projeto, respondendo à pergunta mais antiga do
poder — *quis custodiet ipsos custodes?* No topo da hierarquia (Maintainer Técnico,
Geral) **não há instância superior para apelar**. A resposta clássica seria "mais
um vigia" (regressão infinita). A resposta do Código Público é **matemática**: a
cadeia de hash encadeada torna a adulteração **detectável**; a âncora externa (o
**Diário Oficial**, gratuito e já legalmente imutável) torna a reescrita do passado
**impossível de esconder**. Não é segurança por confiança — é **segurança por
verificabilidade**. Blockchain entra como prova externa de integridade, **nunca**
como local de dado pessoal.

A evolução do protocolo adicionou o **incidente público de divergência** (§18) como
camada de monitoramento que Keane apreciaria: o sistema não apenas detecta a
adulteração técnica (hash) — ele detecta a **divergência institucional** (o
Legislativo decidiu diferente do povo) e a torna pública. É monitoramento não só
da infraestrutura, mas do **poder político**.

---

# Parte V — A execução e a aferição

## 20. Execução e aprendizado — Archon Fung

**Archon Fung** (*Empowered Participatory Governance*): participação sem execução
vira teatro. O ciclo só fecha quando a decisão aprovada vira **item fiscalizável**,
com estados (não iniciada, em planejamento, em licitação, em execução, atrasada,
paralisada, concluída, cancelada, **frustrada**).

E a execução precisa **produzir memória**: atraso, paralisação ou frustração
entram no histórico do território e **influenciam o próximo ciclo** — especialmente
onde a carência se acumula ou as promessas não se cumprem. O aprendizado fecha o
laço que separa OP real de OP decorativo.

A evolução do protocolo tornou o aprendizado **mensurável**
([PROTOCOLO-OP.md §10](PROTOCOLO-OP.md)):

- execução frustrada dá **reentrada prioritária** à demanda não cumprida;
- frustração crônica **aumenta o peso de carência** do território no próximo
  envelope — o território mal atendido recebe mais, não menos;
- demanda dormente (sem apoio suficiente) fica no backlog e **ressurge
  automaticamente** se reatingir o limiar em ciclo futuro.

O aprendizado deixa de ser palavra e vira **número que move o envelope**. É a
diferença entre prometer que o próximo ciclo vai aprender e **obrigar** que ele
aprenda — porque a carência acumulada é variável da fórmula do sub-envelope
(§11–§12).

## 21. O teste de Dahl (autoavaliação atualizada)

**Robert Dahl** (*Democracy and Its Critics*, 1989) define cinco critérios de um
processo democrático. Usados como grade para auditar o próprio sistema — agora
atualizada à luz das evoluções do protocolo:

| Critério de Dahl | Estado anterior | Estado atualizado |
| --- | --- | --- |
| **Participação efetiva** | Forte com vínculo; bloqueada na periferia sem maintainer | **Melhorou:** conselho colegiado (3–7) reduz risco de território sem facilitador; modo-assembleia garante que território sem inscritos não fica mudo |
| **Igualdade de voto** | Forte na votação (sigilosa); ponderada por vínculo | **Melhorou:** envelope dividido em sub-envelopes territoriais garante que cada território vota sobre recurso real, não sobre promessa abstrata |
| **Entendimento esclarecido** | **Diferencial:** linguagem dupla e deliberação informada | **Mantém-se diferencial:** esteira de maturação + dois portões de aptidão (protocolar + popular) + deliberação colegiada para o ambíguo |
| **Controle da agenda** | Forte: demanda nasce do cidadão | **Reforçado:** filtro institucional com lista fechada de fundamentos impede que o Legislativo controle a agenda por omissão; veto político abre incidente público |
| **Inclusão dos adultos** | **O ponto fraco:** vínculo valida mas pode excluir | **Continua o ponto fraco:** a tensão central permanece — o vínculo territorial é condição de Sybil-resistência mas também barreira de entrada |

O sistema é forte onde quase nenhum é — **entendimento esclarecido** e **controle
da agenda** — e fraco em **inclusão**, que é o desafio que define seu futuro.

---

# Parte VI — A escala e o futuro

## 22. Governança multinível e federalismo do kernel — Ostrom, Hooghe e Marks

O Código Público foi desenhado para um município. Mas o kernel comum, por
definição, é o mesmo para todos os municípios que adotarem o sistema. Isso cria
uma questão de **governança multinível**.

**Liesbet Hooghe e Gary Marks** (*Multi-Level Governance and European Integration*,
2001; *A Postfunctionalist Theory of European Integration*, 2009) distinguem dois
tipos de governança multinível:

- **Tipo I:** jurisdições limitadas, sem sobreposição, estáveis (federalismo
  clássico: União, Estado, Município);
- **Tipo II:** jurisdições flexíveis, sobrepostas, orientadas por tarefa (comitês
  temáticos, redes, arranjos ad hoc).

O Código Público opera primariamente no Tipo I (município como instância única),
mas o kernel comum cria uma camada de Tipo II: uma **comunidade de protocolo** que
cruza municípios. Quem decide as faixas do kernel? Quem atualiza o protocolo? Quem
arbitra quando um município tenta burlar?

A resposta de Ostrom (policentrismo) é que **o protocolo é ele próprio um comum**
— governado por regras sobre como alterar regras. No estágio atual, o protocolo é
mantido pela comunidade open source do projeto. Numa escala futura com dezenas de
municípios, essa governança precisará de institucionalização: talvez um consórcio
intermunicipal, uma fundação ou uma comunidade de prática com rito próprio.

> **O limite:** escalabilidade institucional é diferente de escalabilidade
> técnica. O código escala por fork e deploy; a **confiança** escala por
> reputação, adoção e verificação. Um município piloto bem-sucedido é a melhor
> propaganda — e a melhor prova de que o kernel é viável. Sem piloto, o
> federalismo do kernel é teoria.

## 23. A lacuna principal

A teoria avançou mais que a primeira versão, e o protocolo evoluiu
significativamente. Mas a distância entre o alvo e o sistema construído
permanece. O app precisa completar a migração de:

```txt
Lei Orgânica → issue → PR cívico → votação → release
```

Para:

```txt
Ciclo OP → território → demanda → proposta → votação territorial → matriz → execução
```

O protocolo está escrito. As correções estruturais (conselho colegiado, envelope
dividido, filtro com incidente público, calendário como regimento) estão
documentadas. A implementação está em progresso — ver [lacunas.md](lacunas.md),
[proximos-passos.md](proximos-passos.md) e
[ESTRUTURA-DO-APP.md](ESTRUTURA-DO-APP.md).

## 24. Perguntas em aberto

- Quais são as faixas exatas (piso/teto) dos parâmetros do regimento local?
- Como calcular o índice de carência — quais dimensões, quais pesos, quais fontes?
- Há ajuda de custo ao sorteado — sem ela, o sorteio exclui o vulnerável?
- Qual o rito de divergência entre o sistema e o ato oficial?
- Como a frustração de execução altera quantitativamente o sub-envelope do próximo ciclo?
- Como incluir a periferia sem abrir o flanco da Sybil (inclusão × fronteiras)?
- Quem governa o kernel quando houver múltiplos municípios?
- Como tratar território sem inscrito para o sorteio (modo-assembleia é suficiente)?
- Qual evento deve ser ancorado externamente (sorteio? matriz? release? todos)?
- Qual a duração do mandato territorial e o limite de mandatos consecutivos?
- Como dar status e incentivo aos atores-alarme (associações, observatórios, imprensa)?

## 25. Síntese

> O Código Público aposta que a **arquitetura é constituição** (Lessig): território
> como contrapúblico com recurso próprio (Fraser), entrada sem barreira e forkável
> (Benkler), seleção por sorteio democrático em conselho colegiado (Manin + Fishkin)
> com identidade forte e não-plutocrática (anti-Sybil), decisão por procedimento
> que tende a acertar (Estlund) sob maturação deliberativa (Habermas parcial),
> regras comuns e parâmetros locais em faixas (Ostrom), recurso distribuído por
> justiça distributiva (Rawls) medida em capabilities multidimensionais (Sen +
> Nussbaum), poder limitado e contestável (Pettit) protegido até do *dominium*
> (denúncia sigilosa), privacidade como integridade contextual (Nissenbaum +
> Cohen), filtro institucional que expõe o veto político (McCubbins & Schwartz),
> vigiado por matemática e democracia monitória (Keane), execução que vira
> aprendizado mensurável (Fung), governança multinível para escala (Hooghe &
> Marks) — e tudo aferido pelos critérios de Dahl, com a **inclusão** como o
> desafio que ainda não vencemos.

## Referências teóricas

- Lawrence Lessig — *Code and Other Laws of Cyberspace* (1999).
- Bernard Manin — *The Principles of Representative Government* (1997).
- Hélène Landemore — *Open Democracy* (2020).
- James Fishkin — *When the People Speak* (2009); *Democracy When the People Are Thinking* (2018).
- Elinor Ostrom — *Governing the Commons* (1990).
- David Estlund — *Democratic Authority* (2008).
- John Rawls — *A Theory of Justice* (1971).
- Amartya Sen — *Development as Freedom* (1999).
- Martha Nussbaum — *Creating Capabilities* (2011).
- Jürgen Habermas — *Between Facts and Norms* (1996).
- Philip Pettit — *Republicanism* (1997); *On the People's Terms* (2012).
- John Keane — *The Life and Death of Democracy* (2009).
- Archon Fung — *Empowered Participatory Governance* (2003).
- Hanna F. Pitkin — *The Concept of Representation* (1967).
- Jane Mansbridge — "Should Blacks Represent Blacks and Women Represent Women?" (1999).
- Yochai Benkler — *The Wealth of Networks* (2006).
- Nancy Fraser — "Rethinking the Public Sphere" (1990).
- Robert A. Dahl — *Democracy and Its Critics* (1989).
- Mancur Olson — *The Logic of Collective Action* (1965).
- McCubbins & Schwartz — "Congressional Oversight Overlooked: Police Patrols versus Fire Alarms" (1984).
- Buterin, Weyl & Ohlhaver — "Decentralized Society: Finding Web3's Soul" (2022).
- Helen Nissenbaum — *Privacy in Context* (2009).
- Julie Cohen — *Between Truth and Power* (2019).
- Liesbet Hooghe & Gary Marks — *Multi-Level Governance and European Integration* (2001).
