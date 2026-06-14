# Operação — Runbook de Produção

> Como o Código Público vive em produção: topologia, deploy, manutenção,
> backup e recuperação. Este é o documento que evita que o conhecimento
> operacional se perca. Leia antes de tocar no servidor.
>
> **Segurança:** este arquivo **não** contém segredos nem o IP de origem da VPS.
> O IP de origem fica atrás da Cloudflare de propósito (esconde a origem contra
> ataques que driblam a proteção de borda) — guarde-o **fora** do repositório,
> nas suas anotações privadas. Aqui ele aparece como `<IP_VPS>`.

---

## 1. Topologia

```
              Navegador do cidadão
                     │ HTTPS (cert da Cloudflare)
                     ▼
              Cloudflare (proxy ON, SSL mode "Full")
                     │ HTTPS (cert self-signed na origem)
                     ▼
   ┌──────────────────────────────────────────────────┐
   │  VPS Oracle  (Ubuntu 20.04, x86_64, ~952 MB RAM)  │
   │                                                    │
   │  nginx :80/:443  (default_server)                  │
   │    ├── /            → /var/www/codigo-publico (SPA)│
   │    └── /api/        → 127.0.0.1:8080               │
   │                                                    │
   │  codigo-publico.service  → API Go :8080            │
   │    ├── PostgreSQL 12 nativo  127.0.0.1:5432        │
   │    └── Redis nativo          127.0.0.1:6379        │
   └──────────────────────────────────────────────────┘
```

Domínio: **codigopublico.stellaris.net.br**.

Decisão-chave: por causa da RAM baixa (952 MB), **não** usamos Docker em
produção. Reaproveitamos o PostgreSQL 12 e instalamos Redis nativos, e a API Go
roda como binário compilado sob systemd. Docker Compose existe no repositório
apenas para desenvolvimento local.

---

## 2. Acesso ao servidor

```bash
ssh -i <caminho-da-chave> ubuntu@<IP_VPS>
```

- Usuário: `ubuntu` (imagem Ubuntu da Oracle). `sudo` sem senha.
- A chave privada está em `chave_oracle/ssh-key-2026-02-04.key` — **fora do
  versionamento** (`.gitignore`). No Windows/OpenSSH, a chave precisa de
  permissão restrita (`icacls <chave> /inheritance:r` + grant só ao seu usuário),
  senão o SSH recusa.

---

## 3. Componentes e onde vivem

| Componente | Caminho / unidade | Porta |
| --- | --- | --- |
| API Go (binário) | `/opt/codigo-publico/codigo-publico-api` | 8080 (local) |
| Serviço systemd | `codigo-publico.service` | — |
| Configuração (env) | `/etc/codigo-publico.env` (modo 600) | — |
| Front-end (estático) | `/var/www/codigo-publico/` (dono `www-data`) | — |
| nginx (site) | `/etc/nginx/sites-available/codigo-publico` (enabled) | 80/443 |
| Cert self-signed | `/etc/ssl/certs/codigopublico.crt` + `/etc/ssl/private/codigopublico.key` | — |
| PostgreSQL 12 | nativo; db e user `codigo_publico` | 5432 (local) |
| Redis | nativo; `redis-server.service` | 6379 (local) |
| Backups | `/home/ubuntu/backups/` | — |

A API liga em `:8080`, mas a porta **não está aberta** na Security List da Oracle
— só o nginx (local) a alcança. Externamente, apenas 22/80/443 respondem.

---

## 4. Segredos e configuração

Os segredos de produção vivem em **dois lugares**, nunca no repositório:

1. **No servidor:** `/etc/codigo-publico.env` (modo 600, dono `ubuntu`). Contém:
   `APP_ENV`, `PORT=8080`, `DATABASE_URL`, `REDIS_ADDR`, `JWT_SECRET`,
   `CPF_HASH_SECRET`, `ANCHOR_MODE=log`, `CORS_ALLOWED_ORIGINS`,
   `VOTING_CLOSE_INTERVAL` (default 60s).
