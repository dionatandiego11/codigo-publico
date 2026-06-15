# Orçamento Participativo — o caso de uso fundador

> Por que o Código Público nasce como infraestrutura de **Orçamento
> Participativo (OP)**, como o ciclo do OP mapeia nas primitivas já construídas,
> e o que isso decide sobre identidade, seleção de representantes, valor jurídico,
> integridade e ameaças. Este documento é a espinha conceitual do whitepaper.

---

## 1. Por que Orçamento Participativo

O OP (Porto Alegre, 1989) é a instituição de democracia participativa **mais
estudada e replicada do mundo** — centenas de cidades, reconhecida pela ONU como
boa prática. Ancorar nele resolve, de uma vez, as perguntas que travavam o
projeto:

- **Valor jurídico** — o produto do sistema alimenta a **LOA** (Lei Orçamentária
  Anual). Deixa de ser "mais um canal de reclamação".
- **Adoção institucional** — o OP já é uma política do Executivo; os atores
  (Executivo, Legislativo, sociedade) já têm papel definido. O problema do "quem
  protocola?" desaparece.
- **Sustentabilidade** — cada cidade que adere banca a própria infraestrutura.
- **Inclusão** — o OP traz embutido o critério de **carência**, o mecanismo
  redistributivo mais estudado que existe (favorece estruturalmente a periferia).

### O calcanhar histórico do OP — e o antídoto

O OP de Porto Alegre durou ~16 anos e **foi descontinuado quando a gestão mudou**.
Essa é a fragilidade histórica de todo OP: **morre quando o prefeito muda**,
porque costuma ser decreto do Executivo. O antídoto é **institucionalizar por
lei**: um OP instituído em lei sobrevive à troca de gestão. Por isso a métrica de
sucesso do projeto (uma lei instituindo o OP via o sistema) não é só adoção — é a
**condição de sobrevivência do modelo**. Esta é a tese central do whitepaper.

---

## 2. O ciclo do OP mapeado nas primitivas

| Ciclo real do OP | Primitiva no Código Público | Estado |
| --- | --- | --- |
| Cidade dividida em regiões / eixos temáticos | **Território** (vínculo, gov.br) | ✅ existe |
| Demanda do bairro ("falta creche", "rua sem asfalto") | **Issue territorial** | ✅ existe |
| Assembleia prioriza demandas | **Votação** — modo *alocação*, não texto de lei | ⚙️ adaptar |
| Critérios (população + **carência** + prioridade) | **Módulo de distribuição** (policy pura) | 🆕 construir |
| Conselheiros do OP (COP) | **Conselheiro sorteado** (ver §4) | ⚙️ adaptar |
| Matriz orçamentária / Plano de Investimentos | **Release** (a matriz consolidada) | ✅ existe |
| Entra na LOA | **Merge institucional** → projeto de LOA | ⚙️ ressignificar |
| Execução das obras + memória ano a ano | **Fiscalização de execução** | ✅ existe |

**O laço primário** deixa de ser "PR sobre texto de lei" e passa a ser:

```
território → demanda (issue) → priorização (votação com critérios)
   → conselho sorteado consolida a matriz → projeto de LOA (release)
   → Câmara aprova → execução fiscalizada → prestação de contas
```

Quase tudo já está construído. O que é novo: **a fórmula de carência** e o
**sorteio**.

---

## 3. Separação de poderes na plataforma

A regra de ouro do desenho — e a defesa contra a captura pelo Executivo:

| Papel | Quem | Pode | **Não** pode |
| --- | --- | --- | --- |
| **Operador técnico** (`sysadmin`) | T.I. da prefeitura | rodar a infra, subir o sistema, configurar o ciclo | decidir mérito político, mexer em prioridade, alterar histórico |
| **Lógica política** | o **código aberto** do projeto | definir as regras (sorteio, critérios, recall) | — (não é discricionária; é pública e forkável) |
| **Cidadão** | morador validado por gov.br | propor, priorizar, fiscalizar, recorrer, contestar | — |
| **Conselheiro** | cidadão **sorteado** | deliberar e consolidar a matriz | impor unilateralmente; é mandato curto e recall-ável |

