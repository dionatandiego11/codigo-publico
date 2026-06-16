# Runbook — procedimentos concretos de produção

> O **como** da operação: os comandos e caminhos reais para implantar, reiniciar,
> diagnosticar e recuperar a instância em produção. Companheiro de
> [OPERACAO.md](OPERACAO.md) (que define a **política** de operação) — aqui ficam
> os procedimentos.
>
> **Segurança:** este arquivo **não** contém segredos nem o IP de origem da VPS.
> O IP fica atrás da Cloudflare de propósito (esconde a origem); guarde-o **fora**
> do repositório, nas suas anotações privadas. Aqui é `<IP_VPS>`.

---

## Topologia (resumo)

```
Navegador → Cloudflare (proxy ON, SSL "Full") → nginx :80/:443 → API Go :8080
                                                  ├─ /        → /var/www/codigo-publico (SPA)
                                                  └─ /api/    → 127.0.0.1:8080
API Go → PostgreSQL 12 nativo (127.0.0.1:5432) + Redis nativo (127.0.0.1:6379)
```

Domínio: **codigopublico.stellaris.net.br**. VPS Oracle, Ubuntu 20.04, x86_64,
~952 MB RAM. **Sem Docker em produção** (RAM baixa): PG12 e Redis nativos, API Go
como binário sob systemd.

---

## Acesso

```bash
ssh -i <chave> ubuntu@<IP_VPS>
```

- Usuário `ubuntu`, `sudo` sem senha.
- Chave em `chave_oracle/ssh-key-2026-02-04.key` (**fora do versionamento**).
- No Windows/OpenSSH, ajuste a permissão da chave senão o SSH recusa:
  `icacls <chave> /inheritance:r` + grant só ao seu usuário.

---

## Onde vive cada coisa

| Componente | Caminho / unidade | Porta |
| --- | --- | --- |
| Binário da API | `/opt/codigo-publico/codigo-publico-api` | 8080 (local) |
| Serviço systemd | `codigo-publico.service` | — |
| Configuração (env) | `/etc/codigo-publico.env` (modo 600) | — |
| Front-end estático | `/var/www/codigo-publico/` (dono `www-data`) | — |
| nginx (site) | `/etc/nginx/sites-available/codigo-publico` (enabled, `default_server`) | 80/443 |
| Cert self-signed | `/etc/ssl/certs/codigopublico.crt` + `/etc/ssl/private/codigopublico.key` | — |
| PostgreSQL 12 | nativo; db e user `codigo_publico` | 5432 (local) |
| Redis | nativo; `redis-server.service` | 6379 (local) |
| Backups | `/home/ubuntu/backups/` | — |

A API liga em `:8080`, mas a porta **não está aberta** na Security List da Oracle
— só o nginx (local) a alcança. Externamente, apenas 22/80/443 respondem.

---

## Deploy do backend

Cross-compilado **localmente** (não instalar Go no servidor — evita OOM):

```powershell
# Na pasta backend/
$env:GOOS="linux"; $env:GOARCH="amd64"; $env:CGO_ENABLED="0"
go build -ldflags="-s -w" -o ..\deploy\codigo-publico-api ./cmd/api
$env:GOOS=""; $env:GOARCH=""; $env:CGO_ENABLED=""

scp -i <chave> ..\deploy\codigo-publico-api ubuntu@<IP_VPS>:/tmp/
```

No servidor — **pare o serviço antes do `cp`** (senão dá *Text file busy*):

```bash
sudo systemctl stop codigo-publico
sudo cp /tmp/codigo-publico-api /opt/codigo-publico/codigo-publico-api
sudo chmod +x /opt/codigo-publico/codigo-publico-api
sudo systemctl start codigo-publico
sleep 2 && systemctl is-active codigo-publico
curl -s http://127.0.0.1:8080/api/v1/health
```

---

## Deploy do frontend

> **Gotcha que já mordeu:** o build precisa da URL de API **relativa** `/api/v1`.
> Sem isso, o bundle aponta para `http://localhost:8080` e o navegador do usuário
> tenta conectar no próprio computador → "Não foi possível conectar à API". Já
> está blindado por `frontend/.env.production` (lido pelo Vite) — não precisa de
> variável manual.

```powershell
# Na pasta frontend/
npm run build
Select-String dist\assets\*.js -Pattern 'localhost:8080'   # deve vir VAZIO
scp -i <chave> -r dist\* ubuntu@<IP_VPS>:/tmp/dist-new/
```

```bash
sudo cp -r /tmp/dist-new/* /var/www/codigo-publico/
sudo chown -R www-data:www-data /var/www/codigo-publico
```

Assets têm hash no nome (imutáveis) — sem problema de cache. Se o usuário vir
versão antiga: **hard refresh** (`Ctrl+Shift+R`).

---

## Migrations

Aplicadas **manualmente** (sem ferramenta de tracking ainda). **Última aplicada:
`011_maintainer_protocol.sql`.**

```bash
scp -i <chave> backend\migrations\012_*.sql ubuntu@<IP_VPS>:/tmp/
PGPASSWORD="<DBPASS>" psql -h 127.0.0.1 -U codigo_publico -d codigo_publico \
  -v ON_ERROR_STOP=1 -f /tmp/012_*.sql
```

> ⚠️ Migrations **não são idempotentes** (`CREATE TABLE` sem `IF NOT EXISTS`).
> **Nunca re-rode** uma já aplicada. No PG12, `gen_random_uuid()` exige `pgcrypto`
> (já habilitada). Sempre **backup antes** de migration estrutural.

