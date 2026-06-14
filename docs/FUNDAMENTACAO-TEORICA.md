# Fundamentação Teórica — Código Público

> Documento de fundamentação política do projeto. Não é manifesto nem marketing:
> é o mapa entre **as teorias da democracia** e **o código que está rodando em
> produção**, com honestidade sobre o que já existe, o que falta e o que ainda
> não tem resposta. Serve como defesa intelectual do projeto e como bússola de
> roadmap.
>
> Convenção: onde uma teoria já está implementada, aponto o arquivo
> (`backend/...`). Onde é aspiracional, marco **[não implementado]**.

---

## 0. Tese central, em um parágrafo

O Código Público é uma instância executável de **Open Democracy** (Landemore,
2020): representação não-eleitoral, aberta e auditável, em que a legitimidade
nasce do **rito público verificável**, não da origem do mandato. Ele combina
quatro linhagens — **proceduralismo epistêmico** (Estlund), **democracia
monitória** (Keane), **republicanismo da não-dominação** (Pettit) e **governança
de comuns** (Ostrom) — e as torna *código* no sentido forte de Lessig: a
arquitetura do sistema **é** a constituição. Sua aposta distintiva é resolver o
problema mais difícil da democracia digital — **resistência a Sybil sem
plutocracia** — por meio de **vínculo territorial validado**, e tornar todo o
histórico **inviolável por encadeamento de hash**. Em uma frase: *democracia
monitória, procedimentalmente epistêmica, resistente a Sybil por território e
auditável por hash.*

---

## 1. O que estamos construindo (e o que estamos recusando)

### 1.1 A família a que pertencemos

| Tradição | Tese | Relação com o projeto |
| --- | --- | --- |
| Democracia direta (Rousseau, Atenas) | Todos decidem tudo | Rejeitada como modelo único: não escala e ignora competência |
| Representativa (Locke, Madison) | Delegamos a alguém | Preservada no rito formal (merge institucional), não na fonte da legitimidade |
| Deliberativa (Habermas, Fishkin) | O processo de decidir gera legitimidade | **Núcleo filosófico** — mas hoje subdesenvolvido no produto |
| **Open Democracy (Landemore)** | Representação aberta, rotativa, não-eleitoral, deliberativa | **Modelo-alvo** |

### 1.2 O que estamos recusando explicitamente

- **Liquid democracy / delegação transitiva de voto** (Bryan Ford, 2002;
  LiquidFeedback). Recusada: trocamos a delegação de voto pelo **vínculo
  territorial validado e contestável**. A legitimidade vem do pertencimento
  auditado, não da cadeia de procurações.
- **Governança plutocrática (DAOs / 1 token = 1 voto)**. Recusada na raiz: uma
  pessoa validada, peso por vínculo territorial, **nunca por capital**. O projeto
  é, deliberadamente, o que o mundo das DAOs tenta e falha em ser — governança
  digital Sybil-resistente e não-plutocrática, ancorada numa jurisdição real.

### 1.3 O nome do "quarto modelo"

Não é um modelo sem nome. O mais próximo na literatura é **democracia monitória**
(Keane, *The Life and Death of Democracy*, 2009): a era pós-representativa em que
o poder é continuamente vigiado por uma teia de mecanismos de escrutínio. O que é
genuinamente novo aqui não é o conceito — é a **execução criptograficamente
auditável e forkável** dele.

---

## 2. Mapa teoria → código

### A. Open Democracy — Hélène Landemore (2020)

**Tese.** A representação não precisa ser eleitoral. Mini-públicos, rotação,
deliberação aberta e seleção inclusiva podem produzir representação legítima sem
o filtro eleitoral (que favorece os já poderosos).

**No código.** O maintainer territorial pode nascer de eleição, indicação
legislativa, nomeação executiva ou designação emergencial
(`maintainer_policy.go`, `AppointmentInitialStatus`). O sistema **não exige**
eleição — exige **rito auditável**. Mandato com início e fim
(`term_start`/`term_end`, migration 011) implementa a **rotação** de Landemore.

