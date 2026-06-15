# Sugestão de Governança — Orçamento Participativo

> Status: **rascunho para refinamento**. Este documento consolida a governança
> do Código Público após a mudança de eixo conceitual: o sistema passa a ser
> tratado como infraestrutura pública de Orçamento Participativo municipal.
> Pontos marcados com **[DECIDIR]** ainda precisam virar regra final antes de
> implementação.

## Síntese

O Código Público deve funcionar como uma infraestrutura de Orçamento
Participativo baseada em regras públicas, auditáveis e executáveis.

A metáfora de GitHub continua existindo, mas como arquitetura interna:
histórico, versões, auditoria, merge institucional e release do ciclo. Para o
cidadão, o fluxo principal é:

```txt
território
→ demanda simples
→ apoio comunitário
→ maturação
→ filtros públicos
→ votação territorial
→ consolidação municipal
→ institucionalização no PPA/LDO/LOA
→ execução fiscalizada
→ aprendizado do próximo ciclo
```

O projeto deixou de ser apenas um produto cívico e passa a ser uma
**constituição operacional do Orçamento Participativo**. Cada regra abaixo não
é apenas uma feature: é parte do rito institucional.

---

## Parte 1 — Princípios de governança

### 1.1 O território é a unidade política base

Todo bairro, comunidade ou distrito reconhecido deve existir politicamente no
OP.

Regra central:

> Cada território tem direito a **1 representante territorial**.

Não há representação proporcional por tamanho populacional nesta primeira
versão. A opção política é equilibrar os territórios de forma direta:

```txt
1 território = 1 representação
```

Isso evita que territórios grandes engulam territórios pequenos e faz com que
zona rural, periferias, bairros e comunidades sejam tratados como unidades
políticas próprias.

### 1.2 A justiça social começa pela justiça territorial

O sistema não começa por cotas de gênero, idade, renda ou raça. O primeiro
mecanismo de inclusão é territorial.

Esses marcadores podem ser acompanhados por estatísticas agregadas e relatórios
de monitoramento, mas a regra de representação inicial é:

```txt
todo território reconhecido tem 1 representante
```

### 1.3 A demanda nasce simples

O cidadão não precisa falar a linguagem do orçamento público para participar.

Exemplo de demanda inicial:

> Falta médico no PSF do meu bairro.

O sistema deve permitir que a demanda nasça simples e ganhe maturidade por
camadas: apoio, contexto, agrupamento, fork, filtro, votação e execução.

### 1.4 Filtro não é portão único

O sistema não deve depender de especialistas como porteiros do processo.

Especialistas podem produzir reviews, pareceres ou complementações, mas não
devem ser o ponto único que decide se a demanda popular existe ou não.

O filtro deve ser uma linha de maturidade com retornos controlados:

```txt
faltou informação       → volta para maturação
demanda duplicada       → agrupa
solução divergente      → cria fork
custo alto demais       → faseia ou envia para ciclo plurianual
fora da competência     → vira reivindicação externa
ilegal/inconstitucional → bloqueia com fundamento e permite reformulação
```

### 1.5 Toda negativa precisa deixar caminho

Nenhum bloqueio deve ser invisível.

Regra:

> Toda negativa gera justificativa pública, audit log e caminho de correção,
> fork, recurso, ciclo futuro ou memória pública.

---

## Parte 2 — Arquitetura institucional

### 2.1 Maintainer Geral

O Maintainer Geral corresponde ao **Legislativo municipal** enquanto instância
institucional do OP.

Não deve ser entendido como uma pessoa isolada, mas como a Câmara, comissão,
mesa, gabinete ou estrutura formal definida pelo município.

Responsabilidades:

```txt
- abrir o ciclo do OP
- definir calendário, territórios e orçamento disponível
- indicar ou validar o Maintainer Técnico
- abrir o período de inscrição para representantes territoriais
- receber a matriz consolidada do OP
- filtrar impedimentos institucionais com justificativa pública
- conduzir a institucionalização na Câmara
- incorporar o resultado ao rito de PPA, LDO e LOA
- decidir recursos e contestações escaladas
- abrir revisão ou destituição de maintainer territorial por processo
```

Limites:

