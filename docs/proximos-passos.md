# Proximos Passos - Codigo Publico

Roteiro atualizado para transformar o Codigo Publico em uma infraestrutura publica
de Orcamento Participativo municipal, partindo do estado real do codigo.

Atualizado em 17/06/2026.

## Direcao Atual

O Codigo Publico passa a ser tratado como infraestrutura publica, auditavel e open
source de Orcamento Participativo municipal.

A metafora de GitHub continua existindo, mas como arquitetura interna: historico,
versao, diffs, auditoria, merge institucional e release do ciclo. Para o cidadao,
o eixo principal e:

```text
territorio
-> demanda simples
-> apoio comunitario
-> maturacao
-> filtros publicos
-> votacao territorial
-> matriz municipal do OP
-> institucionalizacao no PPA/LDO/LOA
-> execucao fiscalizada
-> aprendizado do proximo ciclo
```

O objetivo nao e apenas consultar normas, abrir issues ou propor PRs civicos. O
objetivo e transformar problemas territoriais em decisoes orcamentarias
rastreaveis.

## Estado Real do Projeto

O projeto ja mudou de eixo em boa parte do backend e do frontend.

Ja existe:

- protocolo canonico do OP em `docs/PROTOCOLO-OP.md`;
- regras comuns e parametros locais em policy pura (`backend/internal/op`);
- ciclo do OP com fases, calendario derivado, regimento local e envelope;
- dominio OP iniciado no backend:
  - demandas;
  - propostas;
  - votacoes territoriais;
  - filtro institucional;
  - incidentes de divergencia;
  - circuit breaker juridico-orcamentario;
  - sorteio auditavel como policy pura;
- frontend principal reorientado para OP:
  - home por ciclo;
  - demandas;
  - propostas;
  - votacoes territoriais;
  - area do cidadao;
  - console de ciclo em `/admin`;
- vinculo territorial com pedido, recurso e validacao pelo maintainer;
- auditoria com hash encadeado e ancoragem noop/log;
- votacao com recibo opaco, resultado agregado e trava contra encerramento
  antecipado;
- apoio comunitario restrito ao territorio da demanda e a fase de Coleta.

Ainda falta:

- tornar o bootstrap institucional claro para abrir o primeiro ciclo em ambiente real;
- persistir inscricao e sorteio do conselho territorial;
- automatizar ou operacionalizar encerramento de votacoes vencidas;
- lapidar o fluxo de retorno territorial depois do filtro institucional do OP;
- aprofundar a pagina publica de incidentes de divergencia com vinculo ao detalhe da proposta;
- completar os fluxos visiveis depois dos gates de papel, territorio e fase;
- persistir sub-envelope territorial e filtros;
- construir matriz OP, institucionalizacao, execucao e aprendizado no novo dominio;
- substituir ou isolar melhor as telas legadas de issue/PR/Lei Organica.

## Mapa de Cobertura - Esteira x Backend x UI

| Stage | Backend | UI | Proximo ajuste |
|---|---|---|---|
| 0 - Abrir e avancar ciclo | OK | Parcial | Existe `/admin` com criacao, configuracao em Rascunho e avanco; falta bootstrap claro e CTA quando nao ha ciclo ativo. |
| 1 - Cadastro + vinculo territorial | OK | Parcial | Cadastro e pedido de vinculo existem; painel de validacao precisa entrar no fluxo principal de admin territorial. |
| 2-3 - Inscricao + sorteio do conselho | Parcial | Falta | Sorteio existe como policy pura; faltam inscricoes, persistencia, endpoint, seed publica, resultado e suplentes. |
| 4-7 - Demanda, apoio, fork, maturacao | OK | Parcial | Jornada existe e a UI ja bloqueia acoes por papel/fase/territorio; falta lapidar textos e refresh automatico apos mudanca de fase. |
| 8 - Circuit breaker | Parcial | Parcial | Regra usa sub-envelope territorial persistido, registra filtros, tem pagina historica, recurso territorial e decisao da instancia geral; falta notificar melhor o retorno na demanda. |
| 9-10 - Proposta apta e votacao | OK | Parcial | Abrir votacao, votar e encerrar votacao funcionam com gates de fase/papel/territorio; falta automatizar vencidas. |
| 11 - Resolucao da votacao | OK | Parcial | Encerramento manual existe na UI; falta avaliar job automatico para votacoes vencidas. |
| 12 - Filtro institucional | OK | Parcial | Painel OP existe no admin; falta conectar a visualizacao publica dos incidentes e lapidar fluxo de retorno ao territorio. |
| 12b - Incidentes de divergencia | OK | Parcial | Endpoint e pagina publica existem; falta detalhe navegavel da proposta e leitura por ciclo. |
| 13-16 - Matriz, PPA, execucao, aprendizado | Parcial | Parcial | Execucao atual ainda e do modelo legado; falta dominio OP completo. |