**O que falta. [não implementado]** O pilar mais forte de Landemore — **seleção
por sorteio (mini-públicos)** — não existe. Hoje só há representante
eleito/indicado, nunca sorteado. É a maior aproximação possível ao estado da arte
(ver §6).

### B. Code is Law — Lawrence Lessig (*Code 2.0*, 2006)

**Tese.** A arquitetura de um sistema técnico regula comportamento como a lei
regula — e escolhas de design são escolhas políticas disfarçadas de técnicas.

**No código.** Isto deixa de ser metáfora: `territorial/policy.go` e
`maintainer_policy.go` **são texto constitucional**. Quando o sistema define
`RecontestationCooldown = 180 dias` ou `RecallQuorum = 50% + 1`, está legislando.
A camada de política pura (funções sem banco, testáveis) é, literalmente, a
**constituição operacional** — e os testes (`*_policy_test.go`) são o controle de
constitucionalidade.

**Consequência.** Toda constante default é uma decisão política que precisa ser
defensável publicamente, não escondida no commit. Por isso elas estão isoladas
e documentadas como **provisórias**.

### C. Proceduralismo epistêmico — David Estlund (*Democratic Authority*, 2008)

**Tese.** Falso dilema entre "legítimo porque seguiu o rito" e "legítimo porque o
resultado é bom". Um procedimento é legítimo quando é **justo** *e* **tende a
acertar mais que as alternativas** — sem nunca garantir o acerto (falibilismo).

**Por que resolve a nossa tensão central.** A aposta do projeto no procedimento
não é proceduralismo puro (legitimidade por sorteio cego). É **epistêmica**: o
merge institucional não é automático; o rito (reviews técnicos, jurídicos,
populares, checks de admissibilidade) **qualifica** a decisão. Estlund nos dá o
nome exato da posição implícita do sistema — e dissolve a contradição que parecia
existir entre legitimidade procedimental e substantiva.

### D. Democracia monitória + "quem vigia o vigia" — Keane (2009)

**Tese.** Poder legítimo é poder continuamente monitorado.

**No código — e este é o achado mais bonito do projeto.** A **cadeia de hash
encadeada** (`audit/audit.go`, migration 010) resolve o problema de 2.000 anos —
*quis custodiet ipsos custodes?* No topo da hierarquia (SysAdmin, Maintainer
Geral) **não há principal superior para apelar**. A resposta clássica seria "mais
um vigia" (regressão infinita). A resposta do sistema é **matemática**: cada
evento carrega `prev_hash` + `event_hash`; alterar o passado quebra a cadeia de
forma detectável. Ninguém precisa vigiar o vigia se a adulteração é
*impossível de esconder*. A ancoragem externa (`blockchain/anchor.go`) leva isso
para fora do próprio sistema. **Não é segurança por confiança; é segurança por
verificabilidade.**

### E. Republicanismo da não-dominação — Philip Pettit (1997; 2012)

**Tese.** Liberdade é ausência de **dominação** (poder arbitrário sobre você),
não mera ausência de interferência. Você é livre quando pode "olhar nos olhos"
de quem tem poder sobre você sem medo (*eyeball test*).

**No código.**
- *"Maintainer não é dono do bairro"* é republicanismo puro: mandato limitado,
  recusa **exige justificativa** (a API rejeita recusa silenciosa — 400),
  destituição só por processo (`CanRemoveForCause`), nada irrecorrível.
- **Contestabilidade** (o conceito operacional de Pettit) está implementada como
  fluxo de primeira coisa: contestação comunitária + recurso ao Maintainer Geral
  + moção de recall. O sistema é deliberadamente **mais editorial que eleitoral**
  — seu valor está em *poder desafiar* decisões, não só em *escolher*
  representantes. Isso é uma virtude de design, não acaso.