```txt
- não pode apagar histórico
- não pode recusar proposta sem fundamento
- não pode alterar matriz do OP sem justificativa pública
- não pode transformar filtro institucional em veto invisível
- não pode expor voto individual, CPF ou denúncia sigilosa
```

### 2.2 Maintainer Técnico

O Maintainer Técnico é o operador de infraestrutura.

Pode ser indicado pelo Legislativo e pode vir da TI municipal, inclusive de
estrutura do Executivo, desde que sua função seja estritamente técnica.

Responsabilidades:

```txt
- manter o sistema disponível
- configurar parâmetros aprovados institucionalmente
- operar banco, deploy, segurança, logs e auditoria
- apoiar integração com blockchain, backup e observabilidade
- executar ajustes técnicos autorizados
```

Limites:

```txt
- não decide mérito político
- não filtra demanda por conveniência
- não altera regra local sem autorização institucional
- não acessa dado sensível sem rito formal
```

### 2.3 Maintainer Territorial

O Maintainer Territorial é o representante temporário do território no ciclo do
OP.

Regra central:

> Cada território tem 1 Maintainer Territorial escolhido por inscrição e
> sorteio auditável entre cidadãos vinculados ao território.

Responsabilidades:

```txt
- organizar demandas do território
- agrupar demandas parecidas
- orientar forks de soluções diferentes
- pedir complementação quando faltar informação
- validar se a demanda pertence ao território
- conduzir a maturação territorial
- encaminhar propostas aptas para votação
- justificar publicamente filtros aplicados
```

Limites:

```txt
- não é dono do território
- não decide sozinho o mérito político da comunidade
- não pode rejeitar demanda por opinião pessoal
- não pode apagar histórico
- não pode impedir contestação ou recurso
- não pode favorecer demanda própria sem registro de conflito
```

O Maintainer Territorial é zelador do rito territorial, não autoridade política
permanente.

### 2.4 Cidadão Territorial

Pessoa cadastrada com vínculo territorial validado.

Pode:

```txt
- abrir demandas simples
- apoiar ou não apoiar demandas
- comentar e complementar informações
- participar da votação territorial
- contestar vínculo territorial suspeito
- recorrer de decisões
- denunciar abuso
- fiscalizar execução
- inscrever-se para sorteio de Maintainer Territorial
```

### 2.5 Cidadão Municipal

Pessoa cadastrada no município, mas sem vínculo territorial validado.

Pode:

```txt
- acompanhar dados públicos
- abrir manifestações informativas em fluxos permitidos
- solicitar vínculo territorial
- acompanhar ciclos do OP
```

No OP territorial, o voto pleno deve depender de vínculo territorial validado.

---

## Parte 3 — Regra comum e regra local

O Código Público deve operar como `code is law`: regras do rito precisam estar
descritas em protocolo, implementadas no sistema, auditáveis e parametrizáveis.

### 3.1 Kernel comum obrigatório

Todo município que usar o sistema deve respeitar:

```txt
- nenhum território reconhecido fica sem voz
- cada território tem 1 representante territorial
- o representante territorial é temporário
- a escolha ocorre por inscrição e sorteio auditável
- todo filtro exige justificativa
- toda negativa gera retorno, recurso, fork ou memória pública
- voto individual nunca é exposto
- CPF e dados sensíveis nunca são públicos
- blockchain guarda prova de integridade, não dado pessoal
- release do ciclo não substitui automaticamente ato oficial publicado
```

### 3.2 Parâmetros locais configuráveis

Cada município pode parametrizar:

```txt
- duração do mandato do Maintainer Territorial
- limite de mandatos consecutivos
- prazo de inscrição para sorteio
- prazo de maturação de demandas
- calendário do ciclo do OP
- tamanho do envelope orçamentário
- critérios do índice de carência
- prazos de execução por tipo de demanda
- quórum de recall
- prazo de recurso
```

### 3.3 Limites que o município não pode violar

```txt
- maintainer vitalício é proibido
- exclusão de território reconhecido é proibida
- recusa sem justificativa é proibida
- alteração invisível de histórico é proibida
- publicação de CPF, voto individual ou denúncia sensível é proibida
- filtro institucional sem fundamento é proibido
- dado pessoal sensível em blockchain é proibido
```