## Problemas Reais a Resolver Primeiro

### 1. Ciclo e bootstrap institucional

Sem ciclo ativo, o produto parece parado. O painel `/admin` ja existe, mas a
abertura do primeiro ciclo depende de usuario com papel ou maintainership correta.

- [x] Backend de ciclo:
  - `GET /api/v1/op/cycles`;
  - `GET /api/v1/op/cycles/current`;
  - `POST /api/v1/admin/op/cycles`;
  - `POST /api/v1/admin/op/cycles/{id}/advance`;
  - `POST /api/v1/admin/op/cycles/{id}/cancel`.
- [x] Tela inicial de admin para criar e avancar ciclo.
- [ ] Criar ou documentar bootstrap de usuario `sysadmin` / Maintainer Geral.
- [x] Permitir configurar ciclo em Rascunho pela UI, usando endpoint de configure.
- [ ] Mostrar CTA administrativo na home quando nao ha ciclo ativo e o usuario tem permissao.
- [ ] Mostrar explicacao publica quando nao ha ciclo ativo e o usuario nao tem permissao.

### 2. Dois mundos institucionais coexistindo

O modelo antigo de Lei/issue/PR ainda aparece em partes do app. O novo filtro
institucional do OP ja existe no backend e no painel administrativo, mas ainda
precisa ficar melhor conectado ao retorno territorial e a visibilidade publica
dos incidentes de divergencia.

- [x] Criar painel institucional do OP para propostas `Priorizada`.
- [x] Permitir tres desfechos com justificativa:
  - admitir na matriz;
  - filtrar por fundamento formal;
  - registrar veto politico.
- [ ] Isolar telas legadas de Lei/issue/PR em area secundaria ou remover da navegacao principal.
- [ ] Garantir que "merge institucional" antigo nao seja confundido com filtro institucional do OP.

### 3. Veto invisivel ainda nao ficou visivel

O incidente publico de divergencia e a parte mais importante do Fix 2: torna o
veto politico rastreavel e custoso. Hoje ele existe no backend, mas nao aparece
para a sociedade.

- [x] Backend de incidentes em `GET /api/v1/op/divergence-incidents`.
- [x] Criar pagina publica de incidentes de divergencia.
- [x] Mostrar proposta, territorio, justificativa, responsavel institucional e data.
- [x] Linkar a pagina a partir da home, propostas e painel institucional.
- [x] Corrigir auditoria do incidente para usar UUID interno em `entity_id` e `public_id` em `entity_public_id`.

## Prioridade 1 - Corrigir Regras Bloqueadoras

Antes de ampliar o produto, corrigir pontos que podem quebrar o rito ou gerar
decisao invalida.

Status em 17/06/2026: os bloqueadores de rito foram corrigidos. O regimento do
ciclo agora serializa janelas em dias no contrato publico/JSONB, mantendo
`time.Duration` apenas como representacao interna do dominio.

- [x] Corrigir `votingWindow` salvo como `time.Duration` no JSON do regimento:
  - hoje o SQL trata `votingWindow` como dias;
  - deve usar duracao real ou persistir janelas em dias de forma explicita.
- [x] Impedir apoio de cidadao fora do territorio da demanda.
- [x] Impedir apoio fora da fase `Coleta`, salvo regra explicita em contrario.
- [x] Impedir resolucao de votacao antes do prazo, ou exigir justificativa formal auditada.
- [x] Corrigir auditoria de `op_divergence_incident` para nao enviar `DIV-001` como UUID.
- [x] Criar testes unitarios para apoio territorial/fase e encerramento antes do prazo.
- [x] Criar teste/contrato para `votingWindow` depois de definir o formato final.
- [ ] Criar teste de repository/integracao para auditoria de incidente.

## Prioridade 2 - Gatear UI por Papel, Territorio e Fase

A UI deve traduzir a regra do backend, nao expor botoes que viram 403/409.

