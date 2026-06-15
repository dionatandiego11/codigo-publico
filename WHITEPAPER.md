# Código Público — Whitepaper

### Uma infraestrutura aberta e auditável de Orçamento Participativo

> Documento para a sociedade, publicado junto com o código-fonte. Aprofundamentos
> técnicos e teóricos estão nos documentos referenciados ao longo do texto e no
> [índice do projeto](README.md). Versão viva — evolui com o projeto.

---

## Resumo

O **Código Público** é uma plataforma livre que trata a cidade como um repositório
colaborativo: problemas viram registros públicos, propostas viram alterações
rastreáveis, decisões deixam rastro inviolável. Seu primeiro uso concreto é o
**Orçamento Participativo (OP)** — o processo em que a própria população decide
parte dos investimentos da cidade. A população **propõe e prioriza** demandas; um
**conselho sorteado** (não eleito, para não ser capturado) **consolida** a matriz
de investimentos; o resultado vira **projeto de lei orçamentária**; e cada passo
fica **auditável de ponta a ponta** — com a privacidade do cidadão protegida e o
histórico ancorado no **Diário Oficial**. A meta não é "mais gente participando",
e sim: **a periferia decidiu, o recurso foi para lá, e a obra foi entregue.**

---

## 1. O problema

Participar das decisões da própria cidade é, hoje, difícil e desanimador. O
cidadão comum não consegue responder perguntas simples: *que demandas do meu
bairro existem? quem decidiu o quê? o que foi prometido saiu do papel?* A
participação costuma ser fragmentada, ilegível e morrer no "aprovou-se" — sem
ninguém acompanhar a execução.

Quando há participação digital, ela tropeça em três armadilhas:

- **Captura** — quem controla a porta (quem valida, quem modera) controla o
  resultado.
- **Fraude de identidade** — sem garantir "uma pessoa, um voto", o sistema vira
  guerra de perfis falsos.
- **Irrelevância** — uma proposta com mil apoios que ninguém é obrigado a
  considerar apenas documenta, publicamente, que a participação não vale nada.

O Código Público foi desenhado contra essas três armadilhas.

---

## 2. A ideia

Inspirado na forma como milhões de pessoas colaboram em software pelo **GitHub**,
o sistema trata a cidade como um **repositório cívico**:

- bairros e distritos são **territórios** mantidos pela comunidade;
- problemas públicos viram **registros** (issues) com autor, tema e órgão
  responsável;
- propostas de mudança viram **alterações versionadas**, com comparação de texto
  (diff) e justificativa;
- decisões formais viram **versões publicadas** (releases);
- e cada etapa deixa **trilha auditável**.

A metáfora não reduz política a software. Ela empresta à cidadania uma linguagem
**visual, rastreável e revisável**, em que toda mudança tem autor, histórico e
possibilidade de contestação. Mas uma plataforma genérica não muda nada sozinha.
Ela precisa de um **chão concreto** — e esse chão é o Orçamento Participativo.

---

## 3. Por que Orçamento Participativo

O OP nasceu em Porto Alegre (1989) e se espalhou por centenas de cidades no mundo,
reconhecido pela ONU como boa prática. É a forma de participação **mais estudada e
mais bem-sucedida** que existe. Adotá-lo como ponto de partida resolve, de uma
vez, os problemas que travam qualquer plataforma cívica:

- **Valor real:** o produto do sistema entra na **lei orçamentária** da cidade.
  Não é desabafo — é orçamento.
- **Adoção:** o OP já é uma política conhecida do Executivo, com papéis definidos
  para a prefeitura, a Câmara e a sociedade.
- **Sustentabilidade:** cada cidade que adere mantém a própria infraestrutura.
- **Justiça:** o OP traz embutido o critério de **carência**, que destina
  proporcionalmente mais recursos às regiões mais pobres.

