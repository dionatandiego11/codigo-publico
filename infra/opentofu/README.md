# Infraestrutura como Código — OpenTofu

Provisão replicável da infraestrutura do Código Público. O objetivo é que uma
nova cidade suba sua instância com `tofu apply`, sem passos manuais.

## Ordem de adoção

```txt
1. Docker Compose local           (MVP — já disponível na raiz do repo)
2. VPS Ubuntu + Nginx             (primeira produção, manual)
3. GitHub Actions                 (CI já configurado em .github/workflows)
4. Backup automático
5. OpenTofu                       (produção replicável — este diretório)
```

## Estrutura

```txt
opentofu/
  environments/
    dev/         instância mínima (1 servidor pequeno)
    staging/     homologação
    production/  servidor + banco gerenciado + storage + firewall + DNS
  modules/
    server/      VPS Ubuntu com Docker
    database/    PostgreSQL gerenciado
    storage/     bucket para backups e dados abertos
    firewall/    regras de rede (80/443/SSH restrito)
    dns/         registros do domínio
```

## Provider

Os módulos usam o provider `digitalocean` por simplicidade e custo. A escolha
é isolada nos módulos: para migrar para Hetzner, AWS ou um datacenter
governamental, reimplemente os módulos mantendo as mesmas variáveis/outputs —
os ambientes não mudam.

## Uso

```bash
cd environments/production
export DIGITALOCEAN_TOKEN=...
tofu init
tofu plan -var-file=production.tfvars
tofu apply -var-file=production.tfvars
```

Nunca commitar `*.tfvars` com segredos nem o state local — use um backend
remoto de state (S3/Spaces) em produção.