**A cegueira que precisamos encarar — imperium vs. dominium.** Pettit distingue
dominação pelo poder público (*imperium*) da dominação por poder privado
(*dominium*: patrão, dono de terra, milícia). O sistema combate o *imperium* (o
maintainer) com maestria. Mas **a governança territorial é toda pública** —
contestar um vínculo ou assinar um recall expõe o cidadão à retaliação do
*dominium*. Protegemos o **voto** contra o dominium (sigiloso, agregado, recibo
que não codifica a escolha — `votings_repository.go`), mas **não protegemos a
governança**. Em território capturado por milícia, transparência radical pode
ser perigosa. **Tensão não resolvida** (ver §5).

### F. Principal-Agente — Jensen & Meckling (1976); McCubbins & Schwartz (1984); Olson (1965)

**Tese.** Delegar poder cria três males inevitáveis: o agente age no próprio
interesse, o principal não monitora tudo, a informação é assimétrica.

**No código.** O sistema inteiro é uma máquina de reduzir assimetria de
informação: justificativa obrigatória, status público, trilha de auditoria. O
`pr_transition_events` (migration 007) registra quem moveu o quê e por quê.

**O que a teoria nos cobra.**
- **Alarme de incêndio, não patrulha** (McCubbins & Schwartz): em vez de
  monitoramento constante (caro), gatilhos que ativam fiscalização. O recall e a
  contestação são alarmes. ✓
- **O problema real é o *under-firing*** (Olson, ação coletiva): fiscalizar é bem
  público, cidadãos dispersos sub-investem. O *cooldown* de 180 dias protege
  contra o *over-firing* (contestação vexatória), mas **nada garante que o alarme
  seja puxado quando deve**. A correção ostromiana: monitoramento por um
  **subconjunto designado** (associações locais, "oposição leal"), não por todos.
  **[não implementado]** — não há ator com incentivo estrutural para fiscalizar.

### G. Governança de comuns — Elinor Ostrom (*Governing the Commons*, 1990)

**Tese.** Comunidades gerem recursos comuns sem Estado nem mercado quando seguem
oito princípios de design. O insight que vale o Nobel não é "horizontalidade
funciona" — é **policentrismo**: cada comum **escreve as próprias regras**.

**Avaliação honesta contra o código** (corrigindo a leitura otimista de "7 de 8"):

| Princípio | Implementação real | Veredito |
| --- | --- | --- |
| 1. Fronteiras claras | Vínculo T0–T4 validado e contestável (`009`, `policy.go`) | **Forte** |
| 2. Regras adaptadas ao local | Mandato 90/365 e quórum 50%+1 são constantes **globais** | **Fraco** |
| 3. Afetados modificam as regras | Cidadão age *dentro* das regras; o bairro não **legisla** sobre elas | **Fraco** |
| 4. Monitoramento | Cadeia de hash + status público (`010`) | **Forte** |
| 5. Sanções graduais | Maintainer: revisão → suspenso → destituído (`011`) | **Parcial** |
| 6. Resolução de conflito acessível | Recurso ao Geral + contestação | **Parcial** (acessível?) |
| 7. Reconhecimento externo | Município/SysAdmin reconhece a governança | **Presente** |
| 8. Governança aninhada | SysAdmin → Geral → Territorial | **Forte** |

**A crítica ostromiana mais profunda:** o sistema é **centralizador demais na
confecção das regras**. Ele deixa o território *operar* as regras, mas não
*escrever* as suas. Princípios 2 e 3 — os mais distintivos de Ostrom — são
justamente os mais fracos. Tornar mandato, quórum e exigências de vínculo
**configuráveis por território** seria o passo mais ostromiano (e mais
transformador) possível. **É a lacuna teórica nº 1 do projeto.**

### H. Produção entre pares + resistência a Sybil — Benkler (2006); Douceur (2002); Buterin et al. (2022)

**Tese (Benkler).** Produção colaborativa em rede é um terceiro modo de
organização — nem hierarquia nem mercado — quando contribuições são modulares,
granulares e de baixo custo de integração. Reputação pública vira moeda.

