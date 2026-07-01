# Fronteira — Delegação de Voto e Agentes Deliberativos de IA

> Status: **rascunho de visão**. Este documento explora duas evoluções de
> fronteira para o Código Público. Nenhuma delas é trivial; ambas tocam em
> tensões profundas da teoria democrática. O tom é o mesmo do resto do projeto:
> **propor com rigor, nomear os limites, não vender o que não resolvemos.**

---

## Contexto

O Código Público já resolve um problema difícil: transformar demanda territorial
em decisão orçamentária rastreável. Mas o sistema atual opera com dois pressupostos
que limitam a participação:

1. **Todo cidadão precisa votar pessoalmente.** Se ele não tem tempo, não entende
   o tema ou simplesmente não comparece, seu interesse desaparece.
2. **Todo cidadão precisa acompanhar o ciclo ativamente.** Se ele não lê as
   demandas, não vê os filtros, não entende os trade-offs, vota às cegas ou não
   vota.

Duas evoluções podem atacar esses limites:

```txt
A. Delegação de voto (liquid democracy)
   → o cidadão transfere seu poder de voto a alguém que confia

B. Agente deliberativo de IA personalizado
   → uma IA pessoal que informa, debate e, com autorização, age em nome do cidadão
```

Ambas são teoricamente densas, tecnicamente viáveis e politicamente perigosas se
mal desenhadas. Este documento trata cada uma com a honestidade que o projeto exige.

---

# Parte I — Delegação de Voto (Liquid Democracy)

## 1. O conceito

**Bryan Ford** (*Delegative Democracy*, 2002; *A Liquid Perspective on Democratic
Choice*, 2020) propõe um modelo onde o cidadão pode:

- votar diretamente em qualquer tema (democracia direta);
- **delegar seu voto** a outra pessoa de confiança (democracia representativa);
- revogar a delegação a qualquer momento;
- delegar para pessoas diferentes em temas diferentes.

A delegação pode ser **transitiva**: se A delega para B, e B delega para C, o voto
de A é exercido por C. Isso cria uma **rede de confiança dinâmica** — diferente da
eleição fixa, onde o representante é escolhido uma vez e age por 4 anos.

## 2. Por que faz sentido no Código Público

O OP municipal opera com dezenas de demandas, propostas, filtros e votações por
ciclo. O cidadão que trabalha 12 horas por dia, tem dois filhos e mora na periferia
**não vai acompanhar tudo**. Hoje, seu voto simplesmente desaparece — e com ele,
a voz do território.

A delegação resolve isso sem tirar o direito: o cidadão que não pode participar
**transfere temporariamente** seu poder a alguém que pode. O vizinho que vai às
assembleias. A professora que entende de educação. O conselheiro territorial que
já está imerso no ciclo.

No Código Público, a delegação seria **territorial e temática**:

```txt
Maria delega seu voto de saúde → Dona Rosa (agente comunitária de saúde)
Maria delega seu voto de infraestrutura → João (pedreiro, conselheiro territorial)
Maria mantém seu voto direto em educação → vota pessoalmente
```

## 3. Como operaria no protocolo

```txt
Regras de delegação (kernel comum):

1. A delegação é voluntária e revogável a qualquer momento.
2. O cidadão pode delegar por tema ou para todas as votações do ciclo.
3. A delegação é transitiva com limite de profundidade (regimento local, faixa 1–3).
4. O delegatário deve ter vínculo territorial validado no mesmo território.
5. A delegação não é pública — apenas o delegante e o delegatário sabem.
6. O voto exercido por delegação é indistinguível do voto direto no resultado.
7. O cidadão pode sobrepor a delegação: se votar diretamente, a delegação é
   anulada para aquela votação.
8. Nenhum delegatário pode acumular mais de X% dos votos do território
   (teto de concentração, regimento local).
9. A delegação gera audit event (hash, sem revelar quem delegou a quem).
10. O conselho territorial não pode ser delegatário enquanto conselheiro
    (conflito de interesse: quem facilita não acumula poder de voto).
```