2. **Na sua máquina:** `deploy/.secrets` (gitignored) — cópia de `DBPASS`,
   `JWT`, `CPF` gerados no provisionamento.

> ⚠️ Se você perder ambos, o `JWT_SECRET` e o `CPF_HASH_SECRET` não são
> recuperáveis: tokens existentes invalidam e o login por CPF deixa de casar com
> os hashes salvos. **Faça backup de `/etc/codigo-publico.env`.**

Para alterar uma variável e aplicar:

```bash
sudo nano /etc/codigo-publico.env
sudo systemctl restart codigo-publico
```

---

## 5. Deploy do backend (API Go)

O binário é **cross-compilado localmente** (no seu PC) e enviado pronto — assim
não é preciso instalar Go no servidor nem arriscar OOM compilando com 952 MB.

```powershell
# 1. Compilar para Linux (na pasta backend/)
$env:GOOS="linux"; $env:GOARCH="amd64"; $env:CGO_ENABLED="0"
go build -ldflags="-s -w" -o ..\deploy\codigo-publico-api ./cmd/api
$env:GOOS=""; $env:GOARCH=""; $env:CGO_ENABLED=""

# 2. Enviar
scp -i <chave> ..\deploy\codigo-publico-api ubuntu@<IP_VPS>:/tmp/

# 3. Trocar o binário (NO SERVIDOR) — pare o serviço antes!
```

```bash
# No servidor: cp sobre binário em execução dá "Text file busy".
sudo systemctl stop codigo-publico
sudo cp /tmp/codigo-publico-api /opt/codigo-publico/codigo-publico-api
sudo chmod +x /opt/codigo-publico/codigo-publico-api
sudo systemctl start codigo-publico
sleep 2 && systemctl is-active codigo-publico
curl -s http://127.0.0.1:8080/api/v1/health
```

> **Gotcha:** `cp` sobre o binário em execução falha com *Text file busy*. Sempre
> `systemctl stop` antes (ou use `mv`, que substitui o inode).

---

## 6. Deploy do frontend (SPA)

> **Gotcha crítico (já mordeu uma vez):** o build **precisa** usar a URL de API
> **relativa** `/api/v1`. Se faltar, o bundle assume `http://localhost:8080` e o
> navegador do usuário tenta conectar no *próprio* computador → erro "Não foi
> possível conectar à API". Isso já está blindado por `frontend/.env.production`
> (lido automaticamente pelo Vite), então **não precisa** setar variável manual.

```powershell
# Na pasta frontend/
npm run build           # .env.production garante VITE_API_URL=/api/v1

# Sanidade: o bundle NÃO pode referenciar localhost:8080
Select-String dist\assets\*.js -Pattern 'localhost:8080'   # deve vir vazio

# Enviar e publicar
scp -i <chave> -r dist\* ubuntu@<IP_VPS>:/tmp/dist-new/
```

```bash
# No servidor
sudo cp -r /tmp/dist-new/* /var/www/codigo-publico/
sudo chown -R www-data:www-data /var/www/codigo-publico
```

Os arquivos JS/CSS têm hash no nome (imutáveis), então não há problema de cache
de asset. O `index.html` é servido dinâmico pela Cloudflare (não cacheado).
Se mesmo assim o usuário vir versão antiga: **hard refresh** (`Ctrl+Shift+R`).

---

## 7. Migrations

Migrations ficam em `backend/migrations/NNN_*.sql`, numeradas. São aplicadas
**manualmente** (ainda não há ferramenta de tracking — ver pendências).

```bash
# Enviar a migration nova
scp -i <chave> backend\migrations\012_*.sql ubuntu@<IP_VPS>:/tmp/

# Rodar como o usuário dono do banco (a senha está em deploy/.secrets / .env)
PGPASSWORD="<DBPASS>" psql -h 127.0.0.1 -U codigo_publico -d codigo_publico \
  -v ON_ERROR_STOP=1 -f /tmp/012_*.sql
```

