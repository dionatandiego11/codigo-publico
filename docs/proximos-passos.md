# Proximos Passos - Codigo Publico

Roteiro para transformar a nova teoria do Codigo Publico em modelo operacional.

Atualizado em 15/06/2026.

## Nova Direcao

O Codigo Publico passa a ser tratado como infraestrutura publica de Orcamento Participativo municipal.

A metafora de GitHub continua existindo, mas como arquitetura interna: historico, versao, auditoria, merge institucional e release do ciclo. Para o cidadao, o eixo principal passa a ser:

```text
territorio
-> demanda simples
-> apoio comunitario
-> maturacao
-> filtros publicos
-> votacao territorial
-> consolidacao municipal
-> institucionalizacao no PPA/LDO/LOA
-> execucao fiscalizada
-> aprendizado do proximo ciclo
```

O objetivo agora nao e apenas consultar normas, abrir issues ou propor PRs civicos. O objetivo e transformar problemas territoriais em decisoes orcamentarias rastreaveis.

## Onde Estamos

A base tecnica existente ainda e aproveitavel:

- backend Go com autenticacao, votacao, auditoria, releases e dados publicos;
- frontend React integrado a API, com fallback local e rotas funcionais;
- trilha conceitual de governanca territorial, auditoria, blockchain e maintainer territorial;
- documentacao teorica ja apontando para OP, sorteio, territorio, execucao e aprendizado.

Mas o produto ainda esta organizado no eixo antigo:

```text
Lei Organica -> issue -> PR civico -> voting -> merge -> release
```

A proxima etapa e migrar o eixo do sistema para:

```text
Ciclo OP -> territorio -> demanda -> proposta -> votacao territorial -> matriz OP -> execucao
```

## Prioridade 1 - Fechar o Protocolo Operacional do OP

Antes de codar novas telas ou endpoints, precisamos fechar o protocolo do ciclo.

- [ ] Consolidar `fluxo.md` dentro da documentacao oficial, possivelmente como `docs/PROTOCOLO-OP.md`.
- [ ] Definir a diferenca formal entre:
  - demanda;
  - proposta;
  - fork;
  - projeto priorizado;
  - item institucionalizado;
  - item em execucao.
- [ ] Definir os estados oficiais da esteira:
  - ciclo aberto;
  - cadastro e vinculo territorial;
  - inscricao para maintainer territorial;
  - sorteio;
  - demanda recebida;
  - engajamento inicial;
  - agrupada;
  - fork criada;
  - em maturacao;
  - filtro territorial;
  - circuit breaker juridico-orcamentario;
  - apta para votacao;
  - em votacao;
  - priorizada;
  - consolidada na matriz OP;
  - em institucionalizacao;
  - incorporada ao PPA/LDO/LOA;
  - em execucao;
  - concluida;
  - frustrada;
  - devolvida para ajuste.
- [ ] Definir o que acontece quando uma proposta nao avanca:
  - volta para maturacao;
  - vira fork;
  - e agrupada;
  - vai para ciclo plurianual;
  - vira reivindicacao externa;
  - fica dormente para ciclo futuro;
  - abre recurso ou contestacao.
- [ ] Definir o vocabulario de filtros:
  - falta de informacao;
  - duplicidade;
  - fora do territorio;
  - fora da competencia municipal;
  - custo maior que o envelope;
  - incompatibilidade constitucional ou legal;
  - necessidade de faseamento;
  - dependencia de outro ente federativo.

## Prioridade 2 - Separar Regra Comum e Regra Local

O sistema precisa funcionar como "code is law": regras do rito devem ser publicas, auditaveis e parametrizaveis.

- [ ] Criar documento `docs/REGRAS-DO-PROTOCOLO.md`.
- [ ] Definir o kernel comum obrigatorio:
  - nenhum territorio sem voz;
  - 1 representante por territorio;
  - mandato sempre temporario;
  - sorteio auditavel;
  - todo filtro exige justificativa;
  - toda negativa gera retorno, recurso, fork ou memoria publica;
  - voto individual nunca e exposto;
  - dados sensiveis nunca vao para blockchain;
  - release do ciclo nao substitui ato oficial publicado.
- [ ] Definir parametros locais configuraveis por municipio:
  - duracao do mandato do Maintainer Territorial;
  - limite de mandatos consecutivos;
  - prazo de inscricao para sorteio;
  - prazo de maturacao de demandas;
  - criterios do indice de carencia;
  - tamanho do envelope orcamentario;
  - calendario do ciclo;
  - regras de recall;
  - prazos de execucao por tipo de demanda.
- [ ] Definir limites que o municipio nao pode violar:
  - maintainer vitalicio proibido;
  - exclusao de territorio proibida;
  - recusa sem justificativa proibida;
  - alteracao invisivel de historico proibida;
  - publicacao de CPF, voto individual ou denuncia sensivel proibida;
  - filtro institucional sem fundamento proibido.