### 3.1 Teto de concentração — o anti-superdelegate

O risco mais grave da liquid democracy é o **superdelegado**: uma pessoa que
acumula tantos votos delegados que efetivamente governa o território. Ford (2020)
documenta que isso aconteceu em experiências reais (Pirate Party alemão, LiquidFeedback).

A salvaguarda é um **teto de concentração**: nenhum delegatário pode carregar
mais de X% dos votos vinculados do território (regimento local, faixa 10%–25%).
Se o teto é atingido, novas delegações são recusadas e o sistema notifica o
delegante para escolher outro ou votar diretamente.

### 3.2 Não-transitividade como default seguro

A transitividade (A→B→C) é a feature mais poderosa e mais perigosa da liquid
democracy. Ela multiplica o alcance da delegação, mas também multiplica a
opacidade: A pode não saber que seu voto está sendo exercido por C.

No Código Público, a proposta é:

```txt
Default: delegação NÃO transitiva (profundidade 1)
Opt-in: o delegante pode permitir transitividade com profundidade máxima de 2–3
Regimento local: define se transitividade é permitida e qual a profundidade
Kernel: profundidade máxima absoluta = 3 (protege contra cadeia opaca)
```

### 3.3 A delegação como inclusão — o argumento de Landemore invertido

Landemore (2020) argumenta que a representação não-eleitoral (sorteio) é mais
democrática. A delegação parece contradizer isso — é representação por escolha.
Mas o argumento se inverte no contexto do OP territorial:

- O sorteio resolve **quem facilita** (conselho territorial).
- A delegação resolve **quem não pode estar presente mas quer participar**.

São problemas diferentes. O sorteio combate captura; a delegação combate
**exclusão por indisponibilidade**. A mãe solteira que delega seu voto à
vizinha não está sendo representada por um político — está exercendo uma forma
de **solidariedade epistêmica**: confia que a vizinha sabe o que o bairro precisa.

> **O limite:** a delegação pode reproduzir hierarquias locais. Se o patrão
> "pede" que o empregado delegue para ele, a delegação vira instrumento de
> *dominium* (Pettit). A salvaguarda é que a delegação é **sigilosa** (apenas o
> delegante sabe), **revogável a qualquer momento** e não é pública — o patrão
> nunca pode verificar se a delegação realmente aconteceu. É a mesma lógica do
> voto sigiloso: a coerção é impossível se o resultado é inverificável.

---

# Parte II — Agentes Deliberativos de IA

## 4. O conceito

Cada cidadão teria acesso a um **agente de IA personalizado** — um assistente que
opera dentro do Código Público como extensão epistêmica do cidadão. Não é um bot
que vota automaticamente; é um **parceiro deliberativo** que:

```txt
Nível 1 — Informar
  "Tem 3 demandas novas no seu bairro esta semana."
  "A proposta de iluminação da Rua X atingiu o limiar de apoio."
  "O conselho territorial aplicou filtro na demanda Y — quer ver a justificativa?"

Nível 2 — Debater
  "A proposta de PSF tem 3 forks. Quer que eu resuma os prós e contras de cada?"
  "O custo da proposta Z excede o sub-envelope. As alternativas são: fasear,
   reduzir escopo ou enviar para ciclo plurianual. Qual prefere?"
  "Outros moradores do seu bairro estão divididos entre Fork A e Fork C. Quer
   ver os argumentos de cada lado?"

Nível 3 — Recomendar
  "Com base nas demandas que você apoiou e nos seus interesses declarados, eu
   recomendaria votar na Proposta W. Quer ver por quê?"
  "Dona Rosa, a quem você delegou seu voto de saúde, votou na Proposta V. Você
   concorda ou quer sobrepor?"

Nível 4 — Agir (com autorização explícita)
  "Você me autorizou a apoiar automaticamente demandas de saneamento no seu
   bairro. Apoiei a Demanda 47. Quer revisar?"
  "Você me delegou o voto em infraestrutura com instrução 'priorizar iluminação'.
   Votei na Proposta X. Recibo salvo."
```