> **A prefeitura controla a tomada, não a corrente.** A T.I. opera a
> infraestrutura; as **regras políticas vivem no código aberto** (Lessig: *code
> is law*) — públicas, auditáveis e forkáveis, **não** à mercê da administração
> local. A cadeia de auditoria já impõe que o operador não tenha "poder
> silencioso sobre o mérito".

E o gov.br fecha o cerco: como a **validação de identidade vira automática** (o
gov.br confirma que você é uma pessoa real do município), o operador **perde o
poder de gatekeeping** sobre quem é cidadão. Ninguém na prefeitura decide quem
participa.

### Regras comuns × parâmetros locais (policentrismo de Ostrom)

A separação acima tem uma terceira camada, decisiva: distinguir o que é **regra
comum** do que é **parâmetro local**.

- **Regras comuns** (no código aberto, iguais para toda cidade): que o conselheiro
  é sorteado, que há recall, que a identidade vem do gov.br, que tudo é auditado.
  São a "constituição" — ninguém as muda por discrição local.
- **Parâmetros locais** (definidos pelo **regimento do OP de cada cidade**, dentro
  de limites que o código comum impõe): **quanto tempo o conselheiro fica no
  cargo**, qual o **envelope** orçamentário, os **pesos** da fórmula de carência,
  os **pesos por nível de vínculo**.

Isto realiza o **policentrismo** de Ostrom: cada comum (cidade) escreve as
próprias regras de operação, sem fraturar a constituição comum. É o que dá a
cada município autonomia real sem abrir mão da integridade do modelo.

---

## 4. Seleção por sorteio (o coração da defesa anti-captura)

No OP clássico os delegados são **eleitos**. Aqui eles são **sorteados** — porque
**não se captura um sorteio**. Um chefe político local compra ou coage votos numa
eleição; não consegue predeterminar quem é sorteado. Isto alinha o projeto ao
estado da arte das **assembleias cidadãs** (Irlanda; relatório *Innovative
Citizen Participation*, OCDE, 2020 — a "onda deliberativa") e realiza o pilar de
Open Democracy (Landemore) que faltava.

### Divisão de trabalho: a massa propõe, o conselho consolida

A participação ampla e o conselho sorteado têm papéis distintos — exatamente como
no GitHub:

- **A população** (todos com vínculo) **propõe** demandas (issues) e **prioriza**
  (votação). É a contribuição aberta — qualquer um abre um "pull request" cívico.
- **O conselho sorteado é o *maintainer* do repositório-território** (bairro /
  distrito): analisa os trade-offs, **consolida** propostas semelhantes, resolve
  conflitos e estrutura a **matriz final** de investimentos. Ele não cria demanda
  por conta própria — faz a **curadoria e o merge**, com mandato curto e sob
  recall. É gestor do repositório, não dono dele.

### Desenho do sorteio

1. **Pool de elegíveis** — cidadãos com vínculo validado no território, em regime
   opt-in.
2. **Aleatoriedade pura** — sorteio simples, **sem estratos e sem cotas**. Ninguém
   decide "quais grupos entram" — e é justamente essa ausência de critério que o
   torna **incapturável** e máximo em neutralidade. *(Trade-off assumido: a
   representação descritiva — Pitkin/Mansbridge — deixa de ser garantida por
   desenho. O preço da neutralidade total é abrir mão do espelhamento forçado;
   confia-se na lei dos grandes números e na rotação. Ver §13.)*
3. **Aleatoriedade verificável** — a semente vem de uma fonte pública e **futura**
   que o operador não controla nem prevê (ex.: hash de um bloco público anunciado
   com antecedência, ou um *randomness beacon* público). O sorteio inteiro
   (semente, pool, resultado) é **registrado na cadeia de auditoria** — *sorteio
   auditável*: qualquer pessoa reproduz e confere.
4. **Deliberação informada** — o conselho recebe assessoria técnica da prefeitura
   (que **assessora, não decide**) — o desenho da *Deliberative Poll* de Fishkin:
   cidadão comum + informação qualificada delibera melhor que fórum aberto (que
   polariza — Sunstein).
