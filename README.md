# Código Público

Infraestrutura pública, auditável e open source de **Orçamento Participativo municipal**.

O Código Público transforma problemas territoriais em decisões orçamentárias rastreáveis. A metáfora de GitHub continua existindo, mas por baixo: histórico, versões, diffs, auditoria, merge institucional e release do ciclo. Para o cidadão, o fluxo principal é simples:

```txt
território
→ demanda simples
→ apoio comunitário
→ maturação
→ filtros públicos
→ votação territorial
→ matriz do OP
→ institucionalização no PPA/LDO/LOA
→ execução fiscalizada
→ aprendizado do próximo ciclo
```

> Uma cidade, um território, uma demanda pública, uma decisão orçamentária rastreável.

No ar: **https://codigopublico.stellaris.net.br**

## Tese

O município é tratado como uma infraestrutura cívica versionada.

```txt
Território              = unidade política base
Demanda                 = problema público simples
Proposta                = demanda amadurecida
Fork                    = alternativa para o mesmo problema
Filtro                  = regra pública de maturidade/admissibilidade
Votação territorial     = priorização cidadã
Matriz do OP            = consolidação municipal das prioridades
Merge institucional     = incorporação no rito formal
Release do ciclo        = versão pública consolidada do OP
Execução                = acompanhamento do que foi aprovado
Aprendizado             = efeito da execução no próximo ciclo
```

## Princípios

- **Orçamento Participativo como eixo**: o sistema existe para transformar problemas locais em prioridade orçamentária, execução e fiscalização.
- **Território como unidade política**: cada bairro, comunidade ou distrito reconhecido tem 1 representante territorial.
- **Code is law**: regras do rito são públicas, testáveis, auditáveis e parametrizáveis por município dentro de limites comuns.
- **Sorteio cívico**: o Maintainer Territorial nasce de inscrição e sorteio auditável entre cidadãos vinculados ao território.
- **Sem especialista como porteiro**: técnicos podem revisar e complementar, mas o filtro principal deve ser protocolo público, contestável e auditável.
- **Privacidade por construção**: CPF, voto individual, denúncia sigilosa e dado sensível nunca são expostos nem gravados em blockchain.
- **Auditabilidade**: toda ação relevante deixa rastro; hashes podem ser ancorados externamente.
- **Execução importa**: o ciclo só fecha quando a decisão aprovada é acompanhada e gera aprendizado para o ciclo seguinte.

## Estrutura

```txt
frontend/   Front-end React + TypeScript + Vite
backend/    API Go + Chi + PostgreSQL + Redis
infra/      Docker, Nginx e OpenTofu (infra como código)
docs/       documentação conceitual, institucional, técnica e operacional
```

## Documentação

**Comece aqui**

- [docs/WHITEPAPER.md](docs/WHITEPAPER.md) — apresentação do projeto para a sociedade.

**Conceito e teoria**

- [docs/CONCEITO.md](docs/CONCEITO.md) — visão geral do Código Público como infraestrutura de OP.
- [docs/ORCAMENTO-PARTICIPATIVO.md](docs/ORCAMENTO-PARTICIPATIVO.md) — protocolo operacional do OP.
- [docs/FUNDAMENTACAO-TEORICA.md](docs/FUNDAMENTACAO-TEORICA.md) — fundamentos políticos da arquitetura.
- [docs/resumo.md](docs/resumo.md) — síntese rápida da teoria operacional.

**Governança**

- [docs/PROTOCOLO-OP.md](docs/PROTOCOLO-OP.md) — **protocolo canônico** da esteira do OP.
- [docs/fluxo.md](docs/fluxo.md) — formulação original do fluxo (consolidada no protocolo).
- [docs/sugestao_de_governanca.md](docs/sugestao_de_governanca.md) — governança consolidada após a virada para OP.
- [docs/GOVERNANCA-TERRITORIAL.md](docs/GOVERNANCA-TERRITORIAL.md) — papéis, territórios e instâncias.
- [docs/PROTOCOLO-DE-VINCULO-TERRITORIAL.md](docs/PROTOCOLO-DE-VINCULO-TERRITORIAL.md) — vínculo do cidadão ao território.
- [docs/PROTOCOLO-DE-MAINTAINERS-TERRITORIAIS.md](docs/PROTOCOLO-DE-MAINTAINERS-TERRITORIAIS.md) — representantes territoriais, sorteio, mandato e recall.
- [docs/BLOCKCHAIN-E-AUDITORIA.md](docs/BLOCKCHAIN-E-AUDITORIA.md) — auditoria, hash chain e ancoragem externa.

**Produto e operação**

- [docs/ARQUITETURA.md](docs/ARQUITETURA.md) — arquitetura técnica-alvo.
- [docs/ESTRUTURA-DO-APP.md](docs/ESTRUTURA-DO-APP.md) — organização do front e backend por domínio.
- [docs/proximos-passos.md](docs/proximos-passos.md) — roteiro para transformar a teoria em modelo operacional.
- [docs/lacunas.md](docs/lacunas.md) — o que já existe vs. o que falta (estado real).
- [docs/OPERACAO.md](docs/OPERACAO.md) — política de operação (ambientes, incidentes, privacidade).
- [docs/RUNBOOK.md](docs/RUNBOOK.md) — procedimentos concretos (deploy, backup, troubleshooting).
- [CONTRIBUTING.md](CONTRIBUTING.md) — subir o ambiente local, testar e contribuir.
- [backend/README.md](backend/README.md) — referência do backend atual.

## Executando localmente

Pré-requisitos: Docker, Go e Node.

```bash
# Banco e Redis (na raiz do projeto)
docker compose up -d

# API (em backend/)
cd backend && cp .env.example .env && go run ./cmd/api

# Front-end (em frontend/)
cd frontend && npm install && npm run dev
```

A API sobe em `http://localhost:8080` e o front em `http://localhost:3000`.
Detalhes de ambiente e testes em [CONTRIBUTING.md](CONTRIBUTING.md).

## Licença

Apache 2.0.
