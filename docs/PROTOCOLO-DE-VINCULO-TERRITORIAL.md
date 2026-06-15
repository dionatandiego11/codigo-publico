# Protocolo de Vínculo Territorial

O vínculo territorial define quem participa plenamente do Orçamento Participativo em cada território.

## Regra-síntese

```txt
Uma pessoa
Um município
Um território-base principal
Um vínculo auditável
```

## Por que vínculo territorial

O OP depende de território. A votação territorial, o sorteio do Maintainer Territorial e a fiscalização de execução precisam saber qual comunidade cada cidadão integra.

O vínculo não é apenas autodeclarado nem imposto: ele deve ser validado, contestável, recorrível e auditável.

## Tipos de vínculo

| Tipo | Quem é | Uso no OP |
|---|---|---|
| Morador | reside no território | participação territorial plena |
| Trabalhador | trabalha no município ou território | participação limitada conforme regra local |
| Estudante | estuda no município ou território | participação limitada conforme regra local |

O desenho-alvo do OP prioriza o morador territorial para votação plena e sorteio de Maintainer Territorial.

## Níveis

Os níveis técnicos podem continuar existindo internamente, mas a UI deve escondê-los.

```txt
T0 — visitante
T1 — autodeclarado
T2 — evidenciado
T3 — validado
T4 — qualificado
```

Para o cidadão, a linguagem deve ser:

```txt
Seu vínculo foi solicitado.
Seu vínculo está em análise.
Você está validado no território.
Seu vínculo precisa de mais informação.
Seu vínculo foi contestado.
Você pode recorrer.
```

## Ciclo de vida

```txt
solicitação
  ↓
pendente
  ↓ aprovar
aprovado
  ↓ contestar
contestado
  ↓ decisão
mantido / revogado / escalado
```

Recusa ou revogação exige justificativa.

## Quem decide

Primeira instância:

- Maintainer Territorial, quando ativo;
- Maintainer Geral em zeladoria limitada quando não houver Maintainer Territorial.

Recurso:

- Maintainer Geral.

## Território sem maintainer

A ausência de Maintainer Territorial não deve bloquear a existência política do território.

Permitido:

- cadastro;
- solicitação de vínculo;
- demanda simples;
- apoio;
- comentários;
- acompanhamento;
- inscrição para novo sorteio.

**[DECIDIR]** Se o vínculo pode chegar a validação plena sem Maintainer Territorial ou se depende de zeladoria formal do Maintainer Geral.

## Contestação

Cidadãos do mesmo território podem contestar vínculo suspeito.

Regras mínimas:

- contestação exige justificativa;
- a pessoa contestada pode se defender;
- decisão exige fundamento;
- cabe recurso;
- tudo gera audit log.

## Período de descanso

Vínculo mantido após contestação não deve ser recontestado por 180 dias, salvo fato novo.

Objetivo: impedir perseguição local por recontestação repetida.

**[DECIDIR]** Se 180 dias é regra comum ou parâmetro local com limite mínimo.

## Denúncia sigilosa

Quando a contestação envolver risco de retaliação, deve existir opção sigilosa.

Modelo:

- conteúdo criptografado fora da blockchain;
- hash público de existência;
- acesso apenas por rito formal;
- abertura de conteúdo sensível auditada.

## Endpoints-alvo

```txt
POST /api/v1/territories/{id}/bonds
GET  /api/v1/me/bond
GET  /api/v1/territories/{id}/bonds
POST /api/v1/bonds/{id}/decision
POST /api/v1/bonds/{id}/appeal
POST /api/v1/appeals/{id}/decision
POST /api/v1/bonds/{id}/contest
POST /api/v1/contestations/{id}/defense
POST /api/v1/contestations/{id}/decision
GET  /api/v1/territories/{id}/governance
```

## Eventos de auditoria

```txt
bond.requested
bond.approved
bond.rejected
bond.appealed
bond.appeal_decided
bond.contested
bond.defense_submitted
bond.contestation_decided
bond.revoked
```