---

## Parte 4 — Sorteio do Maintainer Territorial

### 4.1 Universo habilitável

Entram no universo habilitável:

```txt
- cidadãos cadastrados
- com vínculo territorial validado
- pertencentes ao território
- sem impedimento registrado
- aptos conforme regra local do ciclo
```

### 4.2 Universo sorteável

Entram no universo sorteável:

```txt
- cidadãos habilitados
- que se inscreveram no período aberto pelo Maintainer Geral
- que aceitaram participar do rito
```

O sorteio não deve ser um opt-in invisível. O Maintainer Geral deve abrir o
período de inscrição com convite ativo: comunicação pública e notificações para
todos os cidadãos habilitáveis do território.

### 4.3 Fluxo do sorteio

```txt
1. Maintainer Geral abre período de inscrição
2. cidadãos vinculados ao território se inscrevem
3. sistema publica hash da lista de elegíveis
4. sistema usa seed pública auditável
5. sorteia titular e suplentes
6. abre janela de contestação
7. confirma representante territorial
8. registra tudo em audit log
```

### 4.4 Se houver apenas uma pessoa inscrita

Não deve haver posse plena automática sem rito.

Regra sugerida:

```txt
- aclamação condicionada
- publicação do nome
- janela de contestação
- checagem de impedimentos
- mandato provisório ou reduzido, se o município assim parametrizar
- novo convite ativo no ciclo seguinte
```

### 4.5 Se não houver pessoas inscritas

O território não deve ser excluído.

Regra sugerida:

```txt
- território segue sem maintainer territorial ativo
- cidadãos continuam podendo abrir demandas, apoiar e acompanhar
- Maintainer Geral faz zeladoria limitada do rito
- filtro local fica marcado como provisório
- novo convite ativo deve ser aberto
- situação aparece publicamente como risco de representação
```

### 4.6 Ajuda de custo

Ajuda de custo não deve ser tratada como prêmio político.

Ela é instrumento de inclusão. Sem apoio material, só participa quem tem tempo,
renda e estabilidade.

Regra sugerida:

```txt
- município pode prever transporte, alimentação, internet ou diária cívica
- valor deve ser público
- pagamento deve ser auditável
- ajuda de custo não cria vínculo empregatício nem cargo permanente
```

**[DECIDIR]** Se ajuda de custo será obrigatória no kernel comum ou parâmetro
local fortemente recomendado.

### 4.7 Auditoria do sorteio

Blockchain pode ser usada como âncora de integridade, não como banco de dados
pessoal.

Pode ir para blockchain:

```txt
- hash da lista elegível
- seed pública
- hash do resultado
- data e identificador do ciclo
- hash da ata do sorteio
```

Nunca deve ir para blockchain:

```txt
- CPF
- nome completo
- endereço
- documento
- dado sensível
- voto individual
```

---

## Parte 5 — Esteira de demandas do OP

O fluxo não é uma linha reta. É uma linha de produção cívica com retornos
controlados.

### 5.1 Estados principais

```txt
0. ciclo aberto
1. cadastro e vínculo territorial
2. inscrição para Maintainer Territorial
3. sorteio
4. demanda recebida
5. engajamento inicial
6. agrupamento ou fork
7. maturação territorial
8. primeiro filtro
9. circuit breaker jurídico-orçamentário
10. demanda apta
11. votação territorial
12. consolidação municipal
13. matriz do OP
14. institucionalização na Câmara
15. merge institucional no PPA/LDO/LOA
16. release do ciclo
17. execução
18. aprendizado
```

### 5.2 Demanda, proposta, projeto e item institucionalizado

```txt
Demanda
  problema bruto apresentado pelo cidadão

Proposta
  demanda amadurecida em solução possível

Projeto priorizado
  proposta que avançou na votação territorial ou consolidação municipal

Item institucionalizado
  projeto incorporado ao rito formal: PPA, LDO, LOA, emenda, anexo,
  plano de execução ou compromisso oficial
```

### 5.3 Retornos da esteira

