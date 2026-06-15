# Fluxo do Código Público como Infraestrutura de Orçamento Participativo

O Código Público passa a ser entendido como uma infraestrutura pública, auditável e open source de Orçamento Participativo municipal.

A lógica central deixa de ser apenas "GitHub de leis" e passa a ser uma esteira cívica:

```text
território
-> demanda simples
-> apoio comunitário
-> maturação
-> filtros públicos
-> votação territorial
-> consolidação municipal
-> institucionalização
-> execução
-> aprendizado do proximo ciclo
```

O princípio `code is law` permanece como base: as regras do processo precisam estar descritas em protocolo, implementadas no sistema, auditáveis e parametrizáveis por município dentro de limites comuns.

## Premissas do Fluxo

- O Orçamento Participativo é o eixo principal do sistema.
- O território é a unidade política base.
- Cada bairro, comunidade ou distrito tem direito a 1 representante territorial.
- A escolha do representante territorial ocorre por inscrição e sorteio.
- A demanda nasce simples e amadurece por camadas.
- O sistema deve evitar que especialistas ou burocracias sejam porteiros únicos do processo.
- Toda negativa deve gerar justificativa pública, possibilidade de correção, fork, recurso ou memória histórica.
- O Legislativo atua como Maintainer Geral do rito institucional.
- O Maintainer Técnico cuida da infraestrutura de TI, sem decidir mérito político.
- O Maintainer Territorial organiza o fluxo local, sem ser dono da vontade popular.

## Papeis

### Maintainer Geral

Representa o Legislativo municipal no sistema.

Responsabilidades:

- abrir o ciclo do Orcamento Participativo;
- definir calendario, territorios e orcamento disponivel;
- indicar ou validar o Maintainer Tecnico;
- receber a matriz consolidada do OP;
- conduzir a institucionalizacao na Camara;
- incorporar o resultado ao rito de PPA, LDO e LOA;
- justificar publicamente filtros institucionais.

### Maintainer Tecnico

Responsavel pela operacao tecnica do sistema.

Responsabilidades:

- manter a infraestrutura;
- configurar parametros aprovados institucionalmente;
- garantir disponibilidade, seguranca e auditoria;
- nao decidir merito politico das propostas.

### Maintainer Territorial

Representante temporario de um territorio, escolhido por inscricao e sorteio.

Responsabilidades:

- organizar demandas do territorio;
- agrupar demandas parecidas;
- orientar forks de solucoes diferentes;
- pedir complementacao quando faltar informacao;
- validar se a demanda pertence ao territorio;
- encaminhar demandas maduras para votacao;
- justificar publicamente filtros aplicados.

Limites:

- nao pode apagar historico;
- nao pode rejeitar demanda por opiniao pessoal;
- nao pode impedir contestacao;
- nao pode transformar o territorio em autoridade privada;
- nao pode decidir sozinho o merito politico da comunidade.

### Cidadaos do Territorio

Responsabilidades:

- cadastrar-se no sistema;
- criar vinculo territorial;
- abrir demandas simples;
- apoiar ou nao apoiar demandas;
- comentar e complementar informacoes;
- participar da votacao territorial;
- fiscalizar a execucao.

## Esteira Principal