**A epistemologia política do Git.** O Git não é só metáfora: é um modelo de
**epistemologia política**. Toda mudança normativa tem **autor, histórico,
reversibilidade e revisão por pares**. Isso é uma teoria do conhecimento
aplicada à lei — a norma deixa de ser oráculo e vira artefato versionado,
falível e forkável. *Democracia forkável.*

**O problema que Benkler não resolve e o projeto sim — Sybil.** Sistemas abertos
morrem de **ataque Sybil** (identidades falsas capturam a votação). O vínculo
territorial validado + CPF-hash é, tecnicamente, **resistência a Sybil** — o
problema mais difícil de toda democracia digital (toda a literatura de *proof of
personhood*: BrightID, Worldcoin, *soulbound tokens* de Buterin/Weyl/Ohlhaver,
2022). O projeto resolve isto sem biometria global e sem token: por
**pertencimento jurisdicional auditado**. **[parcial]** — depende hoje de CPF +
data de nascimento (dado semi-público no Brasil); o salto de robustez é a
integração com identidade forte (gov.br).

### I. Representação — Hanna Pitkin (1967); Jane Mansbridge (1999)

**Tese (Pitkin).** Quatro modos: formal (como é autorizado), descritivo (parece
com quem representa), simbólico, substantivo (age pelos interesses).

**No código.** O sistema privilegia o **formal** (rito de nomeação auditado) e o
**substantivo** (contestabilidade força o agir-pelos-interesses). Ignora o
**descritivo**.

**Quando a lacuna dói mais — Mansbridge.** A representação descritiva importa
*mais* sob **desconfiança** e **interesses não cristalizados**. Tradução: a
lacuna descritiva se concentra **exatamente na periferia desconfiada da elite** —
o público que o projeto mais quer servir. Não é uma lacuna uniforme; é uma lacuna
focada onde o sistema mais precisa funcionar. Solução leve: autodeclaração
**opcional** de perfil do representante (morador, tempo de moradia, vínculo com
organizações), como informação pública — nunca como filtro. **[não implementado]**

### J. Esfera pública e seus limites — Habermas (1996); Fraser (1990); Sunstein (2001)

**Tese.** Decisões são legítimas quando saem de deliberação racional, pública,
inclusiva e livre de coerção (Habermas).

**Os limites que precisamos respeitar.**
- **Polarização de grupo** (Sunstein, *Republic.com*): fórum aberto e assíncrono
  não tende ao consenso — tende ao flame war e à câmara de eco. A "situação ideal
  de fala" exige **voz igual**; texto assíncrono com letramento assimétrico viola
  isso por construção.
- **Contrapúblicos subalternos** (Fraser): a esfera pública de Habermas excluía
  os subalternos; a resposta são espaços onde grupos marginalizados formulam
  demandas longe do olhar dominante. **Releitura generativa:** cada território
  pode ser um contrapúblico fraseriano — argumento *a favor* da autonomia local
  de regras (§G) — mas só funciona se a periferia conseguir **entrar** (daí a
  urgência da "UI que esconde a constituição").

---

## 3. O teste de Dahl (autoavaliação)

Robert Dahl (*Democracy and Its Critics*, 1989) define cinco critérios de um
processo democrático. Usados como grade de avaliação do sistema:

| Critério de Dahl | Estado no Código Público |
| --- | --- |
| **Participação efetiva** | Forte para quem tem vínculo; bloqueada para a periferia sem maintainer |
| **Igualdade de voto** | Forte no módulo de votação (1 pessoa, 1 voto, sigiloso); frágil na governança (peso de letramento) |
| **Entendimento esclarecido** | **Diferencial:** a linguagem dupla (modo técnico / modo cidadão) é exatamente a resposta de Dahl a este critério |
| **Controle da agenda** | Issues e PRs cívicos dão controle de agenda ao cidadão — forte conceitualmente |
| **Inclusão dos adultos** | **O ponto fraco:** o vínculo valida, mas também pode excluir (ver §5) |

O sistema é forte em "entendimento esclarecido" e "controle da agenda" — raro — e
fraco em "inclusão", que é o desafio central.