- [x] Usar `useAdminContext` nas telas de demanda, proposta e votacao.
- [x] Esconder ou desabilitar acoes de maintainer territorial para cidadao comum:
  - maturar;
  - pedir informacao;
  - validar territorialmente;
  - marcar apta;
  - agrupar;
  - criar proposta.
- [x] Mostrar por que a acao esta indisponivel:
  - sem permissao territorial;
  - ciclo fora da fase correta;
  - apoio minimo nao atingido;
  - demanda em estado terminal.
- [x] Abrir votacao apenas quando:
  - proposta esta `Apta para votacao`;
  - ciclo esta em `Votacao`;
  - usuario tem instancia territorial ou geral.
- [x] Votar apenas para cidadao vinculado ao territorio da proposta.
- [ ] Criar refresh do ciclo/contexto apos avancos administrativos para evitar fase desatualizada na UI.

## Prioridade 3 - Fechar Votacao Territorial

O ciclo visivel da decisao territorial ja esta fechado na UI. A pendencia agora
e reduzir operacao manual para votacoes vencidas e deixar o retorno mais claro
para o territorio.

- [x] Abrir votacao territorial.
- [x] Computar voto individual sem expor escolha publicamente.
- [x] Emitir recibo opaco.
- [x] Exibir resultado agregado.
- [x] Adicionar `resolveOPVoting` no client do frontend.
- [x] Adicionar acao "Encerrar votacao" para instancia territorial/geral.
- [x] Exibir resultado final:
  - quorum atingido;
  - aprovada ou rejeitada;
  - proposta `Priorizada` ou `Retornada para maturacao`.
- [x] Atualizar lista de propostas depois do encerramento da votacao.
- [ ] Avaliar job automatico para encerrar votacoes do OP vencidas.

## Prioridade 4 - Implementar Filtro Institucional do OP na UI

O backend e a UI administrativa ja implementam a decisao institucional. Falta
dar publicidade adequada aos incidentes e amadurecer o caminho de retorno ao
territorio quando uma proposta nao avancar.

- [x] Backend `POST /api/v1/admin/op/proposals/{id}/institutional-decision`.
- [x] Policy de classificacao:
  - admitida;
  - filtrada por fundamento formal;
  - veto politico com incidente publico.
- [x] Criar chamada no frontend para decisao institucional.
- [x] Criar painel de propostas priorizadas aguardando decisao.
- [x] Formular texto de interface em linguagem cidada:
  - "admitir na matriz";
  - "devolver com fundamento formal";
  - "registrar divergencia institucional".
- [x] Validar justificativa obrigatoria na UI.
- [x] Mostrar retorno ao territorio quando a proposta for filtrada.
- [x] Criar visao publica dedicada para incidentes gerados por veto politico.

## Prioridade 5 - Publicar Incidentes de Divergencia

Sem pagina publica, o veto politico continua invisivel.

- [x] Criar `getDivergenceIncidents` no frontend.
- [x] Criar pagina publica de incidentes.
- [x] Mostrar incidentes como registro civico, nao como tela tecnica.
- [x] Adicionar entrada na navegacao ou home.
- [ ] Linkar incidente ao detalhe da proposta quando existir tela de proposta detalhada.

## Prioridade 6 - Completar Circuit Breaker e Filtros

O circuit breaker existe como regra, mas ainda nao tem persistencia completa nem
interface de retorno.

- [x] Policy de admissibilidade juridico-orcamentaria.
- [x] Persistir sub-envelope territorial por ciclo.
- [x] Avaliar custo contra sub-envelope do territorio, nao envelope municipal total.
- [x] Criar `budget_filters` ou equivalente para registrar:
  - fundamento;
  - justificativa;
  - ator;
  - retorno da esteira;
  - possibilidade de recurso.
- [x] Mostrar na UI o caminho de retorno imediato quando a acao e recusada:
  - complementar informacao;
  - fasear;
  - fork;
  - ciclo plurianual;
  - reivindicacao externa.
- [x] Traduzir erro 422 em orientacao pratica, nao apenas toast tecnico.
- [x] Criar pagina historica dos filtros aplicados, por ciclo/territorio/demanda.
- [x] Implementar recurso ou contestacao do filtro quando o territorio discordar.
- [x] Implementar decisao do recurso pela instancia geral, com justificativa e retorno operacional.
- [ ] Criar notificacao/realce na demanda quando um recurso for deferido ou indeferido.

## Prioridade 7 - Persistir Sorteio Civico e Conselho Territorial

O sorteio auditavel e central para legitimidade, mas hoje esta apenas em policy
pura.

