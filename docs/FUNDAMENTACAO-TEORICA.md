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
- parâmetros locais devem ser explícitos;
- todo movimento relevante gera auditoria;
- constantes de política não podem ficar escondidas como detalhe técnico.

O `policy.go` é texto constitucional; os `*_policy_test.go` são o controle de
constitucionalidade. **O código não é só ferramenta — é parte do rito.**

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

> **O limite:** o contrapúblico só funciona se a periferia conseguir **entrar**.
> Daí a regra de "começar pelo problema simples" e a obrigação de uma UI que
> traduza a constituição interna em linguagem comum. Território sem acesso vira
> exclusão com outro nome.

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
pública** registrada (quantas demandas o representante validou, recusou, com que
justificativa) funciona como moeda — mais poderosa que punição formal.

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

No Código Público, o Maintainer Territorial:

- é temporário;
- nasce de **inscrição + sorteio auditável** entre cidadãos vinculados;
- responde ao território e ao Maintainer Geral;
- pode sofrer recall;
- deve justificar filtros e decisões.

A legitimidade tem duas partes:

```txt
origem      = sorteio auditável entre cidadãos vinculados
exercício   = mandato limitado, justificativa, recurso, recall e auditoria
```

E o sorteio é **incapturável** justamente porque é puro: ninguém compra ou coage o
acaso. A semente vem de uma **fonte pública e futura** que o operador não controla,
e o sorteio inteiro é registrado na auditoria — *sorteio auditável*.

## 5. O que o sorteio puro abre mão — Hanna Pitkin e Jane Mansbridge

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