```txt
falta informação          → volta para maturação
demanda duplicada         → agrupa
soluções diferentes       → cria fork
fora do território        → reterritorializa ou permite contestação
custo alto demais         → faseia ou envia para ciclo plurianual
fora da competência       → reivindicação externa
ilegal/inconstitucional   → bloqueia com fundamento e permite reformulação
sem apoio suficiente      → fica dormente para ciclo futuro
recusa institucional      → devolve com justificativa formal auditável
```

Regra:

> A proposta só deve ser arquivada sem retorno quando houver fundamento claro,
> público, auditado e não reformulável.

---

## Parte 6 — Filtros e circuit breaker

### 6.1 Primeiro filtro territorial

Responsável principal: Maintainer Territorial.

Verifica:

```txt
- se a demanda pertence ao território
- se é um problema público
- se há informação mínima
- se é duplicada
- se precisa ser agrupada
- se precisa virar fork
```

Esse filtro não decide mérito político. Ele organiza a esteira.

### 6.2 Circuit breaker jurídico-orçamentário

Responsável principal: sistema, com regras públicas do protocolo.

O circuit breaker verifica:

```txt
- competência municipal
- custo incompatível com o envelope
- necessidade de faseamento
- dependência de outro ente federativo
- vedação constitucional ou legal
- benefício privado indevido
- violação de direitos fundamentais
```

Possíveis respostas:

```txt
passa
precisa de informação
precisa ser adaptada
precisa virar fork
excede o orçamento do ciclo
depende de outro ente
deve ir para ciclo plurianual
deve ser reivindicação externa
bloqueada com fundamento
```

### 6.3 Filtro institucional do Legislativo

Responsável: Maintainer Geral.

Na etapa da matriz do OP, o Legislativo pode apontar impedimento formal para
prosseguimento.

Esse filtro não pode ser veto político invisível.

Toda negativa deve informar:

```txt
- qual regra impede
- qual custo inviabiliza
- qual incompatibilidade existe
- qual ajuste permitiria prosseguir
- se a proposta volta para maturação, fork ou ciclo seguinte
```

---

## Parte 7 — Bairro sem maintainer

A ausência de Maintainer Territorial não pode excluir o território do OP.

Território sem maintainer ativo:

```txt
leitura pública                      : SIM
cadastro e vínculo territorial        : SIM
demanda simples                       : SIM
apoio ou não apoio                    : SIM
comentários e complementação          : SIM
acompanhamento de execução            : SIM
inscrição para novo sorteio           : SIM
votação territorial                   : [DECIDIR regra local]
primeiro filtro territorial           : Maintainer Geral em zeladoria limitada
situação marcada como provisória      : SIM
```

Princípio:

> Território sem maintainer não fica mudo. O sistema marca a fragilidade, mas
> não pune a população pela falta de representante.

**[DECIDIR]** Se votação territorial pode ocorrer sem Maintainer Territorial
ativo ou se depende de zeladoria provisória formal do Maintainer Geral.

---

## Parte 8 — Privacidade, denúncia sigilosa e dominação local

O sistema deve prever denúncia sigilosa como opção.

Casos possíveis:

```txt
- abuso de Maintainer Territorial
- pressão política local
- compra de apoio
- ameaça ou constrangimento
- fraude no vínculo territorial
- manipulação de demanda
```

Modelo recomendado:

```txt
- conteúdo sigiloso fica criptografado fora da blockchain
- blockchain guarda apenas hash de existência e integridade
- acesso ao conteúdo depende de rito formal
- toda abertura de dado sensível gera audit log
- relatórios públicos usam agregados, não identificação pessoal
```

Regra forte:

> Blockchain prova que algo existiu e não foi alterado. Ela não deve carregar
> a pessoa.

---

## Parte 9 — UI que esconde a constituição

Condição de adoção: o cidadão não deve precisar entender a máquina institucional
para participar.

O cidadão não deve ver:

```txt
state machine
trust_level
ABAC
circuit breaker jurídico-orçamentário
audit chain
hash anchor
```

O cidadão deve ver:

```txt
Qual é o seu bairro?
Você mora, trabalha ou estuda aqui?
Qual problema você quer registrar?
Outras pessoas também apoiam essa demanda.
Sua demanda precisa de mais informação.
Sua proposta voltou para ajuste.
Esta proposta está pronta para votação.
Esta demanda foi aprovada e agora será acompanhada.
```

