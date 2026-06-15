# Lacunas

> Registro consolidado e honesto de tudo que falta, está em aberto ou é risco
> conhecido no Código Público. Complementa a seção de honestidade do
> [WHITEPAPER.md](WHITEPAPER.md) (§11) com o detalhe operacional, técnico,
> jurídico e estratégico. Documento **vivo** — atualize ao fechar ou abrir lacunas.
>
> Companheiro de [proximos-passos.md](proximos-passos.md) (roteiro) e
> [sugestao_de_governanca.md](sugestao_de_governanca.md) (decisões de governança).

**Legenda de status**
- 🔨 **decidido, falta construir** — a decisão está tomada; é trabalho de implementação.
- ❓ **em aberto** — precisa de decisão antes de construir.
- ⚠️ **risco conhecido** — pode não ter solução completa; assumido com mitigação.
- 🧹 **dívida técnica** — funciona, mas precisa de saneamento.

**Severidade:** 🔴 alta · 🟡 média · 🟢 baixa

---

## 1. Produto — o que falta construir

A maior parte vem da virada para Orçamento Participativo (modo OP).

| Lacuna | Status | Sev. | Notas |
| --- | --- | --- | --- |
| **Sorteio do conselho** (aleatoriedade pura verificável, mandato, recall) | 🔨 | 🔴 | Decidido em [docs/ORCAMENTO-PARTICIPATIVO.md](docs/ORCAMENTO-PARTICIPATIVO.md) §4. Construir como `policy` pura + teste, no padrão `territorial`. Origem `sorteio` no `maintainer_policy.go`. |
| **Integração gov.br** (OAuth, "uma pessoa, um voto") | 🔨 | 🔴 | Substitui o login MVP (CPF + senha). Fecha a resistência a Sybil. |
| **Módulo orçamentário + fórmula de carência** | 🔨 | 🔴 | Envelope, regiões, distribuição redistributiva (população/carência/prioridade) como `policy` pura. |
| **Modo "alocação" da votação** | 🔨 | 🟡 | Hoje a votação é consulta (Aprovo/Rejeito/Abstenção); falta priorizar/distribuir demandas dentro de um envelope. |
| **Peso por vínculo (T0 → T5)** | 🔨 | 🟡 | Hoje o código modela T0–T4 sem peso de voto. Estender a escala e ponderar a influência. |
| **Fluxo do envelope (bootstrap → voto popular → PPA)** | 🔨 | 🟡 | O próprio tamanho do OP como decisão participativa. |
| **Crypto-shredding na auditoria** | 🔨 | 🔴 | Hoje a cadeia guarda `actor_name` em texto puro. Cifrar PII por titular (LGPD art. 18 × imutabilidade). |
| **Ancoragem no Diário Oficial** | 🔨 | 🟡 | Hoje só há `Anchorer` noop/log. Implementar a publicação do hash-cabeça. |
| **Endpoint real de repositórios** | 🔨 | 🟡 | `getRepositories` ainda é mock no front; falta tabela + rota no Go. |
| **Escrita de reviews/checks institucionais** | 🔨 | 🟢 | Hoje só leitura; falta emitir parecer. |
| **Comentário em artigo da Lei Orgânica** | 🔨 | 🟢 | Modelo existe (`ArticleComment`); falta o endpoint de escrita. |
| **Busca** (issues, PRs, artigos) | 🔨 | 🟢 | Inexistente. |
| **UI de contestação e recall territorial** | 🔨 | 🟡 | Backend pronto; falta a interface (hoje só vínculo + validação têm UI). |

---

## 2. Governança — decisões em aberto

Da [sugestao_de_governanca.md](sugestao_de_governanca.md) e do §13 do doc de OP.

| Lacuna | Status | Sev. | Notas |
| --- | --- | --- | --- |
| **Ajuda de custo ao sorteado** | ❓ | 🔴 | Sem ela, o conselho exclui quem não pode faltar ao trabalho — reintroduz o viés que o sorteio combate. Questão de desenho **e** de custeio. |
| **Limites comuns dos parâmetros locais** | ❓ | 🔴 | Até onde vai a autonomia da cidade (policentrismo) antes de descaracterizar o modelo? Ex.: mandato de 10 anos burlaria a rotação; envelope de 0% esvaziaria o OP. Faltam os limites rígidos. |
| **Calibração dos pesos (T0–T5 e carência)** | ❓ | 🟡 | Faixas-referência defensáveis para cada nível e para a fórmula. |
| **Duração do mandato (default)** | ❓ | 🟡 | Provisório (90/365 dias); no modo OP, alinhar ao ciclo. Cada cidade define dentro de limites. |
| **Quórum de recall** | ❓ | 🟡 | Provisório em 50%+1 dos vínculos seniores. |
| **Intervenção do Executivo (casos especiais)** | ❓ | 🟡 | Se algum, quais? Hoje o executivo não destitui por mérito. |
| **Massa vs. conselho — fronteira fina** | ❓ | 🟢 | Resolvido em tese (massa propõe/prioriza; conselho consolida); falta o detalhe operacional do corte. |

---

## 3. Técnica e qualidade