## 5. Fundamentação teórica

### 5.1 Agência epistêmica aumentada — não substituída

O risco central de qualquer IA em democracia é a **erosão da agência epistêmica**:
o cidadão para de pensar por si mesmo e delega o pensamento à máquina. Pesquisas
do Stanford Deliberative Democracy Lab (2024-2025) e análises em NeurIPS mostram
que LLMs podem facilitar deliberação de qualidade — mas também podem criar
**câmaras de eco**, **vieses de confirmação** e **hipnocracia** (o cidadão é
guiado sem perceber).

A resposta de design é a **graduação por níveis**:

```txt
Nível 1 (Informar)    → o agente é curador, não opinador
Nível 2 (Debater)     → o agente é interlocutor socrático
Nível 3 (Recomendar)  → o agente é conselheiro com justificativa
Nível 4 (Agir)        → o agente é delegatário com instrução e recibo
```

A diferença entre os níveis não é técnica — é de **consentimento informado**. O
cidadão precisa optar explicitamente em cada nível, entender o que está
autorizando e poder revogar a qualquer momento. O default é Nível 1.

### 5.2 Fishkin digital — a deliberação que não existe se não for mediada

Fishkin (2009) demonstra que mini-públicos informados produzem melhores decisões.
Mas no OP territorial, a "informação" nem sempre chega. O cidadão da periferia
pode ter acesso ao sistema, mas não tem tempo para ler 40 propostas e entender os
trade-offs de cada uma.

O agente de IA resolve o **gargalo de atenção**: ele lê tudo, sintetiza, e
apresenta ao cidadão no nível de detalhe que ele pede. Não é automação da
decisão — é **automação do briefing** que Fishkin considera pré-condição da
deliberação de qualidade.

### 5.3 O agente como extensão do contrapúblico — Fraser digital

Fraser (1990) define contrapúblico como o espaço onde o subalterno formula sua
demanda na sua própria linguagem. O agente de IA pode ser o **tradutor** que
conecta a constituição interna do sistema à linguagem do cidadão:

```txt
Sistema: "budget_proposal_returned_to_maturation_due_to_insufficient_info"
Agente: "Sua proposta de saneamento voltou para ajuste. Faltam dados sobre a
         extensão da rede. Quer que eu ajude a complementar?"
```

O agente não é neutro — é **aliado do cidadão**. Sua lealdade é para o dono, não
para o sistema, não para o município, não para o conselho territorial. Isso é
fundamental: o agente é **contrapúblico digital pessoal**.

### 5.4 A "cadeira vazia" — surfacing vozes ausentes

Uma das aplicações mais promissoras da IA em deliberação é o conceito de
**"The Empty Chair"** (Carnegie Endowment, 2024): a IA representa perspectivas
que não estão na sala. No OP territorial, isso se traduz em:

```txt
"Nenhum idoso apoiou esta demanda de praça. Posso sugerir que idosos
 do bairro sejam notificados?"

"Esta proposta de transporte escolar não tem apoio da zona rural.
 Quer ver o que cidadãos rurais priorizaram em ciclos anteriores?"
```

O agente pode **surfar perspectivas ausentes** — não para votar por elas, mas
para tornar a deliberação mais completa.

## 6. Riscos nomeados e salvaguardas

### 6.1 Manipulação algorítmica

Se o agente recomenda, ele influencia. Se influencia, pode ser capturado. Um
agente manipulado pelo município, pelo partido ou pelo provedor de IA seria
**a ferramenta mais eficiente de coerção já criada**.