## Prioridade 3 - Modelar as Entidades do OP

O banco e a API precisam ganhar entidades proprias de Orcamento Participativo.

- [ ] `op_cycles`
  - ciclo do OP, calendario, status, ano, municipio, orcamento disponivel.
- [ ] `territorial_bonds`
  - vinculo entre cidadao e territorio.
- [ ] `territorial_maintainer_applications`
  - inscricoes para sorteio de maintainer territorial.
- [ ] `territorial_maintainer_draws`
  - sorteios, seed publica, hash, resultado e suplentes.
- [ ] `budget_demands`
  - demanda simples aberta pelo cidadao.
- [ ] `budget_demand_supports`
  - apoios, nao apoios e sinais de engajamento territorial.
- [ ] `budget_proposals`
  - demanda amadurecida em proposta.
- [ ] `budget_proposal_forks`
  - alternativas para o mesmo problema.
- [ ] `budget_filters`
  - registros de filtro territorial, juridico-orcamentario ou institucional.
- [ ] `budget_votes`
  - votacao territorial sobre propostas aptas.
- [ ] `op_matrix_items`
  - itens consolidados na matriz municipal do OP.
- [ ] `institutionalizations`
  - vinculo com Camara, PPA, LDO, LOA, emenda, anexo ou ato oficial.
- [ ] `execution_items`
  - acompanhamento da execucao.
- [ ] `cycle_learning_events`
  - efeitos de atraso, frustracao ou conclusao no ciclo seguinte.

## Prioridade 4 - Reorientar o Backend

O backend deve deixar de crescer em torno de `issues` e `prs` como centro do dominio.

- [ ] Criar dominio `op` no backend:
  - `internal/op/cycles`;
  - `internal/op/demands`;
  - `internal/op/proposals`;
  - `internal/op/filters`;
  - `internal/op/votings`;
  - `internal/op/matrix`;
  - `internal/op/execution`.
- [ ] Manter `issues` e `prs` como legado ou camada de compatibilidade, se ainda forem uteis.
- [ ] Implementar endpoints publicos iniciais:
  - `GET /api/v1/op/cycles/current`;
  - `GET /api/v1/op/cycles/{id}`;
  - `GET /api/v1/territories/{id}/demands`;
  - `GET /api/v1/territories/{id}/proposals`;
  - `GET /api/v1/op/matrix`;
  - `GET /api/v1/op/executions`.
- [ ] Implementar endpoints autenticados:
  - `POST /api/v1/territorial-bonds`;
  - `POST /api/v1/op/demands`;
  - `POST /api/v1/op/demands/{id}/support`;
  - `POST /api/v1/op/demands/{id}/comments`;
  - `POST /api/v1/op/proposals/{id}/vote`;
- [ ] Implementar endpoints de fluxo:
  - `POST /api/v1/op/demands/{id}/group`;
  - `POST /api/v1/op/demands/{id}/fork`;
  - `POST /api/v1/op/proposals/{id}/filters`;
  - `POST /api/v1/op/matrix/{id}/institutionalize`;
  - `POST /api/v1/op/executions/{id}/updates`.
- [ ] Todo movimento de estado deve gerar `audit_event`.

## Prioridade 5 - Reorientar o Frontend

A primeira tela deve deixar claro que o sistema e uma infraestrutura de OP.

- [ ] Trocar a home para mostrar:
  - ciclo atual do OP;
  - meu territorio;
  - prazo do ciclo;
  - orcamento disponivel;
  - demandas abertas no meu territorio;
  - propostas aptas para votacao;
  - itens aprovados em execucao.
- [ ] Criar fluxo de entrada:
  - cadastro;
  - vinculo territorial;
  - inscricao para maintainer territorial;
  - acompanhamento do sorteio.
- [ ] Criar tela de demanda simples:
  - problema;
  - local;
  - territorio;
  - categoria;
  - descricao;
  - foto opcional.
- [ ] Criar tela de maturacao:
  - apoios;
  - nao apoios;
  - comentarios;
  - informacoes faltantes;
  - agrupamentos;
  - forks.
- [ ] Criar tela de proposta:
  - versao amadurecida;
  - historico da demanda;
  - filtros aplicados;
  - caminho de retorno se bloqueada;
  - status na esteira.
- [ ] Criar tela da matriz OP:
  - propostas priorizadas por territorio;
  - status institucional;
  - vinculo com PPA/LDO/LOA;
  - justificativas do Legislativo.
- [ ] Criar tela de execucao:
  - item aprovado;
  - prazo;
  - responsavel;
  - status;
  - evidencias;
  - atrasos;
  - impacto no proximo ciclo.

## Prioridade 6 - Sorteio Civico e Maintainers Territoriais

O sorteio deve ser um modulo central do OP.

- [ ] Definir o universo sorteavel:
  - cidadaos com vinculo territorial validado;
  - inscritos voluntariamente;
  - sem impedimento registrado;
  - pertencentes ao territorio.