| Lacuna | Status | Sev. | Notas |
| --- | --- | --- | --- |
| **Testes no front-end** | 🔨 | 🟡 | Zero testes (só `tsc` + build). Vitest nos hooks e na tradução de status seria o começo. |
| **Módulo-deus `internal/public`** | 🧹 | 🟡 | Issues, PRs, votações, etc. num só pacote/`Repository`. Extrair por domínio (ver [docs/ESTRUTURA-DO-APP.md](docs/ESTRUTURA-DO-APP.md)). Começar por `releases`/`executions`. |
| **Arquivo-deus `lib/api.ts`** | 🧹 | 🟡 | Todas as chamadas num arquivo. Fatiar em `features/*/api.ts` — vitória fácil e de grande alívio. |
| **Migrations aplicadas à mão** | 🧹 | 🟡 | Sem ferramenta de tracking (golang-migrate/goose). Risco de re-rodar/pular. |
| **CI não faz deploy** | 🧹 | 🟢 | O GitHub Actions testa/builda; o deploy é manual via ssh. |

---

## 4. Operação e infraestrutura

Da [docs/OPERACAO.md](docs/OPERACAO.md) §14.

| Lacuna | Status | Sev. | Notas |
| --- | --- | --- | --- |
| **Backup automático do banco** | 🔨 | 🔴 | `codigo_publico` só tem backup manual. Risco de perda **irreversível** com dados reais no ar. |
| **Monitoramento/alerta** | 🔨 | 🔴 | A API cair sem ninguém saber é o risco mais provável. Um healthcheck externo já ajuda. |
| **Rate limiting** | 🔨 | 🟡 | `/auth/login`, `/citizens/register` e voto sem limite. O Redis já está conectado (hoje só serve ao health). |
| **Cloudflare Full (strict)** | 🔨 | 🟢 | Hoje "Full" com cert self-signed; falta Origin Certificate para validação completa. |
| **VM única, sem redundância** | ⚠️ | 🟡 | 952 MB, ponto único de falha. Aceitável no piloto, não em escala. |
| **`chave_oracle/` dentro do repositório** | 🧹 | 🟡 | Gitignorada, mas o ideal é movê-la para fora da árvore do projeto (contém chave SSH + senhas). |
| **IP de origem fora do versionamento** | ⚠️ | 🟢 | Manter o IP da VPS fora de docs versionados (proteção da Cloudflare). |

---

## 5. Segurança e modelo de ameaça

Da tabela honesta do §9 de OP e do §11 do whitepaper.

| Lacuna | Status | Sev. | Notas |
| --- | --- | --- | --- |
| **Identidade frágil até o gov.br** | 🔨 | 🔴 | CPF + data de nascimento são semi-públicos; a afirmação anti-Sybil só fica forte com gov.br. |
| **Domínio privado absoluto (milícia)** | ⚠️ | 🟡 | Nenhum design vence dominação total de um território. O sistema eleva o custo, deixa rastro e permite recurso — mas não promete milagre. **Limite assumido.** |
| **Espelhamento da comunidade no sorteio** | ⚠️ | 🟢 | Aleatoriedade pura é incapturável mas não garante representação descritiva em conselhos pequenos. Trade-off assumido, a monitorar. |
| **Paradoxo de bootstrap** | ⚠️ | 🟢 | Quem nomeia o primeiro mantenedor/instala a primeira instância exerce autoridade não-eleita. Costura de legitimidade inerente a todo momento fundador. |

---

## 6. Jurídico

| Lacuna | Status | Sev. | Notas |
| --- | --- | --- | --- |
| **LGPD — implementar o crypto-shredding** | 🔨 | 🔴 | A solução está desenhada; falta existir no código (ver §1). Sem isso, a imutabilidade conflita com o direito ao esquecimento. |
| **Valor jurídico formalizado** | ❓ | 🟡 | O caminho é a LOA/PPA via OP; falta a modelagem jurídica concreta (minuta de lei que institui o programa usando o sistema). |
| **Iniciativa popular (art. 29 CF)** | ❓ | 🟢 | Integração futura: coleta de assinaturas com efeito de protocolo formal. |

---

## 7. Estratégia e adoção

| Lacuna | Status | Sev. | Notas |
| --- | --- | --- | --- |
| **Primeira cidade-piloto** | ❓ | 🔴 | O sistema só importa se uma prefeitura/câmara real adotar. Desafio central. |
| **A lei que institui o OP** | ❓ | 🔴 | É a métrica de sucesso nº 1 **e** a condição de sobrevivência (institucionalizar contra a troca de gestão). |
| **Sustentabilidade quando o autor sair** | ❓ | 🟡 | Quem mantém o código comum a longo prazo (governança do projeto open source)? |
| **Custeio da operação por cidade** | ❓ | 🟡 | Modelo "cada cidade banca a própria infra" definido; falta o detalhamento (quanto custa, quem na prefeitura assume). |

---

## 8. Prioridades — por onde atacar

Síntese cruzando severidade × desbloqueio:

**Imediato (risco de perda real, dados no ar):**
1. Backup automático do banco — 🔴 evita perda irreversível.
2. Monitoramento/alerta básico — 🔴 a API cair em silêncio.

**Habilita o modo OP (a tese do projeto):**
3. gov.br + crypto-shredding — 🔴 identidade forte + LGPD.
4. Módulo de sorteio (`policy` + teste) — 🔴 materializa a decisão central.
5. Módulo orçamentário + carência — 🔴 o coração do OP.

**Decisões que travam construção:**
6. Ajuda de custo ao sorteado e limites comuns dos parâmetros locais — 🔴 sem elas, o sorteio e o policentrismo ficam mancos.

**Estratégico (define o futuro):**
7. Primeira cidade-piloto + minuta da lei — 🔴 sem isso, o resto é arquitetura no vácuo.

**Saneamento de baixo risco e alto alívio:**
8. Fatiar `lib/api.ts`; testes no front; ferramenta de migrations.

---

> Regra de ouro deste documento: **uma lacuna declarada vale mais que uma falha
> escondida.** Atualize-o sempre que fechar ou descobrir uma.
