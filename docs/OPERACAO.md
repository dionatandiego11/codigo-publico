# Operação — Runbook

Este documento define cuidados operacionais para rodar o Código Público.

Como o sistema passa a lidar com Orçamento Participativo, vínculo territorial, voto, denúncia e execução pública, operação não é detalhe técnico: é parte da confiança institucional.

## 1. Ambientes

```txt
local        desenvolvimento com Docker Compose
staging      ensaio de migrations e fluxo OP
produção     dados reais, backup, monitoramento e controle de acesso
```

Produção só deve receber dados reais quando houver:

- backup automático;
- teste de restauração;
- monitoramento externo;
- logs persistentes;
- proteção de segredos;
- política de acesso administrativo;
- plano para incidentes.

## 2. Componentes

```txt
Front-end: React/Vite
API:       Go/Chi
Banco:     PostgreSQL
Cache:     Redis
Proxy:     Nginx ou equivalente
Auditoria: audit_events + hash chain
Âncoras:   Diário Oficial, blockchain ou log externo
```

## 3. Configuração

Segredos nunca entram no repositório.

Variáveis críticas:

```txt
DATABASE_URL
REDIS_ADDR
JWT_SECRET
CPF_HASH_SECRET
CORS_ALLOWED_ORIGINS
ANCHOR_MODE
```

No front:

```txt
VITE_API_URL=/api/v1
```

Em produção, preferir API relativa (`/api/v1`) para evitar bundle apontando para `localhost`.

## 4. Deploy local

```bash
cd backend
docker compose up -d
cp .env.example .env
go run ./cmd/api
```

Na raiz:

```bash
npm install
npm run dev
```

## 5. Deploy de produção

Fluxo recomendado:

```txt
1. build do front
2. build do backend
3. backup antes da migration
4. aplicar migration
5. subir binário/API
6. publicar front
7. health check
8. teste de login/leitura
9. registrar versão/release operacional
```

Nunca aplicar migration em produção sem backup recente.

## 6. Migrations

Migrations devem ser versionadas e rastreadas por ferramenta como:

- `goose`;
- `golang-migrate`.

Enquanto forem manuais:

- registrar última migration aplicada;
- nunca reexecutar migration já aplicada;
- testar antes em staging;
- manter backup antes de qualquer alteração estrutural.

## 7. Backup

Backup mínimo:

- dump diário do PostgreSQL;
- retenção de pelo menos 7 dias;
- cópia fora da máquina principal;
- backup dos arquivos `.env` de produção em local seguro;
- teste periódico de restore.

Regra:

> Backup sem teste de restauração é esperança, não operação.

## 8. Monitoramento

Monitorar:

- `GET /api/v1/health`;
- uso de disco;
- uso de RAM;
- PostgreSQL;
- Redis;
- erros 5xx;
- falhas de login;
- falhas de migration;
- fila ou falha de auditoria.

Alertas mínimos:

- API fora;
- banco fora;
- disco acima de limite;
- backup não gerado;
- erro repetido de auditoria.

## 9. Logs

Logs devem permitir responder:

- quem abriu ciclo;
- quem aplicou filtro;
- quem institucionalizou item;
- quem atualizou execução;
- quando uma denúncia sigilosa foi acessada;
- quando uma âncora foi publicada.

Logs não devem expor:

- CPF;
- voto individual;
- conteúdo sigiloso;
- documentos;
- endereço completo;
- dados sensíveis.

## 10. Auditoria operacional

Eventos de OP que exigem atenção:

```txt
op.cycle.opened
maintainer.draw.completed
op.filter.applied
op.matrix.published
op.institutionalized
op.release.created
op.execution.updated
audit.anchor.created
secret_content.opened
```

## 11. Incidentes

Incidentes relevantes:

- divergência entre sistema e ato oficial;
- falha de auditoria;
- falha de ancoragem;
- vazamento de dado;
- voto duplicado;
- perda de backup;
- indisponibilidade durante votação;
- acesso indevido a denúncia sigilosa.

Todo incidente deve ter:

- horário;
- impacto;
- causa provável;
- ação imediata;
- correção;
- prevenção;
- registro público quando afetar o rito.

## 12. Privacidade

Regra forte:

> Dado pessoal nunca vai para blockchain.

Dados sensíveis devem ficar:

- fora da blockchain;
- criptografados quando aplicável;
- com acesso auditado;
- com mínimo necessário para operação.

## 13. Produção piloto

Antes de piloto com município real:

- definir operador técnico;
- definir Maintainer Geral;
- cadastrar territórios;
- testar vínculo territorial;
- testar sorteio;
- testar demanda simples;
- testar votação territorial;
- testar matriz;
- testar exportação/release;
- testar execução;
- testar backup e restore.

## 14. Checklist de saúde

```bash
curl -s http://localhost:8080/api/v1/health
```

Validar:

- API ok;
- PostgreSQL ok;
- Redis ok;
- front carrega;
- CORS correto;
- login funciona;
- leitura pública funciona;
- audit log escreve.

## 15. Regra operacional

> Em produção, uma falha técnica pode virar falha democrática. Operação precisa ser tratada como parte do protocolo.
