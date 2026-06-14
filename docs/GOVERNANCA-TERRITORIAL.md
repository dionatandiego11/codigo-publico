# Governança Territorial

## Cadeia de governança

```txt
SysAdmin Municipal
  ↓
Maintainer Geral
  ↓
Maintainer Territorial
  ↓
Cidadão Territorial
```

### SysAdmin Municipal

Indicado pela prefeitura (pode haver mais de um). Administração **técnica**:
gestão de usuários administrativos, configuração, segurança, backup,
manutenção e auditoria. **Não altera mérito político sem registro auditável**
— toda ação administrativa relevante gera `audit_event` encadeado.

### Maintainer Geral

Camada institucional geral, associável ao Legislativo municipal. É a
**instância recursal**: revisa conflitos territoriais, decide recursos e
contestações escaladas, valida a governança geral e executa decisões
sensíveis. Na metáfora: *o Legislativo é o maintainer da branch principal da
cidade*.

No sistema: registro em `territory_maintainers` com `scope = 'geral'`.

### Maintainer Territorial

Substitui a ideia de "presidente de bairro". Pode ser eleito, indicado por
associação local, indicado institucionalmente, nomeado provisoriamente ou
reconhecido pela comunidade (`appointed_by` registra a origem).

Pode:

```txt
aprovar vínculo ao bairro
recusar vínculo COM justificativa (a API rejeita recusa sem motivo)
validar problemas locais
organizar prioridades e encaminhar demandas
decidir contestações em primeira instância
```

**Não é dono do bairro.** Por desenho, não consegue:

```txt
recusar vínculo sem justificativa     → 400 na API
revogar vínculo sem processo          → revogação só via contestação decidida
decisão irrecorrível                  → recurso ao Maintainer Geral sempre cabe
alterar histórico                     → trilha de auditoria com hash encadeado
```

No sistema: `territory_maintainers` com `scope = 'territorial'`.

## Bairro sem maintainer

Regra forte:

> Se o território não tiver maintainer territorial ativo, ele **não aceita
> novos vínculos** — mas continua visível.

```txt
Leitura pública:            permitida
Novos vínculos:             bloqueados (409 na API)
Solicitação de maintainer:  permitida
```

Endpoint público: `GET /territories/{id}/governance` retorna
`hasActiveMaintainer` e `acceptsNewBonds`. O objetivo do bloqueio é
**incentivar a organização comunitária**.

## Instâncias e recursos

Nenhuma decisão territorial relevante é irrecorrível:

```txt
Cidadão solicita vínculo
  ↓ Maintainer Territorial aprova ou recusa (com justificativa)
  ↓ cidadão discorda → recurso ao Maintainer Geral
  ↓ decisão fundamentada (a API exige reason)
  ↓ registro em audit log com hash encadeado
  ↓ a cabeça da cadeia pode ser ancorada em blockchain
```

## Contestação comunitária

A população contesta vínculo suspeito (ex.: mora no Centro, cadastrou-se na
Lagoa Azul):

```txt
Vínculo aprovado
  ↓ cidadão do MESMO território (vínculo aprovado) contesta com justificativa
  ↓ o vínculo vai para "Contestado" — revisão aberta, sem suspensão automática
  ↓ a pessoa contestada pode apresentar defesa
  ↓ Maintainer Territorial decide: Mantido | Revogado | Escalada
  ↓ se Escalada → somente o Maintainer Geral decide
```

Regras de proteção implementadas: só contesta quem tem vínculo aprovado no
mesmo território (ABAC); ninguém contesta o próprio vínculo; uma contestação
aberta por vínculo; decisão exige justificativa.
