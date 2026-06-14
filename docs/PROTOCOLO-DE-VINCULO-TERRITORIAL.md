# Protocolo de Vínculo Territorial

## Regra-síntese

```txt
Uma pessoa
Uma cidade
Um território-base
Um nível de confiança
```

No banco: índice único parcial garante **um vínculo vivo por cidadão**
(`Pendente`, `Aprovado` ou `Contestado`).

## Tipos de vínculo

| Tipo          | Quem é                                   | Teto de confiança |
| ------------- | ---------------------------------------- | ----------------- |
| `morador`     | reside no território                     | T4                |
| `trabalhador` | trabalha na cidade, mora fora            | T2                |
| `estudante`   | estuda na cidade, mora fora              | T2                |

Quem trabalha ou estuda participa, mas com menos poder deliberativo que um
morador validado.

## Níveis de confiança

```txt
T0 — Visitante            apenas visualiza informações públicas
T1 — Autodeclarado        declarou vínculo (estado inicial de todo pedido)
T2 — Vínculo evidenciado  apresentou alguma prova (evidence_note)
T3 — Validado             aprovado pelo maintainer territorial (default morador)
T4 — Qualificado          apto a processos mais sensíveis
```

A API valida o teto por tipo: aprovar `trabalhador` com `T3` retorna 400.

## Ciclo de vida do vínculo (state machine)

```txt
            solicitação (exige maintainer ativo no território)
                 │
              Pendente
               /     \
        aprovar       recusar (justificativa obrigatória)
             │            │
         Aprovado      Recusado ──recurso──► Maintainer Geral
             │                                  │ deferido → Aprovado
        contestação                             │ indeferido → Recusado
             │
         Contestado ──decisão──► Mantido (volta a Aprovado)
                                 Revogado (vínculo Revogado)
                                 Escalada (decide o Maintainer Geral)
```

## Endpoints

```txt
POST /api/v1/territories/{id}/bonds          solicitar vínculo {bondType, evidenceNote}
GET  /api/v1/me/bond                         meu vínculo ativo
GET  /api/v1/territories/{id}/bonds          fila do maintainer (?status=Pendente)
POST /api/v1/bonds/{id}/decision             {approve, trustLevel?, reason}
POST /api/v1/bonds/{id}/appeal               {reason}
POST /api/v1/appeals/{id}/decision           {uphold, reason} — Maintainer Geral
POST /api/v1/bonds/{id}/contest              {reason, hasNewFact?} — vínculo aprovado no mesmo território
POST /api/v1/contestations/{id}/defense      {defense} — dono do vínculo
POST /api/v1/contestations/{id}/decision     {outcome: Mantido|Revogado|Escalada, reason}
GET  /api/v1/territories/{id}/governance     público: aceita vínculos? tem maintainer?
```

## Período de descanso contra recontestação

> Vínculo confirmado após contestação ("Mantido") não pode ser recontestado
> por **180 dias**, salvo apresentação de **fato novo** (`hasNewFact: true`).

Reduz perseguição local por recontestação repetida. A regra é uma função pura
testável (`policy.go`, `CanReopenContestation`); a janela é a constante
`RecontestationCooldown`. A invocação de fato novo fica registrada na
auditoria (`bond.contested` com `newFact: true`) para coibir abuso.

## Camada de decisão pura e testes

As regras institucionais vivem em `backend/internal/territorial/policy.go` —
funções puras, sem banco: autoridade de decisão, tetos de confiança,
elegibilidade de contestação, período de descanso e desfechos por instância.
O `Service` resolve os fatos no repositório e delega a decisão à policy.

Os testes constitucionais (`policy_test.go`) cobrem esses cenários sem exigir
PostgreSQL e rodam com `go test ./...`.

## Auditoria

Cada passo gera evento encadeado na trilha:

```txt
bond.requested · bond.approved · bond.rejected · bond.appealed
bond.appeal_decided · bond.appeal_granted · bond.contested
bond.defense_submitted · bond.contestation_decided
```
