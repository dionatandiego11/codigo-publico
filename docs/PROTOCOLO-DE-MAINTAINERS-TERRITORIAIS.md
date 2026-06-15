# Protocolo de Maintainers Territoriais

Este documento define o papel do Maintainer Territorial no modo Orçamento Participativo.

> Status: protocolo-alvo. O backend atual ainda contém partes do modelo anterior de nomeação/ativação; a direção conceitual passa a ser inscrição + sorteio auditável.

## Regra-síntese

> Um Maintainer Territorial não pode ser vitalício, invisível, proprietário do território nem removido informalmente.

## Quem é

O Maintainer Territorial é o representante temporário de um território no ciclo do OP.

```txt
1 território = 1 Maintainer Territorial
```

Ele organiza a esteira territorial, mas não decide sozinho o mérito político da comunidade.

## Escolha

Fluxo-alvo:

```txt
1. Maintainer Geral abre período de inscrição
2. cidadãos com vínculo territorial validado se inscrevem
3. sistema publica hash da lista elegível
4. sistema usa seed pública auditável
5. sorteia titular e suplentes
6. abre janela de contestação
7. confirma o Maintainer Territorial
8. registra tudo em audit log
```

## Universo elegível

Pode se inscrever quem:

- é cidadão cadastrado;
- tem vínculo territorial validado;
- pertence ao território;
- não tem impedimento registrado;
- aceita as responsabilidades do ciclo.

## Se houver apenas uma pessoa inscrita

Não há posse plena automática sem rito.

Regra sugerida:

- aclamação condicionada;
- publicação do nome;
- janela de contestação;
- checagem de impedimentos;
- mandato provisório ou reduzido, se o município assim parametrizar;
- novo convite ativo no ciclo seguinte.

## Se não houver inscritos

O território não fica mudo.

Regra sugerida:

- cidadãos continuam podendo abrir demandas, apoiar e acompanhar;
- Maintainer Geral faz zeladoria limitada;
- novo convite ativo é aberto;
- a ausência de representante aparece como risco público de governança.

## Status

```txt
Inscrição aberta
Elegível
Sorteado
Em contestação
Ativo
Em revisão
Suspenso
Destituído
Expirado
```

## Mandato

O mandato deve ser sempre temporário.

Parâmetros locais:

- duração do mandato;
- possibilidade de mandato provisório;
- limite de mandatos consecutivos;
- prazo de quarentena antes de novo sorteio;
- regra de substituição por suplente.

Limites comuns:

- mandato vitalício proibido;
- renovação invisível proibida;
- ausência de audit log proibida.

## Responsabilidades

- organizar demandas do território;
- agrupar demandas parecidas;
- orientar forks;
- pedir complementação;
- validar pertinência territorial;
- conduzir maturação;
- aplicar primeiro filtro;
- encaminhar propostas aptas para votação;
- justificar bloqueios e devoluções.

## Limites

- não apaga demanda;
- não recusa sem fundamento;
- não impede recurso;
- não altera histórico;
- não decide mérito sozinho;
- não pode usar o papel para favorecer demanda própria.

## Recall e destituição

O território deve poder destituir o Maintainer Territorial por moção popular.

Parâmetros locais:

- quórum;
- prazo de votação;
- requisitos de justificativa;
- rito de defesa;
- substituição por suplente ou novo sorteio.

Limites comuns:

- recall impossível é proibido;
- destituição secreta é proibida;
- destituição sem processo é proibida;
- toda decisão gera audit log.

## Eventos de auditoria

```txt
maintainer.application_opened
maintainer.application_submitted
maintainer.eligibility_list_committed
maintainer.draw_seed_published
maintainer.drawn
maintainer.contestation_opened
maintainer.confirmed
maintainer.review_opened
maintainer.suspended
maintainer.removed
maintainer.expired
maintainer.recall_opened
maintainer.recall_signed
maintainer.recalled
```

## Endpoints-alvo

```txt
POST /api/v1/territories/{id}/maintainer-applications/open
POST /api/v1/territories/{id}/maintainer-applications
GET  /api/v1/territories/{id}/maintainer-applications
POST /api/v1/territories/{id}/maintainer-draws
GET  /api/v1/territories/{id}/maintainer-draws/current
POST /api/v1/maintainer-draws/{id}/contestations
POST /api/v1/maintainers/{id}/recall
POST /api/v1/recalls/{id}/sign
```

## Decisões pendentes

- duração do mandato;
- limite de mandatos consecutivos;
- quórum de recall;
- regra de suplência;
- prazo de contestação do sorteio;
- ajuda de custo obrigatória ou recomendada;
- rito para território sem inscritos.