---

## 4. O que já temos (inventário sólido)

- **Resistência a Sybil não-plutocrática** por vínculo territorial validado.
- **Inviolabilidade do histórico** por hash encadeado + ancoragem (resposta ao
  "quem vigia o vigia").
- **Não-dominação institucional**: mandato limitado, justificativa obrigatória,
  destituição só por processo, nada irrecorrível.
- **Contestabilidade** em três instâncias (contestação, recurso, recall).
- **Proceduralismo epistêmico**: o rito qualifica a decisão sem automatizá-la.
- **Linguagem dupla** (entendimento esclarecido de Dahl).
- **Ciclo cívico fechado**: issue → PR → diff → votação (encerra sozinha no
  prazo) → merge → release → fiscalização.
- **Constituição como código testável** (policy pura + testes constitucionais).

---

## 5. Obstáculos e desafios (ranqueados)

1. **Centralização da confecção de regras** (Ostrom 2 e 3). O território opera,
   mas não legisla. Maior lacuna teórica.
2. **Exclusão da periferia desorganizada.** "Bairro sem maintainer não aceita
   vínculos" protege fronteiras (Ostrom 1) mas pode reproduzir a desigualdade de
   capital social que o projeto quer corrigir — o "problema de Aaron Swartz":
   sistemas abertos reproduzem desigualdade de acesso se não desenhados contra
   isso. A válvula (cadastro provisório T1, fila, UI simples) é mitigação parcial.
3. **Transparência que expõe ao *dominium*.** Governança pública pode entregar o
   cidadão ao poder privado. O sigilo do voto não se estende à governança.
4. **Under-firing do alarme.** Sem ator com incentivo estrutural para fiscalizar,
   o recall pode nunca ser acionado (ação coletiva de Olson).
5. **Deliberação que polariza.** Fórum aberto sem estrutura → câmara de eco
   (Sunstein). Falta deliberação estruturada antes do voto.
6. **Lacuna descritiva** na representação, concentrada onde mais dói (Mansbridge).
7. **Paradoxo de bootstrap.** Quem nomeia o *primeiro* maintainer, antes de
   existir qualquer instância legítima? Hoje: o SysAdmin (admin municipal). É uma
   costura de legitimidade — a origem do sistema é, inevitavelmente, um ato de
   autoridade não-democrática. Honestidade exige nomeá-la.
8. **Identidade frágil.** CPF + data de nascimento são semi-públicos; a Sybil-
   resistência só fica forte com identidade real (gov.br).

---

## 6. O que a teoria manda construir (roadmap teórico-orientado)

1. **Autonomia local de regras** (Ostrom, policentrismo). Tornar mandato, quórum
   e exigências configuráveis por território. Cada bairro escreve sua regra
   dentro de limites comuns. *Prioridade teórica nº 1.*
2. **Sortição / mini-públicos** (Landemore, Van Reybrouck, *Against Elections*).
   Painéis de cidadãos sorteados para deliberar e decidir casos sensíveis. O
   sorteio é o método de seleção mais igualitário — antídoto direto ao problema
   de acesso (§5.2). É o que falta para o projeto *ser* Open Democracy de fato.
3. **Deliberação estruturada antes do voto** (Fishkin, *Deliberative Polls*):
   período obrigatório de argumentos e perguntas públicas aos candidatos/à
   medida, registrado e auditável, contra a polarização de Sunstein.
4. **Ator-alarme designado** (McCubbins & Schwartz): dar status a associações
   locais / observatórios para resolver o under-firing.
5. **Proteção contra dominium na governança**: avaliar sigilo (ou pseudonímia
   auditável) para assinatura de recall e contestação em contextos de risco.
6. **Perfil descritivo opcional** do representante (Mansbridge).
7. **Identidade forte** (gov.br) para fechar a resistência a Sybil.
8. *(Explorar)* **Voto quadrático** (Posner & Weyl, *Radical Markets*, 2018) como
   alternativa ao 1p1v que deixa a *intensidade* de preferência contar sem deixar
   o dinheiro contar — relevante para consultas onde minorias intensas importam.