| Etapa | Estado | O que acontece | Quem atua |
|---|---|---|---|
| 0 | Ciclo aberto | Legislativo abre o ciclo do OP, calendario, territorios e orcamento disponivel | Maintainer Geral, com indicacao do Maintainer Tecnico |
| 1 | Cadastro e vinculo | A populacao se cadastra no sistema e cria vinculo com um territorio | Cidadaos |
| 2 | Inscricao territorial | Abre-se o periodo de inscricao para quem deseja se tornar Maintainer Territorial | Cidadaos vinculados ao territorio |
| 3 | Sorteio | O sistema realiza sorteio entre inscritos habilitados | Sistema, com auditoria publica |
| 4 | Demanda recebida | Cidadao registra um problema simples | Cidadao |
| 5 | Engajamento inicial | Moradores podem apoiar ou nao apoiar a demanda | Cidadaos do territorio |
| 6 | Agrupamento ou fork | Demandas parecidas sao agrupadas; solucoes diferentes viram forks | Sistema e Maintainer Territorial |
| 7 | Maturacao territorial | O problema ganha contexto: local, causa, urgencia e alternativas possiveis | Comunidade e Maintainer Territorial |
| 8 | Primeiro filtro | Verifica se e do territorio, se e publico, se nao e duplicado e se tem informacao minima | Maintainer Territorial |
| 9 | Circuit breaker juridico-orcamentario | Sistema aplica regras publicas de admissibilidade | Sistema e regras do protocolo |
| 10 | Demanda apta | A proposta esta madura o bastante para ir a votacao | Maintainer Territorial |
| 11 | Votacao territorial | A populacao vota nas propostas aptas a partir dos filtros anteriores | Cidadaos do territorio |
| 12 | Consolidacao municipal | Representantes territoriais levam propostas votadas para a matriz geral | Representantes territoriais sorteados |
| 13 | Matriz do OP | Sistema monta lista consolidada e entrega ao Maintainer Geral, que filtra o que pode prosseguir | Sistema e Maintainer Geral |
| 14 | Institucionalizacao | Propostas que avancam sao formalizadas no rito da Camara | Legislativo |
| 15 | Merge institucional | Legislativo incorpora o resultado ao rito de PPA, LDO e LOA | Maintainer Geral |
| 16 | Release do ciclo | Sistema publica a versao consolidada do ciclo do OP | Sistema |
| 17 | Execucao | Cada demanda aprovada vira item fiscalizavel | Executivo e cidadaos |
| 18 | Aprendizado | Execucao, atraso ou frustracao influenciam o proximo ciclo | Sistema |

## Imagem Mental do Processo

O fluxo nao e uma linha reta. Ele e uma linha de producao com retornos controlados.

```text
Ciclo OP
  ↓
Cadastro + vinculo territorial
  ↓
Inscricao para Maintainer Territorial
  ↓
Sorteio do Maintainer Territorial
  ↓
Demanda simples nasce
  ↓
Apoio / nao apoio da populacao
  ↓
Agrupamento ou fork
  ↓
Maturacao territorial
  ↓
Filtro territorial
  ↺ se faltar informacao, volta para maturacao
  ↓
Circuit breaker juridico-orcamentario
  ↺ se for ajustavel, volta para fork ou maturacao
  ↓
Apta para votacao
  ↓
Votacao territorial
  ↓
Consolidacao municipal
  ↓
Filtro institucional do Legislativo
  ↺ se houver impedimento formal, volta para ajuste territorial
  ↓
Institucionalizacao na Camara
  ↓
Merge no PPA / LDO / LOA
  ↓
Release do ciclo
  ↓
Execucao fiscalizada
  ↓
Aprendizado para o proximo ciclo
```

## Distincao Entre Demanda, Proposta, Projeto e Item Institucionalizado

### Demanda

E o problema bruto apresentado pelo cidadao.

Exemplo:

> Falta medico no PSF do meu bairro.

### Proposta

E a demanda amadurecida em uma solucao possivel.

Exemplo:

> Garantir escala minima de clinico geral no PSF do bairro tres vezes por semana.

### Projeto Priorizado

E a proposta que avancou na votacao territorial ou na consolidacao municipal.

### Item Institucionalizado

E aquilo que entrou no rito formal do municipio: Camara, PPA, LDO, LOA, emenda, anexo, plano de execucao ou compromisso oficial.

## Retornos da Esteira

Quando algo nao avanca, o sistema nao deve simplesmente encerrar o processo. Ele deve indicar o caminho de retorno.

