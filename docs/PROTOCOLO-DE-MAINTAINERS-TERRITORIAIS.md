# Protocolo de Maintainers Territoriais

> **Implementado** em `backend/internal/territorial` (política pura + testes,
> migration 011). Defaults marcados como **[provisório]** são decisões em
> aberto (ver `sugestao_de_governanca.md`) encodadas em constantes fáceis de
> mudar.

Regra-síntese:

> Um maintainer territorial não pode ser vitalício, invisível nem removido
> informalmente.

## Quem controla a porta do bairro

O maintainer territorial decide vínculos e contestações em primeira instância
— logo, escolher e destituir esse papel precisa ser tão auditável quanto o
vínculo do cidadão. Toda transição gera evento na trilha de auditoria com hash
encadeado.

## Status do maintainer (máquina de estados)

```txt
Provisório   → mandato curto, em caráter temporário
Ativo        → mandato pleno e vigente
Em revisão   → moção popular aberta (mantém poderes até a decisão)
Suspenso     → sem poderes, aguardando decisão
Destituído   → removido por processo concluído
Expirado     → mandato encerrado sem renovação
```

São **efetivos** (têm poderes e contam como "território com maintainer"):
`Provisório`, `Ativo`, `Em revisão` — e somente enquanto `term_end` não vence.
Um maintainer com mandato vencido perde os poderes automaticamente, sem job
(as queries filtram por `term_end > NOW()`).

No máximo **um maintainer territorial efetivo por território** (índice único
parcial no banco).

## Nomeação

Origem da indicação (`appointmentSource`) determina o status inicial:

| Origem | Status inicial | Quem pode |
| --- | --- | --- |
| `eleicao_territorial` | Ativo | instância geral |
| `indicacao_legislativa` | Ativo | instância geral |
| `nomeacao_executiva` | **Provisório** | instância geral |
| `designacao_emergencial` | **Provisório** | instância geral |

> Nomeação pelo executivo/emergencial **nunca** nasce com mandato pleno —
> evita captura por nomeação direta. Para virar `Ativo`, precisa de ratificação
> (eleição ou instância legislativa) via `activate`.

Nomear maintainer **geral** (instância recursal) exige `sysadmin`. Nomear
**territorial** exige a instância geral (sysadmin ou maintainer geral). No
bootstrap, o `sysadmin` (admin) nomeia os primeiros.

## Mandato

```txt
Provisório: 90 dias    [provisório]
Pleno:      365 dias   [provisório]
```

Renovação exige justificativa pública (auditada) e estende o `term_end`.

## Destituição — duas vias

### 1. Por justa causa (instância recursal)

O Maintainer Geral (ou sysadmin no bootstrap) destitui com justificativa
obrigatória. O executivo isolado **não** destitui por mérito político.

### 2. Moção popular (recall)

```txt
Cidadão T3+ do território abre a moção (com justificativa)
  ↓ maintainer entra em "Em revisão" (mantém poderes)
Outros cidadãos T3+ do território assinam
  ↓ ao atingir o quórum → maintainer "Destituído" automaticamente
```

- **Quórum:** 50% + 1 dos vínculos **T3+** ativos do território, capturado na
  abertura da moção. [provisório]
- Só **cidadão T3+ com vínculo aprovado no território** abre e assina.
- Uma moção aberta por maintainer de cada vez; uma assinatura por cidadão.

## Endpoints (autenticados)

```txt
POST /api/v1/territories/{id}/maintainers   nomear {citizenId, scope?, appointmentSource, mandateNote?}
GET  /api/v1/territories/{id}/maintainers    listar
POST /api/v1/maintainers/{id}/activate       ratificar Provisório → Ativo (instância geral)
POST /api/v1/maintainers/{id}/renew          renovar mandato {reason} (instância geral)
POST /api/v1/maintainers/{id}/remove         destituir por justa causa {reason} (instância geral)
POST /api/v1/maintainers/{id}/recall         abrir moção popular {reason} (cidadão T3+)
POST /api/v1/recalls/{id}/sign               assinar moção (cidadão T3+; destitui ao quórum)
```

## Eventos de auditoria

```txt
maintainer.appointed · maintainer.activated · maintainer.mandate_renewed
maintainer.removed · maintainer.recall_opened · maintainer.recall_signed
maintainer.recalled
```

## Camada pura e testes

As regras vivem em `maintainer_policy.go` (funções puras: status efetivo,
origem→status, mandato, autoridade de nomeação/ativação/remoção, quórum de
recall). O `Service` resolve os fatos no banco e delega a decisão. Os testes
constitucionais (`maintainer_policy_test.go`) cobrem esses cenários com
`go test ./...`, sem PostgreSQL.

## Decisões ainda em aberto

Mandato (90/365), quórum (50%+1), e os casos especiais de intervenção do
executivo continuam `[DECIDIR]` no `sugestao_de_governanca.md` — aqui estão
como defaults provisórios em constantes.