- [ ] Implementar inscricao para maintainer territorial.
- [ ] Implementar sorteio auditavel:
  - lista elegivel;
  - hash da lista;
  - seed publica;
  - resultado;
  - suplentes;
  - janela de contestacao.
- [ ] Definir regra quando ha apenas uma pessoa inscrita:
  - aclamacao condicionada;
  - janela publica de contestacao;
  - mandato provisorio ou reduzido, se o municipio assim parametrizar.
- [ ] Definir regra quando nao ha inscritos:
  - territorio segue sem maintainer territorial ativo;
  - cidadaos continuam podendo abrir demandas e votar;
  - Maintainer Geral faz zeladoria limitada;
  - novo convite ativo deve ser aberto.

## Prioridade 7 - Auditoria, Privacidade e Blockchain

Blockchain deve servir para prova de integridade, nao para guardar dados pessoais.

- [ ] Definir eventos ancoraveis:
  - abertura de ciclo;
  - hash da lista elegivel do sorteio;
  - resultado do sorteio;
  - matriz OP consolidada;
  - release do ciclo;
  - atualizacoes relevantes de execucao.
- [ ] Garantir que nunca vao para blockchain:
  - CPF;
  - nome completo;
  - endereco;
  - documento;
  - voto individual;
  - denuncia identificavel;
  - dados sensiveis.
- [ ] Criar modelo de denuncia sigilosa:
  - conteudo criptografado fora da blockchain;
  - hash publico de existencia;
  - acesso apenas por rito formal;
  - abertura de dado sempre auditada.
- [ ] Definir como auditar sem expor:
  - prova de existencia;
  - prova de integridade;
  - agregados publicos;
  - dados pessoais protegidos.

## Prioridade 8 - Execucao e Aprendizado

O ciclo nao termina na votacao. Termina na execucao e no aprendizado.

- [ ] Criar estados oficiais de execucao:
  - nao iniciada;
  - em planejamento;
  - em licitacao;
  - em execucao;
  - atrasada;
  - paralisada;
  - concluida;
  - cancelada;
  - frustrada.
- [ ] Criar eventos de execucao:
  - atualizacao de prazo;
  - atualizacao de valor;
  - evidencia anexada;
  - justificativa de atraso;
  - contestacao cidada;
  - conclusao.
- [ ] Definir regra de aprendizado:
  - atraso recorrente aumenta prioridade de fiscalizacao;
  - promessa frustrada entra como memoria do territorio;
  - territorio com carencia persistente ganha peso no proximo ciclo, conforme parametro local;
  - demandas dormentes podem retornar no ciclo seguinte.

## Prioridade 9 - Confiabilidade Tecnica

A virada para OP aumenta a responsabilidade do sistema.

- [ ] Atualizar testes existentes para o novo dominio de OP.
- [ ] Criar testes de maquina de estados da esteira.
- [ ] Criar testes para sorteio:
  - elegibilidade;
  - seed;
  - suplentes;
  - contestacao;
  - caso sem inscritos;
  - caso com inscrito unico.
- [ ] Criar testes para filtros:
  - volta para maturacao;
  - fork;
  - bloqueio com justificativa;
  - recurso;
  - audit_event obrigatorio.
- [ ] Criar CI com:
  - `go test`;
  - `go vet`;
  - `npm run build`;
  - typecheck do frontend.
- [ ] Adotar ferramenta de migrations:
  - `goose` ou `golang-migrate`;
  - controle de versoes aplicadas;
  - rollback planejado para ambiente de teste.

## Prioridade 10 - Piloto Institucional

O Codigo Publico precisa de uma cidade piloto e de um rito formal de OP.

- [ ] Escrever minuta de lei ou resolucao instituindo o OP via Codigo Publico.
- [ ] Definir o papel da Camara como Maintainer Geral.
- [ ] Definir o papel do Maintainer Tecnico.
- [ ] Definir territorios iniciais do municipio.
- [ ] Definir calendario do primeiro ciclo.
- [ ] Definir envelope orcamentario inicial.
- [ ] Definir como a matriz OP entra no PPA, LDO e LOA.
- [ ] Definir como divergencias entre sistema e ato oficial serao tratadas.

## Sequencia Recomendada

1. Transformar `fluxo.md` em protocolo oficial do OP.
2. Fechar regra comum vs regra local.
3. Modelar entidades do OP no banco e nos contratos.
4. Criar o dominio `op` no backend.
5. Redesenhar a home e o fluxo principal do frontend para ciclo, territorio e demanda.
6. Implementar sorteio de Maintainer Territorial.
7. Implementar demanda simples, apoio, maturacao, fork e filtro.
8. Implementar votacao territorial e matriz OP.
9. Implementar institucionalizacao, release do ciclo e execucao.
10. Preparar piloto institucional com Camara municipal.

## Frase Guia

O Codigo Publico transforma uma demanda simples de um territorio em decisao orcamentaria rastreavel.

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
