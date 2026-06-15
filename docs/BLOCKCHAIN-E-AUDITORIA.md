# Blockchain e Auditoria

## Princípio

Blockchain é cartório de integridade, não banco de dados pessoal.

No Código Público, a fonte oficial de dados é o PostgreSQL. A blockchain, o Diário Oficial ou outras âncoras externas servem para provar que determinado estado existia em determinado momento e não foi reescrito em silêncio.

## Regra forte

> Dado pessoal não vai para blockchain, nem criptografado.

Blockchain é permanente demais para CPF, endereço, documento, voto individual ou denúncia identificável.

## O que nunca vai para blockchain

```txt
CPF
nome completo
endereço
documento pessoal
comprovante de residência
voto individual
denúncia identificável
dado de saúde
dado escolar
dado sensível
conteúdo de contestação sigilosa
```

## O que pode ser ancorado

```txt
hash da cabeça da cadeia de auditoria
hash da lista elegível do sorteio
seed pública do sorteio
hash do resultado do sorteio
hash da matriz do OP
hash da release do ciclo
hash de ata pública
hash de atualização relevante de execução
```

## Auditoria interna

Cada evento relevante gera `audit_event`.

Modelo:

```txt
prev_hash  = hash do evento anterior
event_hash = SHA-256(prev_hash | ator | ação | entidade | metadata)
```

Alterar o passado quebra a cadeia.

Eventos relevantes:

- abertura de ciclo;
- vínculo territorial;
- inscrição para sorteio;
- sorteio;
- demanda;
- apoio;
- fork;
- filtro;
- votação;
- matriz do OP;
- institucionalização;
- release;
- execução;
- denúncia;
- recurso;
- contestação.

## Ancoragem externa

Âncoras possíveis:

- Diário Oficial;
- blockchain pública;
- publicação independente;
- log externo imutável.

A ancoragem deve publicar apenas hashes.

## Denúncia sigilosa

Modelo:

```txt
conteúdo sensível criptografado fora da blockchain
hash público de existência e integridade
acesso por rito formal
abertura de conteúdo sempre auditada
```

Assim o público pode verificar que algo existiu sem conhecer a pessoa ou o conteúdo.

## Sorteio auditável

Para o sorteio do Maintainer Territorial:

```txt
lista elegível privada
hash da lista publicado antes
seed pública definida por regra verificável
resultado reproduzível
ata pública com hash
janela de contestação
```

O público confere integridade sem ver CPF ou documentos dos inscritos.

## Release do ciclo

A release do OP deve ter hash próprio.

Pode ser ancorado:

- versão consolidada da matriz;
- itens institucionalizados;
- prazos;
- status de execução;
- divergências institucionais.

## Implementação atual

O backend já possui base de auditoria em `backend/internal/audit` e contrato de ancoragem em `backend/internal/blockchain`.

A evolução necessária é conectar esses mecanismos aos novos eventos do OP:

- ciclo;
- demanda;
- proposta;
- sorteio;
- matriz;
- release;
- execução.
