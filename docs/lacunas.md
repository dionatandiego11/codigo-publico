# Lacunas

Registro das lacunas após a mudança de eixo para Orçamento Participativo.

Legenda:

- 🔨 decidido, falta construir;
- ❓ decisão em aberto;
- ⚠️ risco conhecido;
- 🧹 dívida técnica.

Severidade:

- 🔴 alta;
- 🟡 média;
- 🟢 baixa.

## 1. Produto OP

| Lacuna | Status | Sev. | Observação |
|---|---|---|---|
| Protocolo OP oficial | 🔨 | 🔴 | Consolidar `fluxo.md` em `docs/PROTOCOLO-OP.md`. |
| Ciclos do OP | 🔨 | 🔴 | Entidade `op_cycles`, calendário, envelope e status. |
| Demanda simples | 🔨 | 🔴 | Entrada cidadã com problema, território, categoria e descrição. |
| Apoio/não apoio | 🔨 | 🟡 | Engajamento inicial antes da maturação. |
| Agrupamento | 🔨 | 🟡 | Demandas parecidas precisam virar uma família. |
| Fork de proposta | 🔨 | 🔴 | Soluções diferentes para o mesmo problema. |
| Maturação territorial | 🔨 | 🔴 | Camadas de contexto, evidência e complemento. |
| Filtros públicos | 🔨 | 🔴 | Territorial, jurídico-orçamentário e institucional. |
| Circuit breaker | 🔨 | 🔴 | Regra pública para custo, competência, ilegalidade e faseamento. |
| Votação territorial | 🔨 | 🔴 | Propostas aptas por território. |
| Matriz do OP | 🔨 | 🔴 | Consolidação municipal das prioridades. |
| Institucionalização | 🔨 | 🔴 | Vínculo com Câmara, PPA, LDO e LOA. |
| Release do ciclo | 🔨 | 🟡 | Versão consolidada e auditável do OP. |
| Execução fiscalizada | 🔨 | 🔴 | Status, prazo, evidência, atraso e conclusão. |
| Aprendizado do ciclo | 🔨 | 🔴 | Execução frustrada precisa afetar o próximo ciclo. |

## 2. Governança

| Lacuna | Status | Sev. | Observação |
|---|---|---|---|
| Regra comum vs local | ❓ | 🔴 | Definir limites que o município não pode violar. |
| Mandato territorial | ❓ | 🟡 | Duração e limite de mandatos consecutivos. |
| Quórum de recall | ❓ | 🟡 | Precisa ser possível, não simbólico. |
| Inscrito único | ❓ | 🟡 | Aclamação condicionada, mandato reduzido ou outra regra. |
| Território sem inscritos | ❓ | 🔴 | Não pode virar território mudo. |
| Votação sem maintainer | ❓ | 🟡 | Decidir se exige zeladoria formal do Maintainer Geral. |
| Ajuda de custo | ❓ | 🔴 | Sem apoio material, sorteio pode excluir vulneráveis. |
| Índice de carência | ❓ | 🔴 | Fórmula e limites comuns. |
| Maintainer Técnico | 🔨 | 🟡 | Garantir papel técnico sem mérito político. |
| Legislativo como Maintainer Geral | 🔨 | 🔴 | Precisa de rito e minuta institucional. |

## 3. Identidade e privacidade

| Lacuna | Status | Sev. | Observação |
|---|---|---|---|
| Identidade forte | 🔨 | 🔴 | Login MVP ainda não basta para OP real. |
| LGPD e dado sensível | 🔨 | 🔴 | Denúncia e contestação sigilosa precisam de criptografia fora da blockchain. |
| Voto individual | 🔨 | 🔴 | Nunca expor escolha individual. |
| Dados em blockchain | 🔨 | 🔴 | Garantir que só hashes sejam ancorados. |
| Auditoria de acesso sensível | 🔨 | 🔴 | Toda abertura de conteúdo sigiloso gera evento. |

