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
nasce do **rito público verificável** e da qualidade das decisões no exercício,
não apenas da origem do mandato. Ele combina linhagens consolidadas — a legitimidade
democrática pós-eleitoral de **Bernard Manin**, a **democracia monitória** de 
**John Keane**, o **proceduralismo epistêmico** de **David Estlund**, o 
**republicanismo da não-dominação** de **Philip Pettit**, a **governança de comuns**
de **Elinor Ostrom**, a inclusão ativa na presença de **Iris Marion Young**, e o
**aprendizado deliberativo e iterativo** de **Archon Fung** — e as materializa em
*código* no sentido forte de Lessig: a arquitetura do sistema **é** a constituição.
Sua aposta distintiva é resolver o problema da **resistência a Sybil sem plutocracia**
por meio de **vínculo territorial validado**, tornando todo o histórico cívico
**inviolável por encadeamento de hash**.

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

### A. Open Democracy — Hélène Landemore (2020) e Bernard Manin (1997)

**Tese.** A representação legítima não depende de eleição. Bernard Manin estabelece a distinção crucial entre **legitimidade de origem** (como o representante ascende ao cargo) e **legitimidade de exercício** (como atua no cargo). Historicamente, em Atenas, o sorteio era tido como democrático (por dar chances iguais a todos), enquanto a eleição era considerada aristocrática (pois favorece os ricos, visíveis e influentes). Landemore unifica isso propondo a "Open Democracy", onde mini-públicos, rotação, deliberação aberta e seleção inclusiva descentralizam o poder.