Princípio:

> O backend guarda o rigor institucional; a interface entrega simplicidade
> cívica.

---

## Parte 10 — Release do ciclo

A release do ciclo é a versão pública, consolidada e auditável de um ciclo de
Orçamento Participativo.

Ela registra:

```txt
- demandas aprovadas
- propostas priorizadas
- territórios beneficiados
- vínculo com PPA, LDO e LOA
- valores previstos
- prazos
- status institucional
- hash de auditoria
- itens em execução
- divergências ou recusas justificadas
```

A release não substitui automaticamente o ato oficial publicado.

Se houver divergência entre o sistema e o ato oficial, o sistema deve abrir um
incidente público de divergência institucional.

Regra:

```txt
para efeito jurídico formal, prevalece o ato oficial publicado
para efeito de auditoria pública, permanece o histórico do Código Público
```

---

## Parte 11 — Execução e aprendizado

O ciclo não termina na votação. Termina na execução e no aprendizado.

Estados de execução:

```txt
não iniciada
em planejamento
em licitação
em execução
atrasada
paralisada
concluída
cancelada
frustrada
```

Eventos de aprendizado:

```txt
- promessa frustrada vira memória do território
- atraso recorrente aumenta prioridade de fiscalização
- demanda dormente pode voltar no ciclo seguinte
- território com carência persistente pode ganhar peso no próximo ciclo,
  conforme parâmetro local
```

**[DECIDIR]** Como a frustração de execução altera quantitativamente o índice
de carência ou o envelope financeiro do território no ciclo seguinte.

---

## Ordem de execução recomendada

```txt
1. Fechar o protocolo operacional do OP
2. Fechar regra comum vs. regra local
3. Modelar ciclo, demanda, proposta, fork, filtro, matriz e execução
4. Implementar inscrição e sorteio de Maintainer Territorial
5. Implementar esteira de demanda simples até proposta apta
6. Implementar votação territorial e matriz do OP
7. Implementar institucionalização no PPA/LDO/LOA
8. Implementar release do ciclo e execução fiscalizada
9. Implementar auditoria, denúncias sigilosas e âncoras blockchain
10. Preparar piloto institucional com Câmara municipal
```

Por que esta ordem: antes de crescer em funcionalidades, o sistema precisa
definir o rito. Um bug na governança não é só bug técnico; pode virar injustiça
territorial.

---

## Artefatos a produzir

```txt
docs/PROTOCOLO-OP.md
docs/REGRAS-DO-PROTOCOLO.md
docs/GOVERNANCA-TERRITORIAL.md
docs/PROTOCOLO-DE-MAINTAINERS-TERRITORIAIS.md
docs/PROTOCOLO-DE-VINCULO-TERRITORIAL.md
docs/ORCAMENTO-PARTICIPATIVO.md
```

---

## Riscos abertos a vigiar

```txt
- captura do Maintainer Territorial
- Legislativo como veto invisível
- especialista como porteiro do processo
- território sem maintainer virar território mudo
- demanda impossível virar frustração popular
- blockchain usada indevidamente para dado pessoal
- complexidade institucional afastar cidadão comum
- execução frustrada não afetar ciclo seguinte
```

---

## Decisões pendentes

1. Duração do mandato do Maintainer Territorial.
2. Limite de mandatos consecutivos.
3. Quórum de recall territorial.
4. Prazo de inscrição para sorteio.
5. Regra final para território com apenas uma pessoa inscrita.
6. Regra final para território sem inscritos.
7. Se território sem maintainer pode votar ou precisa de zeladoria formal.
8. Se ajuda de custo será obrigatória ou parâmetro local recomendado.
9. Fórmula do índice de carência.
10. Como custo alto demais retorna: faseamento, ciclo plurianual ou bloqueio.
11. Lista de vedações do circuit breaker jurídico-orçamentário.
12. Como a matriz OP entra formalmente no PPA, LDO e LOA.
13. Como divergência entre sistema e ato oficial é corrigida.
14. Como execução frustrada altera o próximo ciclo.
15. Quais eventos serão ancorados em blockchain.