**O calcanhar histórico — e o antídoto.** O OP costuma **morrer quando o prefeito
muda**, porque em geral é um decreto do Executivo. A resposta do Código Público é
**institucionalizar por lei**: um OP instituído em lei sobrevive à troca de
gestão. Por isso o sucesso do projeto se mede, antes de tudo, por **uma lei que
institua o Orçamento Participativo usando o sistema**.

> Detalhes em [docs/ORCAMENTO-PARTICIPATIVO.md](docs/ORCAMENTO-PARTICIPATIVO.md).

---

## 4. Como funciona — o ciclo

```
território → demanda → priorização → conselho sorteado consolida
   → matriz de investimentos → projeto de lei orçamentária
   → Câmara aprova → execução → fiscalização pública
```

1. **Território.** A cidade se organiza em regiões. Cada cidadão se vincula ao seu
   bairro (ver §5).
2. **Demanda.** Qualquer morador registra um problema concreto — "rua sem asfalto",
   "falta creche", "ponto de risco de deslizamento".
3. **Priorização.** A comunidade vota e ordena suas prioridades. O peso de cada
   voz é ponderado pelo vínculo com o território (ver §7), nunca por dinheiro.
4. **Consolidação.** Um **conselho sorteado** analisa os trade-offs, junta
   propostas parecidas e monta a **matriz final** de investimentos (ver §6).
5. **Lei.** A matriz vira insumo do **projeto de lei orçamentária**, aprovado pela
   Câmara.
6. **Execução e fiscalização.** As obras acontecem; a plataforma acompanha prazo,
   orçamento e evidências — e **lembra, ano a ano**, o que foi prometido e não foi
   entregue.

---

## 5. Quem é quem — e a separação de poderes

A confiança do sistema vem de **separar com rigor** quem faz o quê:

| Papel | Quem é | Pode | **Não** pode |
| --- | --- | --- | --- |
| **Operador técnico** | a T.I. da prefeitura | rodar a infraestrutura | decidir mérito, mexer em prioridade, alterar histórico |
| **As regras** | o **código aberto** do projeto | definir sorteio, recall, auditoria | ser mudadas por discrição local — são públicas e iguais para todas as cidades |
| **Cidadão** | morador validado | propor, priorizar, fiscalizar, contestar, recorrer | — |
| **Conselheiro** | cidadão **sorteado** | deliberar e consolidar a matriz | impor sozinho; tem mandato curto e pode ser destituído |

> **A prefeitura controla a tomada, não a corrente.** Ela mantém a infraestrutura,
> mas as **regras políticas vivem no código aberto** — auditáveis e iguais para
> todas as cidades. E a validação de identidade pelo **gov.br** é automática:
> ninguém na prefeitura decide quem é cidadão. Isso fecha a porta da captura.

A identidade pelo **gov.br** garante o princípio mais básico: **uma pessoa, um
voto** — sem biometria global, sem token, sem comprar influência. É o que torna o
sistema resistente a perfis falsos **sem** virar plutocracia.

---

## 6. O sorteio — por que não eleição

No OP tradicional, os conselheiros são eleitos. Aqui eles são **sorteados** — por
um motivo simples e profundo: **não se captura um sorteio.** Um chefe político
local compra ou coage votos numa eleição; não consegue predeterminar quem é
sorteado. O conselho passa a ser uma amostra da comunidade, não da sua estrutura
de poder. É o que as **assembleias cidadãs** (como as da Irlanda) já praticam com
sucesso, e o que aproxima o projeto do estado da arte da democracia deliberativa.

Como funciona, de forma justa e verificável:

- **Quem entra:** cidadãos com vínculo no território que se voluntariam.
- **Aleatoriedade pura:** sorteio simples, **sem cotas e sem critérios de grupo** —
  ninguém decide "quais grupos entram", e é essa ausência de critério que o torna
  incapturável.
- **Sorteio auditável:** a "semente" do sorteio vem de uma fonte pública e futura
  que o operador não controla, e todo o sorteio fica registrado na trilha de
  auditoria — qualquer pessoa reproduz e confere.