```txt
Salvaguardas:

1. O agente roda LOCALMENTE ou em infraestrutura do cidadão, não do município.
2. O modelo de IA é auditável e open source (ou pelo menos o prompt/instrução).
3. O cidadão pode ver a cadeia de raciocínio do agente (explicabilidade).
4. O agente nunca vota sem autorização explícita e revogável.
5. O agente não tem acesso ao voto de outros cidadãos (apenas resultados agregados).
6. O audit trail registra ações do agente (hash, sem conteúdo pessoal).
7. O kernel proíbe agentes opacos: se o cidadão não pode entender por que o
   agente recomendou X, a recomendação é inválida.
```

### 6.2 Homogeneização de preferências

Se todos usam o mesmo modelo de IA com o mesmo prompt, as recomendações convergem
e a diversidade deliberativa desaparece. O risco é a **hipnocracia** — participação
que parece ativa mas é guiada por algoritmo.

```txt
Salvaguardas:

1. O agente é PERSONALIZADO: cada cidadão pode instruir seu agente com valores,
   prioridades e limites próprios.
2. O sistema permite MÚLTIPLOS provedores de agente — não é monopólio.
3. O agente deve apresentar argumentos CONTRA sua recomendação (debate socrático).
4. O sistema mede diversidade de votos: se a entropia cai drasticamente após
   adoção de agentes, o protocolo emite alerta.
5. O Nível 4 (agir) deve ter cooldown e revisão obrigatória antes de confirmar.
```

### 6.3 Ataque Sybil por agentes

Se agentes podem votar, agentes falsos podem votar. O vínculo territorial com
identidade civil (gov.br) protege contra isso: **1 pessoa = 1 agente = 1 voto**.
O agente não é uma identidade separada — é uma extensão da identidade civil
verificada do cidadão.

### 6.4 Desigualdade de acesso à IA

Se o agente de IA melhora a participação, quem não tem acesso fica em
desvantagem. É o problema de inclusão (Dahl, §21 da fundamentação) em nova forma.

```txt
Salvaguardas:

1. O Nível 1 (informar) deve ser GRATUITO e acessível sem hardware especial.
2. O município pode oferecer agentes públicos como serviço (infraestrutura de IA
   municipal), assim como oferece acesso à internet em praças.
3. O agente não é obrigatório — quem não usa não é penalizado.
4. O sistema deve funcionar COMPLETAMENTE sem agente — o agente é melhoria, não
   pré-requisito.
```

### 6.5 O agente como novo vetor de *dominium*

Se o patrão configura o agente do empregado, ou se o provedor de IA tem viés
político, o agente vira ferramenta de dominação privada.

```txt
Salvaguardas:

1. Apenas o cidadão titular pode configurar, instruir e autorizar seu agente.
2. A configuração do agente é sigilosa e criptografada.
3. Nenhum terceiro pode verificar como o agente votou.
4. O agente é revogável instantaneamente — uma ação, sem burocracia.
```

## 7. Integração com a esteira do OP

O agente de IA e a delegação de voto não são features isoladas — eles se integram
à esteira do OP em pontos específicos:

```txt
Esteira do OP          | Delegação de voto      | Agente de IA
-----------------------|------------------------|---------------------------
Demanda simples        | —                      | Nível 1: notifica demandas novas
Apoio / não-apoio      | —                      | Nível 2: debate prós/contras
                       |                        | Nível 4: apoio automático (opt-in)
Maturação              | —                      | Nível 2: ajuda a complementar
Filtro territorial     | —                      | Nível 1: explica o filtro
Votação territorial    | Voto delegado           | Nível 3: recomenda
                       |                        | Nível 4: vota com instrução
Consolidação           | Delegação é computada   | Nível 1: mostra resultados
Filtro institucional   | —                      | Nível 1: explica decisão
Incidente público      | —                      | Nível 1: notifica divergência
Execução               | —                      | Nível 1: atualiza status
Aprendizado            | —                      | Nível 2: analisa o que funcionou
```

## 8. Faseamento de implementação

Essas evoluções não devem ser implementadas de uma vez. A proposta de faseamento:

```txt
Fase 0 — Consolidar o OP básico (estado atual)
  A esteira precisa funcionar sem delegação e sem IA.
  Sem base sólida, as evoluções criam complexidade sem valor.

Fase 1 — Agente Nível 1 (Informar)
  Notificações inteligentes, resumos de demandas, tradução de filtros.
  Risco baixo. Valor imediato. Não toca em voto.

Fase 2 — Agente Nível 2 (Debater)
  Debate socrático: prós e contras, argumentos dos dois lados, "cadeira vazia".
  Risco médio. Precisa de explicabilidade.

Fase 3 — Delegação de voto simples (não transitiva)
  Delegação 1:1, revogável, com teto de concentração.
  Risco alto. Precisa de auditoria, sigilo e teto.

Fase 4 — Agente Nível 3 (Recomendar)
  Recomendações com justificativa e contraargumento obrigatório.
  Risco alto. Precisa de diversidade de provedores e monitoramento de entropia.

Fase 5 — Delegação transitiva (com limite de profundidade)
  Cadeia de delegação com profundidade configurável.
  Risco muito alto. Precisa de teto de concentração reforçado e transparência.

Fase 6 — Agente Nível 4 (Agir)
  Voto por agente com instrução explícita e recibo.
  Risco extremo. Precisa de revogação instantânea, audit trail e cooldown.
```

---

## 9. Perguntas em aberto

1. O teto de concentração de delegação deve ser absoluto (kernel) ou faixa?
2. A delegação deve ser por tema, por votação ou por ciclo?
3. O agente de IA deve rodar local, na infraestrutura municipal ou em nuvem?
4. Quem é responsável quando o agente vota errado — o cidadão, o provedor ou o sistema?
5. O agente pode recomendar candidatos para o sorteio territorial?
6. O agente pode participar da maturação de demandas (complementar informações)?
7. Como medir se o agente está aumentando ou diminuindo a qualidade deliberativa?
8. O audit trail do agente é público (hash) ou privado (apenas para o cidadão)?
9. Quais modelos de IA são permitidos — apenas open source? Apenas auditados?
10. Como impedir que o município use o agente como ferramenta de propaganda?

---

## 10. Referências teóricas adicionais

- Bryan Ford — *Delegative Democracy* (2002).
- Bryan Ford — *A Liquid Perspective on Democratic Choice* (2020).
- James Fishkin — *Democracy When the People Are Thinking* (2018).
- Hélène Landemore — *Open Democracy* (2020).
- Carnegie Endowment — *AI and Democratic Deliberation* (2024).
- Stanford Deliberative Democracy Lab — pesquisas sobre IA e mini-públicos (2024–2025).
- Journal of Deliberative Democracy — *LLM-Deliberation Quality Index* (2025).
- Philip Pettit — *On the People's Terms* (2012).

---

## 11. Síntese

> A delegação de voto resolve a **exclusão por indisponibilidade**: o cidadão que
> não pode estar presente transfere seu poder a quem pode, de forma revogável,
> sigilosa e com teto de concentração.
>
> O agente de IA resolve o **gargalo de atenção**: o cidadão que não pode ler 40
> propostas tem um parceiro que sintetiza, debate e, com autorização, age em seu
> nome.
>
> Juntos, eles transformam o OP de um sistema que exige presença constante em um
> sistema que **respeita a vida real das pessoas** — sem sacrificar a agência
> individual, a verificabilidade do voto e a incapturabilidade do processo.
>
> Mas nenhum dos dois é trivial. A delegação pode criar superdelegados; o agente
> pode criar hipnocracia. O faseamento é obrigatório, as salvaguardas são parte
> do kernel, e a honestidade é inegociável: **se não sabemos se funciona, não
> vendemos como se soubéssemos.**

---

## 12. Frase-guia

> O cidadão participa como pode: presente, delegado ou assistido.
> A IA informa, debate e, quando autorizada, age — mas nunca governa.
> A delegação distribui presença; a IA distribui atenção.
> Ambas precisam de teto, sigilo, revogação e auditoria.
> E ambas só fazem sentido se o OP básico funcionar sem elas.