**No código.** O maintainer territorial pode nascer de eleição, indicação legislativa, nomeação executiva ou designação emergencial ([maintainer_policy.go](file:///C:/Users/dionatan.resende/Downloads/codigo-publico/backend/internal/territorial/maintainer_policy.go), [AppointmentInitialStatus](file:///C:/Users/dionatan.resende/Downloads/codigo-publico/backend/internal/territorial/maintainer_policy.go#L43)). O sistema foca na **legitimidade de exercício** através de um rito rigoroso de prestação de contas, justificativas e recall. Mandatos com datas explícitas de expiração (`term_start`/`term_end`, [migration 011](file:///C:/Users/dionatan.resende/Downloads/codigo-publico/backend/migrations/011_maintainer_protocol.sql)) garantem a **rotação** democrática.

**O que falta e como fundamentar.** A seleção por sorteio de conselheiros territoriais (mini-públicos) precisa ser construída na policy para inverter o ônus da prova contra a eleição: a indicação e a eleição são os vetores prováveis de captura local; o sorteio por aleatoriedade estruturada é a defesa legítima de origem.

### B. Code is Law — Lawrence Lessig (*Code 2.0*, 2006)

**Tese.** A arquitetura de um sistema técnico regula comportamento como a lei
regula — e escolhas de design são escolhas políticas disfarçadas de técnicas.

**No código.** Isto deixa de ser metáfora: [territorial/policy.go](file:///C:/Users/dionatan.resende/Downloads/codigo-publico/backend/internal/territorial/policy.go) e
[maintainer_policy.go](file:///C:/Users/dionatan.resende/Downloads/codigo-publico/backend/internal/territorial/maintainer_policy.go) **são texto constitucional**. Quando o sistema define
[RecontestationCooldown](file:///C:/Users/dionatan.resende/Downloads/codigo-publico/backend/internal/territorial/policy.go#L20) `= 180 dias` ou [RecallQuorum](file:///C:/Users/dionatan.resende/Downloads/codigo-publico/backend/internal/territorial/maintainer_policy.go#L131) `= 50% + 1`, está legislando.
A camada de política pura (funções sem banco, testáveis) é, literalmente, a
**constituição operacional** — e os testes (como [policy_test.go](file:///C:/Users/dionatan.resende/Downloads/codigo-publico/backend/internal/territorial/policy_test.go) e [maintainer_policy_test.go](file:///C:/Users/dionatan.resende/Downloads/codigo-publico/backend/internal/territorial/maintainer_policy_test.go)) são o controle de
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

### D. Democracia monitória e Escrutínio Escalável — John Keane (2009)

**Tese.** A democracia monitória é caracterizada pela proliferação de teias de escrutínio público que operam à margem das eleições clássicas, forçando nos detentores do poder uma consciência constante de prestação de contas (*humility*).

**No código.** A **cadeia de hash encadeada** ([audit/audit.go](file:///C:/Users/dionatan.resende/Downloads/codigo-publico/backend/internal/audit/audit.go), [migration 010](file:///C:/Users/dionatan.resende/Downloads/codigo-publico/backend/migrations/010_audit_hash_chain.sql))
resolve materialmente a regressão infinita de *quem vigia o vigia?*. No topo do
sistema (SysAdmin, Maintainer Geral), a resposta não é "mais um vigia", mas sim
a impossibilidade matemática de alterar o histórico retrospectivo em silêncio. A
ancoragem externa ([blockchain/anchor.go](file:///C:/Users/dionatan.resende/Downloads/codigo-publico/backend/internal/blockchain/anchor.go)) garante que o poder governante opere
sob permanente monitoramento público.

**O que falta e redundância.** Para que o monitoramento seja imune a governos fracos que possam capturar o próprio meio de ancoragem oficial (como o Diário Oficial municipal), é necessário projetar uma **redundância sistemática de âncoras**: a publicação da cabeça do hash tanto em meios oficiais locais quanto em periódicos independentes de ampla circulação ou blockchains públicas, garantindo a escala e a descentralização da prova histórica.

### E. Republicanismo da não-dominação — Philip Pettit (1997; 2012)

**Tese.** Liberdade é ausência de **dominação** (poder arbitrário sobre você),
não mera ausência de interferência. Você é livre quando pode "olhar nos olhos"
de quem tem poder sobre você sem medo (*eyeball test*).

**No código.**
- *"Maintainer não é dono do bairro"* é republicanismo puro: mandato limitado,
  recusa **exige justificativa** (a API rejeita recusa silenciosa — 400),
  destituição só por processo ([CanRemoveForCause](file:///C:/Users/dionatan.resende/Downloads/codigo-publico/backend/internal/territorial/maintainer_policy.go#L111)), nada irrecorrível.
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
que não codifica a escolha — [votings_repository.go](file:///C:/Users/dionatan.resende/Downloads/codigo-publico/backend/internal/public/votings_repository.go)), mas **não protegemos a
governança**. Em território capturado por milícia, transparência radical pode
ser perigosa. **Tensão não resolvida** (ver §5).

### F. Principal-Agente — Jensen & Meckling (1976); McCubbins & Schwartz (1984); Olson (1965)

**Tese.** Delegar poder cria três males inevitáveis: o agente age no próprio
interesse, o principal não monitora tudo, a informação é assimétrica.

**No código.** O sistema inteiro é uma máquina de reduzir assimetria de
informação: justificativa obrigatória, status público, trilha de auditoria. O
`pr_transition_events` ([migration 007](file:///C:/Users/dionatan.resende/Downloads/codigo-publico/backend/migrations/007_pr_state_machine.sql)) registra quem moveu o quê e por quê.

**O que a teoria nos cobra.**
- **Alarme de incêndio, não patrulha** (McCubbins & Schwartz): em vez de
  monitoramento constante (caro), gatilhos que ativam fiscalização. O recall e a
  contestação são alarmes. ✓
- **O problema real é o *under-firing*** (Olson, ação coletiva): fiscalizar é bem
  público, cidadãos dispersos sub-investem. O [cooldown de 180 dias](file:///C:/Users/dionatan.resende/Downloads/codigo-publico/backend/internal/territorial/policy.go#L20) protege
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
| 1. Fronteiras claras | Vínculo T0–T4 validado e contestável ([migration 009](file:///C:/Users/dionatan.resende/Downloads/codigo-publico/backend/migrations/009_territorial_governance.sql), [policy.go](file:///C:/Users/dionatan.resende/Downloads/codigo-publico/backend/internal/territorial/policy.go)) | **Forte** |
| 2. Regras adaptadas ao local | Mandato 90/365 e quórum 50%+1 são constantes **globais** | **Fraco** |
| 3. Afetados modificam as regras | Cidadão age *dentro* das regras; o bairro não **legisla** sobre elas | **Fraco** |
| 4. Monitoramento | Cadeia de hash + status público ([migration 010](file:///C:/Users/dionatan.resende/Downloads/codigo-publico/backend/migrations/010_audit_hash_chain.sql)) | **Forte** |
| 5. Sanções graduais | Maintainer: revisão → suspenso → destituído ([migration 011](file:///C:/Users/dionatan.resende/Downloads/codigo-publico/backend/migrations/011_maintainer_protocol.sql)) | **Parcial** |
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

### J. Esfera pública e Espaço Deliberativo — Habermas (1996); Fishkin (2018); Chwalisz (2017)

**Tese.** Decisões legítimas não decorrem da mera agregação mecânica de votos (racionalidade instrumental), mas do processo intersubjetivo de formação de consensos por meio de debates racionais, livres de coerção e orientados ao entendimento mútuo (racionalidade comunicativa).

**Os limites e a deliberação estruturada.**
- **Polarização de Grupo (Sunstein):** O debate assíncrono sem moderação tende a polarizar e a favorecer cúpulas com maior letramento e tempo livre. 
- **Contrapúblicos Subalternos (Nancy Fraser):** Periferias desorganizadas precisam de arenas protegidas para articular demandas sem a interferência ou intimidação da elite local.
- **Deliberative Polls e Assembleias Cidadãs (Fishkin & Chwalisz):** O Código Público precisa construir arquiteturas deliberativas estruturadas no intervalo entre a demanda e a votação. Três critérios devem ser codificados:
  1. *Informação Qualificada:* Acesso universal a pareceres técnicos e simplificados sobre a viabilidade das propostas.
  2. *Estrutura de Razões:* Interfaces de comentários que exijam a categorização de argumentos (prós, contras e trade-offs) em vez de fóruns genéricos de opinião.
  3. *Tempo Mínimo:* Estabelecer fases temporais obrigatórias de debate que impeçam votações rápidas e reativas.

### K. Política da Presença e Exclusão Estrutural — Iris Marion Young (2000); Anne Phillips (1995)

**Tese.** Processos e sorteios neutros não produzem representações neutras se aplicados em cima de desigualdades estruturais. A "política da presença" argumenta que o pertencimento e a inclusão efetiva das vozes mais vulneráveis exigem contramedidas sistêmicas, pois recursos de participação (tempo, segurança, habilidades de oratória) são desigualmente distribuídos.

**No código e no Whitepaper.** 
- O sorteio por aleatoriedade simples corre o risco de sobre-representar elites instruídas se o pool de elegíveis for puramente *opt-in*. A modelagem do sorteio deve avançar para o **Convite Ativo** (seleção aleatória do registro geral de cidadãos com convites diretos) para neutralizar a autoseleção.
- A **Ajuda de custo ao conselheiro sorteado** deixa de ser um detalhe administrativo opcional. Sob a lente de Young, ela é uma **garantia constitucional** de viabilidade de participação: sem ela, a sortição exclui sistematicamente trabalhadores que não dispõem de flexibilidade laboral, elitizando o conselho por padrão.

### L. Teoria da Implementação e Participação Empoderada — Archon Fung (2004); Dani Rodrik (2007)

**Tese.** Projetos de governança local só se sustentam a longo prazo se apresentarem devolução real de poder (decisão vinculante), supervisão institucional externa robusta contra captura e um canal contínuo de **aprendizado iterativo** (capacidade do sistema aprender com seus próprios ciclos).

**No código.** O Código Público atende à devolução real ao alimentar a LOA. Contudo, falta modelar as regras do **ciclo de retroalimentação**. O sistema precisa registrar a conformidade da execução de releases passadas e usá-la como condicionador do ciclo orçamentário subsequente. O regimento de governança local deve prever um "rito de encerramento de ciclo" onde a comunidade e as instâncias monitórias revisam o desempenho e ajustam os pesos das fórmulas de forma deliberada.

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
- **Constituição como código testável** (camada de policy pura + testes constitucionais como [policy_test.go](file:///C:/Users/dionatan.resende/Downloads/codigo-publico/backend/internal/territorial/policy_test.go) e [maintainer_policy_test.go](file:///C:/Users/dionatan.resende/Downloads/codigo-publico/backend/internal/territorial/maintainer_policy_test.go)).

---

## 5. Obstáculos e desafios (ranqueados)

1. **Centralização da confecção de regras** (Ostrom 2 e 3). O território opera, mas não legisla sobre seus próprios parâmetros (quóruns, tempos).
2. **Exclusão da periferia desorganizada e viés de autoseleção** (Young & Phillips). Bairros com menor capital social demoram a nomear maintainers, e o sorteio puramente opt-in tende a elitizar a participação.
3. **Transparência que expõe ao *dominium* (Pettit).** Assinar moções de recall ou contestar vínculos em público pode expor o cidadão à coerção miliciana, privada ou empresarial do território.
4. **Deliberação sem qualidade (Habermas & Fishkin).** A ausência de interfaces que exijam apresentação racional de argumentos e forneçam relatórios simplificados degrada a inteligibilidade do debate.
5. **Under-firing do alarme (Olson).** Falta de atores dedicados e institucionalizados para fiscalizar e alertar a comunidade sobre desvios do maintainer, incorrendo no paradoxo da ação coletiva.
6. **Fragilidade do canal de aprendizado (Fung).** Risco de o sistema virar um ritual burocrático anual repetitivo sem mecanismos formais de ajuste e melhoria das regras após cada ciclo.
7. **Paradoxo de bootstrap.** A nomeação do primeiro mantenedor de um ciclo é, por necessidade histórica, um ato autoritário do administrador local.
8. **Segurança de Identidade.** Dependência de dados de CPF e nascimento, cuja fragilidade de proteção contra perfis falsos só se resolve de forma confiável via OAuth do gov.br.

---

## 6. O que a teoria manda construir (roadmap teórico-orientado)

1. **Autonomia local de regras (Ostrom):** Parâmetros locais do regimento configuráveis por território (dentro de limites constitucionais comuns).
2. **Sortição baseada em Convite Ativo (Landemore & Young):** Sorteio a partir do cadastro geral, complementado por ajuda de custo vinculante no regimento.
3. **Mapeamento de Deliberação Estruturada (Fishkin & Chwalisz):** Fases obrigatórias de informação simplificada pré-votação e caixa de comentários baseada em categorização de razões/trade-offs.
4. **Mecanismo de Aprendizado Iterativo (Fung):** Painéis pós-ciclo para aferição de conformidade das releases de obras e ajuste de parâmetros operacionais.
5. **Redundância de Âncoras Monitórias (Keane):** Protocolo de publicação de hashes em blockchain pública e jornal impresso local além do Diário Oficial.
6. **Proteção de Governança contra o Dominium (Pettit):** Assinaturas de recall e contestação mascaradas sob criptografia homomórfica ou ZKP, decodificáveis sob intervenção do tribunal geral.
7. **Representação Quadro-Direcional (Mansbridge):** Mapeamento do papel do conselheiro sorteado (giroscópico + substitutivo temporário) na interface pública.
8. **Identidade Forte (OAuth2 gov.br):** Implementação final do validador federado estatal para Sybil-resistência robusta.

---

## 7. As perguntas em aberto (as difíceis)

1. **Quem financia o comum?** A ajuda de custo como garantia da presença periférica deve vir de um fundo municipal fixado em lei ou do próprio envelope do OP? Como blindar esse financiamento contra contingenciamento político?
2. **ZKP vs. Transparência Plena:** Até que ponto o uso de criptografia de preservação de privacidade (ZKP/Pseudonímia) para proteger os participantes do *dominium* local enfraquece a facilidade de auditoria popular ordinária?
3. **Resistência ao Opt-in Bias:** Se o convite ativo para o sorteio do conselho for recusado massivamente por cidadãos vulneráveis, o sorteio deve insistir na reposição até atingir a proporcionalidade desejada ou aceitar a composição final?
4. **O conflito do rito constituinte (Bootstrap):** O momento fundador do Código Público é inevitavelmente tecnocrático/autoritário. Como realizar a transição rápida desse ato de força para uma legitimidade democrática plena?

---

## 8. Caminho de leitura sugerido

1. Landemore, *Open Democracy* (2020) & Manin, *Principles of Representative Government* (1997) — os pilares do sorteio e da inversão do ônus eleitoral.
2. Ostrom, *Governing the Commons* (1990) — focar nos princípios 2, 3 e 8.
3. Young, *Inclusion and Democracy* (2000) & Phillips, *The Politics of Presence* (1995) — a crítica ao procedimentalismo abstrato e a defesa da presença.
4. Fung, *Empowered Participation* (2004) & Rodrik, *One Economics, Many Recipes* (2007) — as teorias de implementação local e ciclos de aprendizado.
5. Fishkin, *Democracy When the People Are Thinking* (2018) & Chwalisz, *The People's Verdict* (2017) — deliberação informada e mini-públicos.
6. Pettit, *On the People's Terms* (2012) — imperium/dominium e a dimensão editorial de contestabilidade.
7. Keane, *The Life and Death of Democracy* (2009) — monitoramento público contínuo e *humility*.
8. Dahl, *Democracy and Its Critics* (1989) — grade analítica de inclusão e esclarecimento.

---

## 9. Mapa rápido: conceito → arquivo

| Conceito político | Onde vive no código |
| --- | --- |
| Legitimidade de Exercício (Manin) | Justificativa de recusa em `territorial/policy.go`, logs de transição |
| Sorteio / Mini-público (Landemore/Young) | `[não implementado]` — no roadmap de `maintainer_policy.go` |
| Redundância de Âncoras (Keane) | Interface em `blockchain/anchor.go` |
| Deliberação Estruturada (Chwalisz/Fishkin) | `[não implementado]` — em `public/contracts.go` (tipos de comentários/anexos) |
| Não-dominação e Contestação (Pettit) | `territorial/service.go` (contest, appeal) |
| Ciclos de Aprendizado Iterativo (Fung) | `[não implementado]` — regras de encerramento em `public/` |
| Vínculo & Sybil-resistência (Ostrom 1 / Buterin)| `migrations/009`, `territorial/policy.go` |
| Constituição como código testável (Lessig) | `*_policy.go` + `*_policy_test.go` |
| Entendimento esclarecido (Dahl) | Camada de tradução de status da UI (modo cidadão) |

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
