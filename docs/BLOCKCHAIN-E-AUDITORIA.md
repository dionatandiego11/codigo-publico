# Blockchain e Auditoria

## Princípio

> Blockchain funciona como **cartório cívico de provas**, não como banco de
> dados pessoal.

A blockchain não verifica endereço sozinha. Ela registra a **prova de que uma
validação aconteceu**. O PostgreSQL é o banco oficial; a blockchain apenas
ancora hashes que permitem auditar a integridade do histórico.

## O que NUNCA vai on-chain

```txt
CPF
nome completo
endereço
documento pessoal
comprovante de residência
voto identificável
dados de saúde ou escola
```

## O que pode ir on-chain

```txt
hash da credencial territorial
município e território
nível de confiança
tipo de vínculo
datas de emissão/expiração
hash da cabeça da cadeia de auditoria
```

```txt
Dados pessoais ficam off-chain.
Hash da credencial territorial vai on-chain.
```

## Camada 1 — Trilha de auditoria com hash encadeado

Implementada em `backend/internal/audit` (migration 010). Cada `audit_event`
carrega:

```txt
prev_hash  = event_hash do evento anterior
event_hash = SHA-256(prev_hash | ator | ação | entidade | metadata)
```

Os appends são serializados por advisory lock do PostgreSQL. Qualquer
alteração retroativa em um evento quebra todos os hashes seguintes — a cadeia
é verificável por qualquer pessoa com acesso de leitura.

Endpoints públicos:

```txt
GET /api/v1/audit/head      → hash da cabeça da cadeia + total de eventos
GET /api/v1/audit/anchors   → âncoras registradas
```

## Camada 2 — Ancoragem externa

Implementada em `backend/internal/blockchain` via a interface `Anchorer`:

```go
type Anchorer interface {
    Name() string
    Anchor(ctx context.Context, payloadHash string) (txRef string, err error)
}
```

`POST /api/v1/admin/audit/anchor` (papel administrativo) fotografa a cabeça
da cadeia em `audit_anchors` e chama o `Anchorer` configurado
(`ANCHOR_MODE`):

```txt
noop  → não ancora (desenvolvimento)
log   → registra no log estruturado (prova fraca de existência)
<futuro> → contrato em rede pública ou permissionada
```

Trocar a implementação não exige mudança em nenhum outro módulo.

## Por que esse desenho

1. **LGPD por construção**: dado pessoal nunca sai do banco off-chain.
2. **Auditabilidade sem custo de chain**: a cadeia de hashes já garante
   integridade interna; a blockchain só adiciona a prova de que ninguém —
   nem o sysadmin — reescreveu o histórico depois da âncora.
3. **Reversibilidade**: se a ancoragem externa falhar ou for descontinuada,
   o sistema continua íntegro e auditável.