- **Deliberação informada:** o conselho recebe assessoria técnica (que **assessora,
  não decide**), para deliberar com informação, não no escuro.
- **Mandato curto e recall:** o conselheiro fica pouco tempo, não pode se eternizar,
  e pode ser destituído. **O sorteio substitui a escolha, não a prestação de
  contas.**

Na nossa metáfora: o conselho sorteado é o **"mantenedor" do repositório do
bairro** — faz curadoria e junta as contribuições, mas é **gestor, não dono.**

---

## 7. Justiça: peso por vínculo e critério de carência

O sistema não é "um clique, um voto" cego, nem "um real, um voto". A influência é
ponderada por **pertencimento ao território**:

- **Peso por vínculo (T0 → T5):** o morador validado pesa mais que quem apenas
  trabalha ou estuda na cidade; o visitante acompanha, mas não delibera. O peso
  vem do **vínculo territorial — nunca do capital.**
- **Critério de carência:** os recursos são distribuídos com uma fórmula que dá
  proporcionalmente **mais às regiões mais pobres**. É o mecanismo que a
  experiência de Porto Alegre comprovou ser redistributivo. Aqui, a "fronteira"
  do território deixa de excluir e passa a **redistribuir** para quem mais precisa.

---

## 8. Confiança sem precisar confiar — a auditoria

A pergunta mais antiga do poder é: *quem vigia o vigia?* O Código Público responde
com **matemática, não com fé**:

- **Trilha encadeada:** cada decisão relevante gera um evento, e cada evento carrega
  a "impressão digital" (hash) do anterior. Alterar o passado quebra a corrente de
  forma **detectável**. Ninguém precisa vigiar o vigia se a adulteração é impossível
  de esconder.