5. **Mandato definido por cada cidade** — quanto tempo o conselheiro fica é
   **parâmetro do regimento municipal** (autonomia local — Ostrom), dentro de
   limites comuns; *default* de um ciclo do OP, não renovável imediatamente
   (anti-entrincheiramento). O **recall continua valendo**: o sorteio substitui a
   *seleção*, não a prestação de contas.

### Limites honestos do sorteio (para o whitepaper)

- **Representação descritiva** — a aleatoriedade pura não garante espelhamento da
  comunidade em conselhos pequenos. Mitiga: pool grande, rotação por ciclo, e a
  própria neutralidade (ninguém escolhe quem entra).
- **Percepção de legitimidade** ("ganhou na sorte"). Mitiga: transparência total +
  a aleatoriedade verificável.
- **Competência** (cidadão comum e orçamento). Mitiga: deliberação informada.
- **Disponibilidade** (o sorteado precisa poder servir). Mitiga: pool opt-in +
  sorteios de reposição + (ideal) ajuda de custo/dispensa — **item em aberto no
  whitepaper** (ver §13).

> No código, isto entra como uma nova origem de mandato `sorteio` no
> `maintainer_policy.go` (que já distingue `eleicao_territorial`,
> `indicacao_legislativa`, etc.). No modo OP, `sorteio` é a origem primária. Toda
> a máquina de mandato, recall e auditoria que já existe **é reaproveitada**.

---

## 5. Identidade — gov.br

A validação passa a ser feita pelo **gov.br**:
- **Uma pessoa real, um voto** — resistência a Sybil sem biometria global nem
  token (responde à crítica anti-DAO: não-plutocrático e à prova de identidades
  falsas).
- **Validação automática** — remove o poder de gatekeeping do operador (§3).
- A objeção "reintroduz dependência do Estado" é **moot** no contexto OP: o OP já
  é política do Executivo; o Estado já é o operador legítimo.

---

## 6. Critérios de distribuição — a justiça redistributiva

O recurso não é distribuído por maioria simples. Segue a fórmula clássica do OP,
que vira uma **policy pura testável**:

```
peso(região) = f(população, índice_de_carência, prioridade_escolhida)
```

O **índice de carência** faz as regiões mais pobres receberem
proporcionalmente mais — é a resposta institucional concreta à tensão
**inclusão (Dahl) × fronteiras (Ostrom)**: a fronteira deixa de excluir e passa a
**redistribuir**. É o mecanismo que a literatura de Porto Alegre (Marquetti)
mediu empiricamente como redistributivo.

Os pesos da fórmula são definidos pelo **regimento do OP de cada cidade** — o que
realiza a autonomia local de regras (policentrismo de Ostrom): cada município
calibra carência/população/prioridade dentro de limites comuns.

### Peso da voz por vínculo (T0 → T5)

Além da distribuição entre regiões, a influência de **cada cidadão** na
priorização é **ponderada pelo nível de vínculo** — escala estendida para
**T0 → T5**. O morador validado pesa mais que quem apenas trabalha ou estuda no
município (vínculos intermediários); o visitante (T0) lê mas não delibera. É a
ponderação **não-plutocrática** central do projeto: o peso vem do **vínculo
territorial**, nunca do capital. Os pesos exatos de cada nível são parâmetro do
regimento municipal (autonomia local). *(O código hoje modela T0–T4; o modo OP
estende para T0–T5 e introduz o peso por nível — ver delta no §11.)*

---

## 7. Valor jurídico — LOA e PPA

O fluxo termina em lei:

```
matriz consolidada (release) → projeto de Lei Orçamentária → Câmara aprova → LOA
```

- O **merge institucional** ganha sentido pleno: consolidar a matriz é produzir o
  insumo do projeto de LOA.
- A **fiscalização de execução** acompanha o cumprimento — e a "memória ano a ano"
  do OP (obra prometida e não entregue volta à pauta) já é suportada.
- E, fechando o ciclo de legitimidade: **instituir o OP por lei** (não por
  decreto) é o que faz o modelo sobreviver à troca de gestão (§1).

### O envelope como primeira decisão participativa