## 4. Auditoria e blockchain

| Lacuna | Status | Sev. | Observação |
|---|---|---|---|
| Hash da lista do sorteio | 🔨 | 🔴 | Necessário para sorteio auditável. |
| Seed pública | 🔨 | 🔴 | Fonte verificável e imprevisível. |
| Hash da matriz OP | 🔨 | 🟡 | Prova de integridade da matriz consolidada. |
| Hash da release | 🔨 | 🟡 | Versão pública ancorável. |
| Âncora real | 🔨 | 🟡 | Hoje a ancoragem ainda é conceitual/noop/log. |
| Diário Oficial | 🔨 | 🟡 | Definir publicação de hashes. |

## 5. Técnico

| Lacuna | Status | Sev. | Observação |
|---|---|---|---|
| Domínio `internal/op` | 🔨 | 🔴 | Criar módulos de ciclo, demanda, proposta, filtro, matriz e execução. |
| `internal/public` legado | 🧹 | 🟡 | Parar de crescer e extrair quando tocar. |
| Contratos OP | 🔨 | 🔴 | Front, back e banco precisam compartilhar status. |
| Front por features OP | 🔨 | 🔴 | Home e fluxo devem começar por ciclo/território/demanda. |
| Testes de policy | 🔨 | 🔴 | Sorteio, filtros, retornos da esteira e execução. |
| Migrations versionadas | 🧹 | 🟡 | Usar goose ou golang-migrate. |
| CI | 🧹 | 🟡 | `go test`, build do front, typecheck. |
| Rate limiting | 🔨 | 🟡 | Login, cadastro, voto, apoio e comentários. |

## 6. Operação

| Lacuna | Status | Sev. | Observação |
|---|---|---|---|
| Backup automático | 🔨 | 🔴 | Essencial antes de dados reais. |
| Monitoramento externo | 🔨 | 🔴 | Healthcheck e alerta. |
| Logs de auditoria operáveis | 🔨 | 🟡 | Consultas e exportação. |
| Plano de restauração | 🔨 | 🔴 | Backup sem restore testado não é backup. |
| Observabilidade | 🔨 | 🟡 | Métricas de API, banco e Redis. |

## 7. Jurídico-institucional

| Lacuna | Status | Sev. | Observação |
|---|---|---|---|
| Minuta de lei do OP | ❓ | 🔴 | Condição de adoção real. |
| Regimento local | ❓ | 🔴 | Define parâmetros municipais. |
| Entrada no PPA/LDO/LOA | ❓ | 🔴 | Precisa de rito claro. |
| Divergência sistema vs ato oficial | ❓ | 🟡 | Criar incidente público. |
| Município piloto | ❓ | 🔴 | Sem piloto, o sistema fica conceitual. |

## 8. Riscos conhecidos

| Risco | Status | Sev. | Mitigação |
|---|---|---|---|
| Captura do Maintainer Territorial | ⚠️ | 🔴 | sorteio, mandato curto, recall, audit log. |
| Legislativo como veto invisível | ⚠️ | 🔴 | filtro institucional fundamentado e contestável. |
| Burocracia técnica como porteiro | ⚠️ | 🔴 | filtro protocolar público, não especialista único. |
| Dominação local privada | ⚠️ | 🟡 | denúncia sigilosa, recurso, rastro, proteção de dados. |
| Demanda impossível gerar frustração | ⚠️ | 🟡 | circuit breaker com fork e reformulação. |
| Complexidade afastar cidadão | ⚠️ | 🟡 | UI traduz a constituição. |

## 9. Prioridade sugerida

1. Protocolo OP oficial.
2. Regra comum vs regra local.
3. Entidades do OP.
4. Domínio `internal/op`.
5. Home e fluxo do front por território/demanda.
6. Sorteio de Maintainer Territorial.
7. Demanda, apoio, fork e filtros.
8. Votação territorial e matriz.
9. Institucionalização e release.
10. Execução e aprendizado.