- **Âncora no Diário Oficial:** periodicamente, a "impressão digital" do histórico é
  publicada no **Diário Oficial do município** — um registro público já reconhecido
  e imutável. Depois de publicado, ninguém reescreve a história sem contradizer um
  documento oficial. *(Gratuito e juridicamente robusto — sem "teatro de
  blockchain".)*

E a **privacidade vem junto**, não contra:

- o **CPF nunca é armazenado em texto puro** — apenas um código irreversível;
- o **voto individual nunca é exposto** — só o resultado agregado;
- e o direito ao esquecimento (LGPD) convive com a imutabilidade: os dados pessoais
  ficam **cifrados com uma chave por pessoa**; apagar a chave torna o dado ilegível
  **sem quebrar a prova** de que algo aconteceu.

> Detalhes em [docs/BLOCKCHAIN-E-AUDITORIA.md](docs/BLOCKCHAIN-E-AUDITORIA.md).

---

## 9. Cada cidade, suas regras (dentro de limites comuns)

Cidades são diferentes, e o sistema respeita isso sem se desfigurar. A divisão:

- **Regras comuns** (no código aberto, iguais para todas): que o conselho é
  sorteado, que há recall, que tudo é auditado, que a identidade vem do gov.br.
- **Parâmetros locais** (definidos pelo regimento de cada cidade): quanto tempo o
  conselheiro fica, qual a fração do orçamento que entra no OP, os pesos da
  carência.

Em uma frase: **a regra é comum, o número é local.** Inclusive o tamanho do próprio
Orçamento Participativo pode virar **uma das primeiras decisões da população** —
começando com um valor inicial e sendo consolidado, por voto, no plano plurianual
seguinte.

---

## 10. Os fundamentos

O projeto conversa com o que há de mais sólido em teoria democrática — não como
enfeite, mas como engenharia:

- **Open Democracy** (Hélène Landemore): representação aberta e por sorteio, não
  só eleitoral.
- **Democracia monitória** (John Keane): poder legítimo é poder continuamente
  vigiado.
- **Liberdade como não-dominação** (Philip Pettit): o representante nunca é dono;
  toda decisão é contestável.
- **Governança de comuns** (Elinor Ostrom): comunidades gerindo o que é de todos,
  com regras locais e monitoramento mútuo.
- **O código é lei** (Lawrence Lessig): a arquitetura do sistema é a sua
  constituição — por isso as regras são públicas e testadas.

> O tratamento completo, com obstáculos e perguntas em aberto, está em
> [docs/FUNDAMENTACAO-TEORICA.md](docs/FUNDAMENTACAO-TEORICA.md).

---

## 11. O que ainda não resolvemos (honestidade)

Um projeto que finge não ter limites não merece confiança. Os nossos, declarados:

- **Domínio privado absoluto.** Onde uma força local (uma milícia, um poder
  econômico) controla todo mundo, nenhum sistema vence sozinho. O Código Público
  **eleva o custo e deixa rastro**, e permite recurso a instâncias superiores — mas
  não promete milagre.
- **Ajuda de custo ao sorteado.** Sem apoio, servir no conselho exclui quem não pode
  faltar ao trabalho — reintroduzindo o viés que o sorteio combate. É uma questão
  de desenho e de financiamento ainda em aberto.
- **Espelhamento da comunidade.** A aleatoriedade pura é incapturável, mas não
  garante que um conselho pequeno reflita a diversidade do bairro. É um trade-off
  assumido, a ser monitorado.
- **Adoção institucional.** O sistema só importa se uma cidade real o adotar e tratar
  seus resultados como entrada do processo orçamentário. Conseguir a primeira é o
  desafio central.

---

## 12. Como medimos sucesso

Não pela quantidade de cliques. Participação pode ser capturada e ainda assim
inócua. As métricas que importam:

1. **Origem:** uma **lei** institui o Orçamento Participativo usando o sistema.
2. **Execução:** um ciclo completo fecha e as **obras escolhidas são entregues**.
3. **A que prova tudo:** a **participação do investimento realizado na periferia
   sobe**.

> Sucesso é **"a periferia decidiu, o recurso foi para lá, e a obra foi entregue"
> — com rastro auditável de ponta a ponta.**

---

## 13. Estado do projeto

O Código Público é **software livre, em desenvolvimento ativo e já no ar** em
[codigopublico.stellaris.net.br](https://codigopublico.stellaris.net.br).

**Já construído e funcionando:** lei versionada com comparação de texto, registro e
debate de demandas, propostas com diff, votação com voto sigiloso e resultado
agregado, consolidação formal e publicação de versões, fiscalização de execução,
governança territorial (vínculos, mantenedores, recall), e a **trilha de auditoria
com hash encadeado** — tudo com as regras críticas cobertas por testes
automatizados, como uma "constituição executável".

**Em construção para o modo Orçamento Participativo:** o **sorteio** do conselho, a
**integração com o gov.br**, a **fórmula de carência**, o **peso por vínculo
(T0–T5)** e a **ancoragem no Diário Oficial**.

Somos transparentes sobre essa fronteira: o que existe, existe de verdade; o que
falta, está declarado.

---

## 14. Um convite

Esta é uma infraestrutura cívica **aberta**. Construí-la bem é trabalho de muita
gente:

- **Desenvolvedores(as)** — o código e o guia de contribuição estão abertos
  ([CONTRIBUTING.md](CONTRIBUTING.md)).
- **Juristas e servidores(as)** — ajudem a afinar o valor jurídico, a conformidade
  e o rito legal.
- **Gestores(as) públicos(as) e vereadores(as)** — uma cidade-piloto e uma lei que
  institua o OP são o passo que tira tudo isso do papel.
- **Cidadãos(ãs)** — a melhor crítica vem de quem vai usar.

> Uma cidade, um território, um cidadão validado, uma participação rastreável — e um
> orçamento que, finalmente, a população decide e fiscaliza.

---

## Licença

Software livre, sob Apache 2.0. Use, audite, replique, contribua.