- [x] Policy deterministica de sorteio por seed publica.
- [x] Verificacao de resultado reproduzivel.
- [ ] Criar `territorial_maintainer_applications`.
- [ ] Criar `territorial_maintainer_draws`.
- [ ] Registrar:
  - lista elegivel;
  - hash da lista;
  - seed publica;
  - fonte da seed;
  - resultado;
  - suplentes;
  - janela de contestacao.
- [ ] Criar fluxo de inscricao para conselho territorial.
- [ ] Criar tela publica de sorteio e verificacao.
- [ ] Definir comportamento de:
  - zero inscritos;
  - inscrito unico;
  - conselho incompleto.

## Prioridade 8 - Matriz OP, Institucionalizacao, Execucao e Aprendizado

Esta e a parte que transforma votacao em orcamento executavel.

- [ ] Criar dominio `internal/op/matrix`.
- [ ] Criar entidade `op_matrix_items`.
- [ ] Consolidar vencedores territoriais sem repriorizar arbitrariamente.
- [ ] Separar porcao territorial e porcao estruturante.
- [ ] Criar dominio de institucionalizacao:
  - vinculo com Camara;
  - PPA;
  - LDO;
  - LOA;
  - emenda;
  - anexo;
  - ato oficial.
- [ ] Criar release do ciclo OP.
- [ ] Criar dominio `internal/op/execution`.
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
- [ ] Criar eventos de aprendizado:
  - atraso recorrente aumenta prioridade de fiscalizacao;
  - promessa frustrada vira memoria territorial;
  - carencia persistente altera peso no proximo ciclo;
  - demanda dormente pode retornar.

## Prioridade 9 - Contratos, Testes e CI

A virada para OP aumenta a responsabilidade do sistema. A regra precisa ser
testavel e compartilhada entre banco, backend e frontend.

- [ ] Centralizar vocabularios OP:
  - status do ciclo;
  - status da demanda;
  - status da proposta;
  - status da votacao;
  - fundamentos institucionais;
  - estados de execucao.
- [ ] Evitar strings duplicadas entre subpacotes de OP.
- [ ] Criar testes de service/repository para:
  - demanda;
  - proposta;
  - votacao;
  - filtro institucional;
  - incidentes.
- [ ] Criar testes de UI para gates de papel/fase.
- [ ] Criar CI com:
  - `go test ./...`;
  - `go vet ./...`;
  - `npm run lint`;
  - `npm run build`.
- [ ] Adotar ferramenta de migrations:
  - `goose` ou `golang-migrate`;
  - controle de versoes aplicadas;
  - rollback planejado para ambiente de teste.

## Prioridade 10 - Operacao, Privacidade e Piloto Institucional

Para dados reais, o produto precisa de rito juridico, operacao e garantias de
privacidade.

- [ ] Escrever minuta de lei ou resolucao instituindo o OP via Codigo Publico.
- [ ] Definir papel da Camara como Maintainer Geral.
- [ ] Definir papel do Maintainer Tecnico.
- [ ] Definir territorios iniciais do municipio.
- [ ] Definir calendario do primeiro ciclo.
- [ ] Definir envelope orcamentario inicial.
- [ ] Definir como a matriz OP entra no PPA, LDO e LOA.
- [ ] Definir como divergencias entre sistema e ato oficial serao tratadas.
- [ ] Planejar backup e restore testado.
- [ ] Criar monitoramento externo e alertas.
- [ ] Garantir que nunca vao para blockchain:
  - CPF;
  - nome completo;
  - endereco;
  - documento;
  - voto individual;
  - denuncia identificavel;
  - dados sensiveis.

## Sequencia Recomendada

1. Fechar bootstrap e painel de ciclo: criar, configurar, abrir e avancar ciclo com permissao clara.
2. Persistir sub-envelope territorial, filtros e retornos do circuit breaker.
3. Persistir inscricao e sorteio do conselho territorial.
4. Criar matriz OP, institucionalizacao, release do ciclo, execucao e aprendizado.
5. Preparar piloto institucional com Camara municipal.

## Frase Guia

O Codigo Publico transforma uma demanda simples de um territorio em decisao
orcamentaria rastreavel.

```text
O cidadao abre uma demanda simples.
O territorio amadurece.
O sistema filtra.
A comunidade vota.
Os representantes consolidam.
O Legislativo incorpora ou justifica publicamente a divergencia.
A execucao e fiscalizada.
O proximo ciclo aprende com o resultado.
```