> ⚠️ As migrations **não são idempotentes** (usam `CREATE TABLE` sem
> `IF NOT EXISTS`). **Nunca re-rode** uma migration já aplicada — daria erro de
> objeto duplicado. Mantenha registro de qual foi a última aplicada (hoje:
> **011**).

> No PostgreSQL 12, `gen_random_uuid()` exige a extensão `pgcrypto` (já criada no
> banco). No PG13+ seria nativa.

---

## 8. Banco de dados

```bash
# Conectar
PGPASSWORD="<DBPASS>" psql -h 127.0.0.1 -U codigo_publico -d codigo_publico

# Listar tabelas
\dt

# Conexão de superusuário (para extensões, etc.)
sudo -u postgres psql -d codigo_publico
```

O banco e o usuário `codigo_publico` são isolados dos outros bancos que existiam
na VPS. A `DATABASE_URL` no `.env` aponta para `127.0.0.1:5432/codigo_publico`.

---

## 9. nginx, TLS e Cloudflare

O domínio passa pela **Cloudflare com proxy ligado** (nuvem laranja). O modo SSL
da Cloudflare é **"Full"** (não strict): ela exige criptografia até a origem mas
**não valida** o certificado — por isso a origem usa um **cert self-signed**.

```
Navegador ──HTTPS (cert Cloudflare, válido)──► Cloudflare ──HTTPS (cert self-signed)──► nginx
```

- O bloco nginx (`/etc/nginx/sites-available/codigo-publico`) é `default_server`
  em 80 e 443, serve o SPA e faz proxy de `/api/` para `127.0.0.1:8080`.
- Testar e recarregar config:
  ```bash
  sudo nginx -t && sudo systemctl reload nginx
  ```
- **Endurecer no futuro:** gerar um *Cloudflare Origin Certificate* no painel da
  Cloudflare e mudar o modo SSL para **"Full (strict)"**. Aí o cert self-signed
  é substituído pelo da Cloudflare e a validação fica completa.

---

## 10. Operações do dia a dia

```bash
# Status e saúde
systemctl status codigo-publico
curl -s http://127.0.0.1:8080/api/v1/health | jq

# Logs (ao vivo / últimas linhas)
sudo journalctl -u codigo-publico -f
sudo journalctl -u codigo-publico --since "10 min ago" --no-pager

# Reiniciar / parar / iniciar
sudo systemctl restart codigo-publico

# Conferir o job de encerramento de votações nos logs
sudo journalctl -u codigo-publico | grep -i voting
```

---

## 11. Backup e restauração

> ⚠️ **Pendência importante:** o banco `codigo_publico` **ainda não tem backup
> automático**. Configure isto (ver pendências). O backup abaixo é manual.

```bash
# Backup do banco (comprimido)
sudo -u postgres pg_dump codigo_publico | gzip > ~/backups/codigo_publico-$(date +%Y%m%d).sql.gz

# Backup do .env (segredos!) e da config nginx
sudo cp /etc/codigo-publico.env ~/backups/
sudo cp /etc/nginx/sites-available/codigo-publico ~/backups/

# Restaurar o banco (em um banco vazio)
gunzip -c ~/backups/codigo_publico-AAAAMMDD.sql.gz | \
  PGPASSWORD="<DBPASS>" psql -h 127.0.0.1 -U codigo_publico -d codigo_publico
```

Trazer um backup para a sua máquina:

```bash
scp -i <chave> ubuntu@<IP_VPS>:~/backups/codigo_publico-AAAAMMDD.sql.gz .
```

---

## 12. Promover um cidadão a administrador

O papel `admin` (acesso institucional) só se concede no banco. Como o CPF é
guardado apenas como hash HMAC, é preciso calcular o mesmo hash:

