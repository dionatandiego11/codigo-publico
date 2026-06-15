# Governança Territorial

Este documento define a governança territorial do Código Público como infraestrutura de Orçamento Participativo.

## Cadeia de governança

```txt
Maintainer Geral       = Legislativo municipal
Maintainer Técnico     = operador de infraestrutura
Maintainer Territorial = representante sorteado do território
Cidadão Territorial    = participante com vínculo validado
```

## Princípio central

```txt
1 território = 1 representação
```

Cada bairro, comunidade ou distrito reconhecido deve ter direito a um representante territorial. A regra não é proporcional por população; ela existe para garantir que nenhum território desapareça dentro da média municipal.

## Maintainer Geral

O Maintainer Geral corresponde ao Legislativo municipal no rito do OP.

Pode ser a Câmara, uma comissão, mesa, gabinete ou estrutura formal definida por ato municipal.

Responsabilidades:

- abrir o ciclo do OP;
- definir calendário, territórios e envelope disponível;
- indicar ou validar o Maintainer Técnico;
- abrir inscrição para Maintainer Territorial;
- receber a matriz do OP;
- filtrar impedimentos institucionais com justificativa;
- conduzir a institucionalização na Câmara;
- conectar o resultado ao PPA, LDO e LOA;
- decidir recursos e contestações escaladas;
- abrir revisão de Maintainer Territorial por processo.

Limites:

- não pode apagar histórico;
- não pode recusar sem fundamento;
- não pode alterar matriz invisivelmente;
- não pode expor voto individual;
- não pode expor denúncia sigilosa;
- não pode transformar filtro institucional em veto político silencioso.

## Maintainer Técnico

O Maintainer Técnico opera infraestrutura.

Pode ser indicado pelo Legislativo e pode vir da TI municipal, inclusive do Executivo, desde que sua função seja técnica.

Responsabilidades:

- deploy;
- banco;
- Redis;
- backup;
- logs;
- segurança;
- auditoria;
- configuração de parâmetros aprovados.

Limites:

- não decide mérito político;
- não filtra demandas;
- não altera regra local sem autorização;
- não acessa dado sensível sem rito formal.

## Maintainer Territorial

O Maintainer Territorial é o representante temporário de um território no ciclo do OP.

Regra:

> É escolhido por inscrição e sorteio auditável entre cidadãos vinculados ao território.

Responsabilidades:

- organizar demandas do território;
- agrupar duplicidades;
- orientar forks;
- pedir complementos;
- validar pertinência territorial;
- conduzir maturação;
- encaminhar propostas aptas;
- justificar filtros aplicados.

Limites:

- não é dono do território;
- não decide sozinho o mérito político;
- não pode rejeitar por opinião pessoal;
- não pode apagar histórico;
- não pode impedir contestação;
- não pode favorecer demanda própria sem registro de conflito.

## Território sem maintainer

Território sem Maintainer Territorial ativo não fica mudo.

Deve ser permitido:

- leitura pública;
- cadastro;
- vínculo territorial;
- demanda simples;
- apoio ou não apoio;
- comentários e complementos;
- acompanhamento de execução;
- inscrição para novo sorteio.

O primeiro filtro territorial pode ficar sob zeladoria limitada do Maintainer Geral até novo sorteio.

**[DECIDIR]** Se a votação territorial pode ocorrer sem Maintainer Territorial ativo ou se exige zeladoria formal.

## Recursos e contestações

Nenhuma decisão territorial relevante deve ser irrecorrível.

```txt
Cidadão abre demanda ou vínculo
  ↓
Maintainer Territorial organiza ou filtra com justificativa
  ↓
Cidadão discorda
  ↓
Recurso ao Maintainer Geral
  ↓
Decisão fundamentada
  ↓
Audit log
```

## Denúncia sigilosa

Denúncias sobre abuso, pressão local, fraude, compra de apoio ou manipulação de demanda podem ser sigilosas.

Modelo:

- conteúdo criptografado fora da blockchain;
- hash público de existência;
- acesso apenas por rito formal;
- toda abertura de dado sensível gera auditoria.

## Regra de ouro

> O território organiza a demanda, o sistema preserva o rito, o Legislativo institucionaliza, e a execução fica fiscalizável.