> **A escolha assumida:** o projeto prefere a **neutralidade incapturável** do
> sorteio puro a impor estratos (que exigiriam alguém decidindo "quais grupos
> entram" — um novo vetor de captura). O preço é abrir mão do espelhamento
> garantido. Mitigações: pool grande, rotação por ciclo, e **monitorar** se os
> conselhos espelham — sem reintroduzir cotas. É um trade-off declarado, não
> resolvido.

## 6. Identidade, Sybil e não-plutocracia — gov.br como prova de pessoa

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

## 7. Proceduralismo epistêmico — David Estlund

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

## 8. Governança de comuns — Elinor Ostrom

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

> O insight que vale o Nobel de Ostrom é o **policentrismo**: cada comum escreve as
> próprias regras. **A regra é comum, o número é local.** O risco a vigiar: até
> onde vai a autonomia antes de descaracterizar o modelo (mandato de 10 anos
> burlaria a rotação; envelope de 0% esvaziaria o OP). Os **limites rígidos** dos
> parâmetros locais são uma decisão ainda em aberto.

## 9. Orçamento, escassez e circuit breaker

O OP lida com **desejo público sob escassez**. O sistema aceita a demanda inicial,
mas aplica filtros públicos (competência municipal, custo > envelope, demanda
privada, vedação constitucional, dependência de outro ente, faseamento, impacto
permanente sem fonte).

O **circuit breaker não humilha** a demanda — ele **traduz, devolve, faseia ou
transforma em reivindicação externa**. Toda negativa tem fundamento público,
explicação simples, possibilidade de reformulação e contestação, e registro em
auditoria. É o "não" que mantém a participação viva.

---

# Parte IV — O poder e a sua vigilância

## 10. Não-dominação — Philip Pettit (imperium e dominium)

**Philip Pettit** (*Republicanism*, 1997; *On the People's Terms*, 2012): liberdade
é **ausência de dominação** (poder arbitrário sobre você), não mera ausência de
interferência. O *eyeball test*: você é livre quando pode encarar quem tem poder
sobre você sem medo. O Maintainer Territorial é **necessário e perigoso** — pode
organizar o território, mas não pode virar autoridade informal.

Salvaguardas (contra o ***imperium*** — a dominação pelo poder público): mandato
temporário, limite de mandatos, recall, justificativa obrigatória, recurso ao
Maintainer Geral, audit log, impossibilidade de apagar histórico. O sistema é
deliberadamente **mais editorial que eleitoral**: seu valor está em *poder
desafiar* decisões, não só em *escolher* — a **contestabilidade** de Pettit.

> **A cegueira a encarar — *dominium*.** Pettit também nomeia a dominação pelo
> poder **privado** (patrão, dono de terra, milícia). O sistema combate bem o
> *imperium*, mas a governança territorial é **pública** — contestar ou assinar um
> recall **expõe** o cidadão ao *dominium*. Protegemos o voto (sigiloso), não a
> governança. É a tensão que a próxima seção endereça.

## 11. Risco de dominação local — denúncia sigilosa

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

## 12. O problema do alarme — Mancur Olson e McCubbins & Schwartz

Recall, contestação e denúncia são **alarmes de incêndio** (McCubbins & Schwartz,
1984): em vez de vigilância constante e cara, gatilhos que ativam a fiscalização
quando algo erra. Mas há um problema mais fundo — **Mancur Olson** (*The Logic of
Collective Action*, 1965): fiscalizar é um **bem público**, e atores dispersos o
**sub-provêm**. O risco real não é o *over-firing* (o cooldown de contestação já o
contém) — é o **alarme nunca ser puxado**.

> **Lacuna declarada:** falta um **ator com incentivo estrutural** para fiscalizar.
> Na prática real do OP, o monitoramento eficaz é feito por um **subconjunto
> organizado** (associações de moradores, observatórios), não por "todos". Dar
> status a esses atores-alarme é trabalho em aberto.

## 13. Democracia monitória — John Keane (e o "quem vigia o vigia")

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

---

# Parte V — A execução e a aferição

## 14. Execução e aprendizado — Archon Fung

**Archon Fung** (*Empowered Participatory Governance*): participação sem execução
vira teatro. O ciclo só fecha quando a decisão aprovada vira **item fiscalizável**,
com estados (não iniciada, em planejamento, em licitação, em execução, atrasada,
paralisada, concluída, cancelada, **frustrada**).

E a execução precisa **produzir memória**: atraso, paralisação ou frustração
entram no histórico do território e **influenciam o próximo ciclo** — especialmente
onde a carência se acumula ou as promessas não se cumprem. O aprendizado fecha o
laço que separa OP real de OP decorativo.

## 15. O teste de Dahl (autoavaliação)

**Robert Dahl** (*Democracy and Its Critics*, 1989) define cinco critérios de um
processo democrático. Usados como grade para auditar o próprio sistema:

| Critério de Dahl | Estado no Código Público |
| --- | --- |
| **Participação efetiva** | Forte com vínculo; bloqueada na periferia sem maintainer/assembleia |
| **Igualdade de voto** | Forte na votação (sigilosa); ponderada por vínculo (T0–T5) na priorização |
| **Entendimento esclarecido** | **Diferencial:** a linguagem dupla (técnico/cidadão) e a deliberação informada são a resposta a este critério |
| **Controle da agenda** | Forte: a demanda nasce do cidadão, não da pauta de cima |
| **Inclusão dos adultos** | **O ponto fraco:** o vínculo valida, mas também pode excluir (a tensão central) |

O sistema é forte onde quase nenhum é — **entendimento esclarecido** e **controle
da agenda** — e fraco em **inclusão**, que é o desafio que define seu futuro.

---

## 16. A lacuna principal

A teoria avançou mais rápido que o sistema. O app atual ainda carrega o modelo
anterior:

```txt
Lei Orgânica → issue → PR cívico → votação → release
```

E precisa migrar para:

```txt
Ciclo OP → território → demanda → proposta → votação territorial → matriz → execução
```

Essa é a distância conceitual que orienta o roadmap (ver [lacunas.md](lacunas.md)
e [ESTRUTURA-DO-APP.md](ESTRUTURA-DO-APP.md)).

## 17. Perguntas em aberto

- Qual a duração do mandato territorial e o limite de mandatos consecutivos?
- Como calcular o índice de carência — e quais os limites comuns dos parâmetros locais?
- Como tratar território sem inscrito para sorteio?
- Qual o quórum de recall — e quem tem incentivo para acioná-lo (o problema do alarme)?
- Como impedir filtro institucional invisível?
- Como registrar divergência entre o sistema e o ato oficial?
- Como a execução frustrada altera o próximo ciclo?
- Como incluir a periferia sem abrir o flanco da Sybil (inclusão × fronteiras)?
- Há ajuda de custo ao sorteado — sem ela, o sorteio exclui o vulnerável?
- Qual evento deve ser ancorado externamente?

## 18. Síntese

> O Código Público aposta que a **arquitetura é constituição** (Lessig): território
> como contrapúblico (Fraser), entrada sem barreira e forkável (Benkler), seleção
> por sorteio democrático (Manin) com identidade forte e não-plutocrática (anti-Sybil),
> decisão por procedimento que tende a acertar (Estlund) sob regras comuns e
> parâmetros locais (Ostrom), poder limitado e contestável (Pettit) protegido até
> do *dominium* (denúncia sigilosa) e vigiado por matemática (Keane), execução que
> vira aprendizado (Fung) — e tudo aferido pelos critérios de Dahl, com a
> **inclusão** como o desafio que ainda não vencemos.

## 19. Referências teóricas

- Lawrence Lessig — *Code and Other Laws of Cyberspace* (1999).
- Bernard Manin — *The Principles of Representative Government* (1997).
- Hélène Landemore — *Open Democracy* (2020).
- Elinor Ostrom — *Governing the Commons* (1990).
- David Estlund — *Democratic Authority* (2008).
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