Quanto do orçamento entra no OP (o "envelope") não precisa ser imposto de cima
para sempre. O desenho:

1. **Bootstrap** — a lei (ou ato) que institui o programa fixa um valor inicial
   (do Executivo/Legislativo) para a primeira rodada. Alguém precisa começar.
2. **Consolidação participativa** — o **próprio envelope vira uma das primeiras
   propostas abertas no aplicativo**: a população debate e vota a fração do
   orçamento que deseja destinar, e o resultado é encaminhado para o **PPA** (Plano
   Plurianual) seguinte a ser votado pela Câmara.

Assim o sistema **decide a própria escala** de forma recursiva — o envelope deixa
de ser decreto e passa a ser deliberação, consolidada no instrumento plurianual
(PPA) enquanto a matriz anual alimenta a LOA. É o policentrismo aplicado ao
recurso: cada cidade define, participativamente, quanto coloca em jogo.

---

## 8. Integridade e LGPD

**Imutabilidade × direito ao esquecimento (LGPD art. 18) — resolvido por
crypto-shredding.** A cadeia de auditoria **não guarda PII em texto puro**: guarda
um ID pseudônimo + um blob cifrado com **chave por titular**. Apagar = destruir a
chave → o dado fica ilegível, **o hash permanece válido, a cadeia não quebra**. O
direito ao esquecimento convive com a imutabilidade.

**Ancoragem sem "blockchain theater".** A cadeia de hash interna prova
consistência, mas um operador malicioso com acesso ao banco poderia reescrevê-la
inteira recalculando os hashes. A âncora externa derrota isso publicando o
**hash-cabeça num lugar que o operador não controla**. No contexto cívico, o lugar
certo é o **Diário Oficial do município**: gratuito, **já um registro público
legalmente reconhecido e imutável**, sem dependência de cripto. Depois de
publicado, ninguém reescreve a história anterior àquela edição sem contradizer um
documento oficial. *(Blockchain pública fica como variante opcional mais forte —
mas o Diário Oficial é a âncora honesta e juridicamente robusta.)*

---

## 9. Modelo de ameaça (honesto)

| Vetor de captura | O sistema protege? |
| --- | --- |
| **Sybil** (inflar o bairro com perfis falsos) | **Sim** — gov.br = uma pessoa real; carência reduz o prêmio |
| **Gatekeeping** (controlar quem entra) | **Sim** — validação automática por gov.br tira esse poder |
| **Eleger um conselheiro capturado** | **Sim** — não se captura um **sorteio** estratificado e verificável |
| **Capturar o operador** (prefeitura) | **Parcial** — operador não tem poder de mérito; cadeia de auditoria detecta adulteração; Diário Oficial ancora |
| **Brigading** (mobilizar votos reais) | **Limitado** — fronteira tênue com "mobilização legítima"; carência e o conselho diluem o majoritarismo puro |
| **Bairro sob *dominium* total** (milícia controla todos) | **Não totalmente** — nenhum design vence dominação privada absoluta; o sistema **eleva o custo, deixa rastro** e permite intervenção da instância geral |

> A honestidade sobre o limite (o *dominium* absoluto) é mais forte que fingir
> invulnerabilidade. O sorteio fecha o vetor que mais preocupava (delegado
> capturado); o *dominium* total de um território permanece como **limite
> assumido**, não como falha escondida.

---

## 10. Métricas de sucesso

1. **Origem** — uma **lei** institui o OP usando o sistema. *(legitimidade e
   sobrevivência à troca de gestão)*
2. **Execução** — um ciclo completo fecha e as obras escolhidas **são
   entregues**.
3. **A métrica que prova tudo** — a **participação do investimento realizado na
   periferia sobe** (redistribuição efetiva, à la Marquetti). Se o dinheiro foi
   para a periferia *e saiu do papel*, funcionou; se a participação subiu mas a
   obra não veio, foi teatro participativo.

> Sucesso não é "as pessoas participaram", é **"a periferia decidiu, o recurso foi
> para lá, e a obra foi entregue" — com rastro auditável de ponta a ponta.**

---

## 11. O que muda no código (delta)