---

## Banco de dados

```bash
PGPASSWORD="<DBPASS>" psql -h 127.0.0.1 -U codigo_publico -d codigo_publico   # app
sudo -u postgres psql -d codigo_publico                                        # superusuário
```

`DATABASE_URL` aponta para `127.0.0.1:5432/codigo_publico`. O banco/usuário
`codigo_publico` são isolados dos demais bancos da VPS.

---

## nginx, TLS e Cloudflare

Cloudflare com **proxy ON** e modo SSL **"Full"** (não strict): exige criptografia
até a origem mas **não valida** o cert — por isso a origem usa **self-signed**.

```
Navegador ──HTTPS (cert Cloudflare)──► Cloudflare ──HTTPS (cert self-signed)──► nginx
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

O bloco `codigo-publico` é `default_server` em 80 e 443, serve o SPA e faz proxy de
`/api/` para `127.0.0.1:8080`. **Endurecer (futuro):** gerar um *Cloudflare Origin
Certificate* no painel e mudar o modo para **"Full (strict)"**.

---

## Operação diária

```bash
systemctl status codigo-publico
curl -s http://127.0.0.1:8080/api/v1/health | jq
sudo journalctl -u codigo-publico -f
sudo journalctl -u codigo-publico --since "10 min ago" --no-pager
sudo systemctl restart codigo-publico
sudo journalctl -u codigo-publico | grep -i voting   # job de encerramento de votações
```

---

## Backup e restauração

> ⚠️ **Pendência:** o `codigo_publico` ainda **não tem backup automático**.
> Configure (cron). O abaixo é manual.

```bash
# Backup do banco + segredos + config
sudo -u postgres pg_dump codigo_publico | gzip > ~/backups/codigo_publico-$(date +%Y%m%d).sql.gz
sudo cp /etc/codigo-publico.env ~/backups/
sudo cp /etc/nginx/sites-available/codigo-publico ~/backups/

# Restaurar (em banco vazio)
gunzip -c ~/backups/codigo_publico-AAAAMMDD.sql.gz | \
  PGPASSWORD="<DBPASS>" psql -h 127.0.0.1 -U codigo_publico -d codigo_publico

# Trazer para a sua máquina
scp -i <chave> ubuntu@<IP_VPS>:~/backups/codigo_publico-AAAAMMDD.sql.gz .
```

> Perder o `/etc/codigo-publico.env` é **irreversível**: `JWT_SECRET` e
> `CPF_HASH_SECRET` invalidam tokens e quebram o login por CPF. Faça backup dele.

---

## Promover um cidadão a administrador

O papel `admin` só se concede no banco. Como o CPF é guardado só como hash HMAC:

```bash
SECRET=$(sudo grep -E '^CPF_HASH_SECRET=' /etc/codigo-publico.env | cut -d= -f2-)
HASH=$(printf '%s' '<CPF_SO_DIGITOS>' | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $NF}')
sudo -u postgres psql -d codigo_publico \
  -c "UPDATE citizens SET role='admin' WHERE cpf_hash = '$HASH' RETURNING full_name, role"
```

O cidadão precisa **sair e entrar de novo** para o papel entrar no JWT. Papéis
institucionais: `admin`, `institutional_admin`, `legislative_admin`, `procurador`,
`secretario`, `vereador`, `mesa_diretora`, `sysadmin`.

---

## Troubleshooting

| Sintoma | Causa provável | Correção |
| --- | --- | --- |
| "Não foi possível conectar à API" no login | bundle sem `VITE_API_URL=/api/v1` | rebuild (`.env.production` corrige); redeploy; hard refresh |
| `/api/...` responde HTML "Cannot GET" (Express) | requisição caiu em outro `server` do nginx | conferir `default_server`/`server_name` do bloco codigo-publico |
| `cp` do binário: *Text file busy* | binário em execução | `systemctl stop` antes do `cp` |
| 502 em `/api/` | API caída | `systemctl status` + `journalctl` |
| health `postgres`/`redis` degraded | serviço nativo parado | `systemctl start postgresql` / `redis-server` |
| Erro 526 na Cloudflare | "Full (strict)" sem cert válido na origem | voltar para "Full" ou instalar Origin Certificate |
| Migration "already exists" | re-execução de migration aplicada | não re-rodar; conferir a última |
| Usuário vê versão antiga | cache do navegador | hard refresh (assets têm hash) |

---

## Checklist de deploy completo

```
[ ] backend: go build/vet/test verdes
[ ] frontend: npm run lint && npm run build (sem 'localhost:8080' no bundle)
[ ] cross-compilar binário Linux (GOOS=linux GOARCH=amd64 CGO_ENABLED=0)
[ ] se houver migration nova: enviar e aplicar (NÃO re-rodar antigas)
[ ] enviar binário; systemctl stop → cp → start
[ ] enviar dist; cp para /var/www/codigo-publico; chown www-data
[ ] curl health (postgres+redis ok)
[ ] https://codigopublico.stellaris.net.br responde 200
[ ] hard refresh + teste de login real
```

---

## Snapshot da VPS (estado atual)

- **No ar:** Código Público (front + API + PG + Redis + nginx + Cloudflare).
- **Desativado, com backup:** atendezap e edumetrics — serviços parados e bloco
  nginx removido; arquivos e bancos preservados em `/home/ubuntu/backups/predelete-*`
  (purga definitiva pendente de confirmação).
- **Última migration aplicada:** `011_maintainer_protocol.sql`.