```bash
SECRET=$(sudo grep -E '^CPF_HASH_SECRET=' /etc/codigo-publico.env | cut -d= -f2-)
HASH=$(printf '%s' '<CPF_SO_DIGITOS>' | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $NF}')
sudo -u postgres psql -d codigo_publico \
  -c "UPDATE citizens SET role='admin' WHERE cpf_hash = '$HASH' RETURNING full_name, role"
```

O cidadão precisa **sair e entrar de novo** para o novo papel entrar no JWT.

Papéis institucionais reconhecidos: `admin`, `institutional_admin`,
`legislative_admin`, `procurador`, `secretario`, `vereador`, `mesa_diretora`,
`sysadmin`.

---

## 13. Troubleshooting

| Sintoma | Causa provável | Correção |
| --- | --- | --- |
| "Não foi possível conectar à API" no login | Bundle compilado sem `VITE_API_URL=/api/v1` | Rebuild (`.env.production` já corrige); redeploy; hard refresh |
| `/api/...` responde HTML "Cannot GET" (Express) | Requisição caiu em outro `server` do nginx | Conferir `default_server` e `server_name` do bloco codigo-publico |
| `cp` do binário falha: *Text file busy* | Binário em execução | `systemctl stop` antes do `cp` |
| 502 em `/api/` | API caída | `systemctl status codigo-publico`; ver `journalctl` |
| health mostra `postgres`/`redis` degraded | Serviço nativo parado | `systemctl start postgresql` / `redis-server` |
| Erro 526 na Cloudflare | Modo "Full (strict)" sem cert válido na origem | Voltar para "Full" ou instalar Origin Certificate |
| Migration falha "already exists" | Re-execução de migration já aplicada | Não re-rodar; conferir última aplicada |
| Usuário vê versão antiga do site | Cache do navegador | Hard refresh; assets têm hash, então some |

---

## 14. Segurança e pendências operacionais

- [ ] **Backup automático** do `codigo_publico` (cron `pg_dump` + retenção). Hoje
      só há backup manual — risco de perda irreversível.
- [ ] **Monitoramento/alerta** mínimo (a API cair sem ninguém saber é o risco mais
      provável). Um healthcheck externo (UptimeRobot/cron) já ajuda.
- [ ] **Rate limiting** no `/auth/login`, `/citizens/register` e voto (o Redis já
      está conectado, hoje só serve ao health). Mitiga força bruta de CPF.
- [ ] **Cloudflare Full (strict)** com Origin Certificate (§9).
- [ ] **Mover `chave_oracle/` para fora do repositório** (contém a chave SSH e
      senhas; já está gitignorada, mas o ideal é não estar na árvore do projeto).
- [ ] **Migrations versionadas** com ferramenta (golang-migrate/goose) em vez de
      aplicação manual.
- [ ] **Identidade forte (gov.br)** para robustez de Sybil (ver fundamentação).
- [ ] Manter o **IP de origem fora do versionamento** (proteção da Cloudflare).

---

## 15. Checklist de deploy completo (frontend + backend)

```
[ ] backend: go build/vet/test verdes localmente
[ ] frontend: npm run lint && npm run build (sem 'localhost:8080' no bundle)
[ ] cross-compilar binário Linux (GOOS=linux GOARCH=amd64 CGO_ENABLED=0)
[ ] se houver migration nova: enviar e aplicar (NÃO re-rodar antigas)
[ ] enviar binário; systemctl stop → cp → start
[ ] enviar dist; cp para /var/www/codigo-publico; chown www-data
[ ] verificar: curl health (postgres+redis ok)
[ ] verificar: https://codigopublico.stellaris.net.br responde 200
[ ] hard refresh e teste de login real
```

---

## Estado atual da VPS (snapshot)

- **No ar:** Código Público (front + API + PG + Redis + nginx + Cloudflare).
- **Desativado, com backup:** atendezap e edumetrics — serviços parados e bloco
  nginx removido; arquivos e bancos preservados em
  `/home/ubuntu/backups/predelete-*` (purga definitiva pendente de confirmação).
- **Última migration aplicada:** `011_maintainer_protocol.sql`.