**Reaproveitado quase inteiro:**
- `territorial/` — vínculo vira participação no OP; identidade agora via gov.br.
- `maintainer_policy.go` — adicionar origem `sorteio`; mandato = 1 ciclo; recall
  mantido.
- `audit/` — adicionar crypto-shredding (PII cifrada por titular) + ancoragem no
  Diário Oficial.
- `votings` — modo **alocação** (distribuir/priorizar demandas dentro de um
  envelope), além do modo consulta.
- `fiscalização` e `releases` — execução e matriz, já encaixam.

**Novo a construir (cada um como policy pura + teste):**
- **Sorteio** — elegibilidade, **aleatoriedade pura verificável** (semente
  pública futura, registrada na auditoria), mandato configurável por cidade.
- **Domínio orçamentário** — envelope (peça do OP) + sua consolidação
  participativa no PPA, regiões, e a **fórmula de carência** (módulo de
  distribuição).
- **Peso por vínculo (T0 → T5)** — estender a escala atual (T0–T4) e ponderar a
  voz na priorização pelo nível de vínculo.
- **Integração gov.br** (OAuth) na camada de autenticação.
- **Parâmetros por cidade** — mandato, pesos da carência, pesos por vínculo e
  envelope configuráveis por município, dentro de limites do código comum
  (policentrismo).

---

## 12. Parâmetros de governança no modo OP

Em vez de constantes globais, o modo OP trabalha com **parâmetros por cidade**
(policentrismo), dentro de limites que o código comum impõe:

| Parâmetro | Quem define | Default |
| --- | --- | --- |
| Mandato do conselheiro | regimento municipal | 1 ciclo do OP |
| Recall | comum (código) | 50%+1 dos vínculos seniores |
| Pesos da carência (população/carência/prioridade) | regimento municipal | — |
| Pesos por vínculo (T0–T5) | regimento municipal | — |
| Envelope orçamentário | bootstrap + voto popular → PPA | — |
| Semente do sorteio | comum (fonte pública futura) | registrada na auditoria |

A linha divisória: **a regra é comum, o número é local.**

---

## 13. Perguntas ainda em aberto

Decisões já tomadas (incorporadas acima): envelope com bootstrap + voto popular →
PPA (§7); massa propõe/prioriza e conselho sorteado consolida, como maintainer do
território (§4); sorteio por **aleatoriedade pura, sem cotas** (§4); influência
por **peso de vínculo T0–T5** (§6); **mandato e pesos definidos por cada cidade**
(§12).

Permanece em aberto, para exploração no whitepaper:

1. **Ajuda de custo ao sorteado** — sem ela, servir no conselho exclui quem não
   pode faltar ao trabalho, reintroduzindo o viés que o sorteio combate. É item de
   custeio e de desenho — **questão central a explorar**.
2. **Calibração dos pesos** — os valores de cada nível T0–T5 e os pesos da carência
   precisam de uma faixa-referência defensável (e dos limites que o código comum
   impõe para impedir distorção local).
3. **Representação descritiva** — o trade-off assumido da aleatoriedade pura (§4):
   monitorar se conselhos pequenos espelham a comunidade, e o que fazer se não
   espelharem (aumentar o conselho? rotação mais rápida?) sem reintroduzir cotas.
4. **Limites comuns dos parâmetros locais** — até onde vai a autonomia municipal
   antes de descaracterizar o modelo (ex.: um mandato de 10 anos burlaria a
   rotação; um envelope de 0% esvaziaria o OP). Quais são os limites rígidos?

---

## 14. Síntese

> O Código Público nasce como **infraestrutura de Orçamento Participativo
> institucionalizável por lei**: a prefeitura opera a infra, o gov.br garante uma
> pessoa-um-voto, o cidadão propõe e prioriza, um **conselho sorteado e
> auditável** consolida a matriz sob critérios redistributivos, o resultado vira
> projeto de LOA, e cada passo deixa rastro inviolável — apagável no que é
> pessoal (LGPD), imutável no que é prova. O sucesso se mede não pela
> participação, mas pela **redistribuição efetiva e executada** rumo à periferia.