---

## 7. As perguntas em aberto (as difíceis)

1. **Quem puxa o alarme?** Se fiscalizar é bem público sub-provido, qual ator tem
   incentivo estrutural para acionar o recall — e como criá-lo sem criar um novo
   poder a ser capturado?
2. **Transparência protege ou expõe?** Em que ponto a publicidade radical (que
   combate o *imperium*) passa a servir o *dominium*? O sigilo deveria se estender
   à governança, e a que custo de auditabilidade?
3. **Quem escreve as regras do bairro?** Até onde vai a autonomia de um território
   (Ostrom) antes de fraturar a constituição comum do município?
4. **Como incluir sem diluir?** Baixar a barreira de entrada da periferia sem
   abrir o flanco da Sybil-resistência. Inclusão (Dahl) vs. fronteiras (Ostrom 1).
5. **Legitimidade da origem.** O paradoxo de bootstrap tem solução democrática, ou
   todo sistema constitucional começa, inevitavelmente, por um ato fundador
   não-eleito (o "momento constituinte" de Sieyès/Arendt)?
6. **A linguagem dupla é suficiente?** Traduzir a constituição interna em
   linguagem cidadã resolve o entendimento esclarecido (Dahl) — ou apenas o
   desloca, exigindo confiança em quem traduz?

---

## 8. Caminho de leitura sugerido

1. Landemore, *Open Democracy* (2020) — quase o manual do que estamos construindo.
2. Ostrom, *Governing the Commons* (1990) — focar nos princípios 2, 3 e 8.
3. Estlund, *Democratic Authority* (2008) — capítulos sobre proceduralismo
   epistêmico.
4. Pettit, *On the People's Terms* (2012) — imperium/dominium e a dimensão
   editorial.
5. Keane, *The Life and Death of Democracy* (2009) — democracia monitória.
6. Fraser, "Rethinking the Public Sphere" (1990) e Lessig, *Code 2.0* (2006) — os
   dois textos curtos da crítica.
7. Dahl, *Democracy and Its Critics* (1989) — para autoavaliação contínua.

---

## 9. Mapa rápido: conceito → arquivo

| Conceito político | Onde vive no código |
| --- | --- |
| Fronteiras / vínculo (Ostrom 1, Sybil) | `migrations/009`, `territorial/policy.go` |
| Não-dominação, mandato, recall (Pettit) | `territorial/maintainer_policy.go`, `migrations/011` |
| Contestabilidade (Pettit) | `territorial/service.go` (contest, appeal) |
| Monitoramento / quem vigia o vigia (Keane) | `audit/audit.go`, `blockchain/anchor.go`, `migrations/010` |
| Proceduralismo epistêmico (Estlund) | `public/pr_statemachine.go`, merge institucional |
| Epistemologia do Git (Benkler) | diff normativo, `pr_transition_events` (`007`) |
| Voto sem dominium (Pettit) | `public/votings_repository.go` (sigilo, agregação) |
| Ciclo cívico com fim definido | encerramento automático de votações |
| Constituição como código testável (Lessig) | `*_policy.go` + `*_policy_test.go` |
| Entendimento esclarecido (Dahl) | linguagem dupla (modo técnico / cidadão) |

---

## 10. Síntese final

> O Código Público é uma constituição operacional para participação territorial:
> cada bairro tem governança, cada cidadão tem vínculo contestável e recorrível,
> cada decisão deixa rastro inviolável, e o sistema tenta impedir que a tecnologia
> vire apenas uma nova forma de captura política local.

A maturidade conceitual está à frente da execução — e os três desafios que
definem o futuro do projeto são **incluir sem diluir** (Dahl vs. Ostrom),
**distribuir a confecção das regras** (policentrismo) e **proteger o cidadão da
dominação privada** (dominium). Resolver esses três é o que separa um bom
software cívico de uma genuína inovação em teoria democrática aplicada.