| Problema encontrado | O que nao deve acontecer | Caminho correto |
|---|---|---|
| Falta informacao | Arquivar sem orientacao | Voltar para maturacao |
| Demanda duplicada | Apagar a demanda | Agrupar |
| Solucoes diferentes | Criar conflito improdutivo | Criar fork |
| Fora do territorio | Rejeitar sem saida | Reterritorializar ou permitir contestacao |
| Custo alto demais | Bloquear apenas | Dividir em fases ou enviar para ciclo plurianual |
| Fora da competencia municipal | Apagar | Encaminhar como reivindicacao externa |
| Inconstitucional ou ilegal | Deletar | Bloquear com fundamento e permitir reformulacao |
| Nao teve apoio | Matar definitivamente | Manter como demanda dormente para ciclo futuro |
| Legislativo recusou | Sumir com a proposta | Devolver com justificativa formal auditavel |

Regra geral:

> Toda negativa deve gerar caminho de correcao, fork, recurso ou memoria publica.

## Agrupamento e Fork

Demandas parecidas podem ser agrupadas para evitar dispersao.

Solucoes diferentes para o mesmo problema devem poder virar forks.

Exemplo de demanda original:

> Quero uma UTI no PSF do bairro.

O sistema pode preservar o problema e criar alternativas:

- fork A: ampliar horario de atendimento;
- fork B: criar sala de estabilizacao;
- fork C: reforcar transporte sanitario;
- fork D: contratar equipe adicional;
- fork E: encaminhar para pactuacao regional de saude.

A demanda original nao precisa morrer. Ela pode amadurecer em alternativas mais viaveis.

## Circuit Breaker Juridico-Orcamentario

O circuit breaker e uma camada de protecao do protocolo.

Ele nao existe para humilhar o cidadao nem matar participacao. Ele existe para impedir que propostas avancem sem compatibilidade minima com o orcamento, a competencia municipal ou direitos fundamentais.

Possiveis respostas:

- passa;
- precisa de informacao;
- precisa ser adaptada;
- precisa virar fork;
- excede o orcamento do ciclo;
- depende de outro ente federativo;
- e incompativel com regra constitucional;
- deve ir para ciclo plurianual;
- deve ser encaminhada como reivindicacao externa.

Todo bloqueio deve ter:

- fundamento publico;
- explicacao simples;
- possibilidade de reformulacao quando cabivel;
- possibilidade de contestacao;
- registro em auditoria.

## Filtro Institucional do Legislativo

Na etapa da matriz do OP, o Maintainer Geral pode identificar impedimentos formais para que uma proposta prossiga.

Esse filtro nao pode ser uma recusa politica invisivel.

Toda negativa institucional deve informar:

- qual regra impede;
- qual custo inviabiliza;
- qual incompatibilidade existe;
- qual ajuste permitiria prosseguir;
- se a proposta volta para maturacao, fork ou ciclo seguinte.

## Release do Ciclo

A release do ciclo e a versao publica, consolidada e auditavel daquele ciclo de Orcamento Participativo.

Ela registra:

- demandas aprovadas;
- propostas priorizadas;
- territorios beneficiados;
- vinculo com PPA, LDO e LOA;
- valores previstos;
- prazos;
- status institucional;
- hash de auditoria;
- itens em execucao;
- divergencias ou recusas justificadas.

A release nao substitui automaticamente o ato oficial publicado. Ela e o registro publico e auditavel do ciclo.

Se houver divergencia entre o sistema e o ato oficial, o sistema deve abrir incidente publico de divergencia institucional.

## Sintese

O Codigo Publico transforma uma demanda simples em decisao orcamentaria rastreavel.

```text
O cidadao abre uma demanda simples.
O territorio amadurece.
O sistema filtra.
A comunidade vota.
Os representantes consolidam.
O Legislativo incorpora.
A execucao e fiscalizada.
O proximo ciclo aprende com o resultado.
```
