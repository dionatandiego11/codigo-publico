# Código Público

Plataforma municipal de democracia direta versionada, inspirada na lógica do
GitHub: a cidade é um **repositório cívico**, os bairros são **territórios
mantidos** e os problemas públicos viram **issues territoriais** — rastreáveis,
auditáveis e conversíveis em propostas, votações, releases legislativas e
fiscalização de execução.

> Uma cidade, um território-base, um cidadão validado, uma participação
> rastreável.

No ar: **https://codigopublico.stellaris.net.br**

**Caso de uso fundador:** infraestrutura de **Orçamento Participativo**
institucionalizável por lei — ver [docs/ORCAMENTO-PARTICIPATIVO.md](docs/ORCAMENTO-PARTICIPATIVO.md).

📄 **Comece pelo [WHITEPAPER.md](WHITEPAPER.md)** — a apresentação do projeto para a sociedade.

## Estrutura do monorepo

```txt
frontend/   SPA React + TypeScript + Vite (mobile-first)
backend/    API Go (chi) + PostgreSQL + Redis — módulos por domínio
infra/      Docker, Nginx e OpenTofu (infra como código replicável)
docs/       documentação conceitual, institucional e operacional
```

## Documentação

**Conceitual** — o que é e por quê
- [docs/CONCEITO.md](docs/CONCEITO.md) — a ideia e o ciclo cívico completo
- [docs/ORCAMENTO-PARTICIPATIVO.md](docs/ORCAMENTO-PARTICIPATIVO.md) — o caso de uso fundador (OP, sorteio, gov.br, valor jurídico)
- [docs/ARQUITETURA.md](docs/ARQUITETURA.md) — stack, módulos e padrões
- [docs/ESTRUTURA-DO-APP.md](docs/ESTRUTURA-DO-APP.md) — estrutura-alvo e caminho de migração
- [docs/FUNDAMENTACAO-TEORICA.md](docs/FUNDAMENTACAO-TEORICA.md) — teoria política, obstáculos e perguntas em aberto

**Institucional** — as regras de governança
- [docs/GOVERNANCA-TERRITORIAL.md](docs/GOVERNANCA-TERRITORIAL.md) — sysadmin, maintainers e instâncias recursais
- [docs/PROTOCOLO-DE-VINCULO-TERRITORIAL.md](docs/PROTOCOLO-DE-VINCULO-TERRITORIAL.md) — vínculos, níveis T0–T4, contestação
- [docs/PROTOCOLO-DE-MAINTAINERS-TERRITORIAIS.md](docs/PROTOCOLO-DE-MAINTAINERS-TERRITORIAIS.md) — nomeação, mandato e destituição (recall)
- [docs/BLOCKCHAIN-E-AUDITORIA.md](docs/BLOCKCHAIN-E-AUDITORIA.md) — trilha encadeada e ancoragem de provas
- [sugestao_de_governanca.md](sugestao_de_governanca.md) — decisões de governança em aberto

**Prática** — construir e operar
- [CONTRIBUTING.md](CONTRIBUTING.md) — subir o ambiente, testar e contribuir
- [docs/OPERACAO.md](docs/OPERACAO.md) — runbook de produção (deploy, backup, troubleshooting)
- [backend/README.md](backend/README.md) — referência completa da API
- [proximos-passos.md](proximos-passos.md) — roteiro de evolução

## Executando localmente

Pré-requisitos: Docker, Go 1.25+, Node 22+.

```bash
# 1. Banco e cache
docker compose up -d

# 2. API (em backend/)
cd backend && cp .env.example .env && go run ./cmd/api

# 3. Front-end (em frontend/)
cd frontend && npm install && npm run dev
```

A API sobe em `http://localhost:8080` e o front em `http://localhost:3000`.
O front funciona em modo demonstração (dados locais) quando a API está fora.

## Princípios

- **Integridade institucional**: votos e apoios populares não executam merge;
  o rito formal é preservado e auditado.
- **Privacidade por construção**: CPF apenas como hash HMAC, senha apenas como
  bcrypt, voto individual nunca exposto, dado pessoal nunca em blockchain.
- **Auditabilidade**: toda decisão relevante gera evento com hash encadeado;
  a cabeça da cadeia pode ser ancorada externamente.
- **Governança recorrível**: nenhuma decisão territorial é irrecorrível.

## Licença

Apache 2.0 (declarada nos arquivos-fonte).
