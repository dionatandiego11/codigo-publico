# Mapa de Reaproveitamento do GitLaw

Este documento registra o que ainda faz sentido reaproveitar do antigo projeto GitLaw após a virada do Código Público para infraestrutura de Orçamento Participativo.

## Decisão geral

O GitLaw não deve guiar mais o conceito principal.

Antes, ele ajudava a pensar:

```txt
lei → issue → PR → review → merge → release
```

Agora o eixo é:

```txt
ciclo OP → território → demanda → proposta/fork → votação → matriz → execução
```

Portanto, GitLaw fica como referência de **versionamento, diff, histórico, wizard e auditoria**, não como modelo político central.

## Entra

### 1. Diff viewer

Útil para:

- comparar versões de proposta;
- mostrar fork;
- exibir alteração entre demanda original e proposta madura;
- mostrar divergência entre matriz do sistema e ato oficial.

Adaptação:

- trocar “diff normativo” por “diff de proposta” ou “diff institucional”;
- usar linguagem de OP, não de lei como centro.

### 2. Linha do tempo

Útil para a esteira:

```txt
demanda criada
apoio recebido
agrupada
fork criada
filtro aplicado
apta para votação
votada
consolidada
institucionalizada
em execução
concluída
```

### 3. Wizard

O wizard de criação de PR vira wizard de demanda/proposta.

Fluxo novo:

```txt
1. Qual é o problema?
2. Onde acontece?
3. Qual território?
4. Quem é afetado?
5. Há foto ou evidência?
6. Existe solução sugerida?
7. Publicar demanda simples
```

Depois, a maturação transforma demanda em proposta.

### 4. Componentes de status

Podem virar chips da esteira:

- recebida;
- em maturação;
- agrupada;
- fork;
- filtrada;
- apta;
- em votação;
- priorizada;
- institucionalizada;
- em execução;
- concluída;
- frustrada.

### 5. Auditoria e eventos

Reaproveitar a ideia de eventos críticos, mas com nomes de OP:

```txt
op.cycle.opened
op.demand.created
op.demand.supported
op.demand.grouped
op.proposal.forked
op.filter.applied
op.vote.cast
op.matrix.published
op.institutionalized
op.release.created
op.execution.updated
```

### 6. Componentes visuais

Podem ser adaptados:

- `DiffViewer`;
- timeline;
- status checks;
- barra de votação;
- fluxo guiado.

Mas o visual deve ser do Código Público, não do GitLaw.

## Entra com adaptação forte

### Máquina de estados

A máquina de PR não deve ser copiada.

Ela vira referência para a máquina da esteira do OP:

```txt
recebida
→ em maturação
→ agrupada/fork
→ filtro territorial
→ circuit breaker
→ apta
→ em votação
→ priorizada
→ matriz
→ institucionalização
→ release
→ execução
→ aprendizado
```

### Reviews

Reviews técnicos/jurídicos deixam de ser porteiros.

Devem virar complementos:

- comentário técnico;
- alerta orçamentário;
- sugestão de fork;
- explicação de impedimento;
- evidência.

### CI/status checks

Checks viram verificações públicas da esteira:

- território informado;
- demanda não duplicada;
- informação mínima;
- custo dentro do envelope;
- competência municipal;
- sem vedação constitucional;
- apta para votação.

## Fica só como referência

- GitHub como metáfora principal;
- PR cívico como centro do produto;
- Lei Orgânica como repositório inicial;
- merge de texto normativo como fluxo principal;
- governança por repositório normativo;
- voto ponderado por repositório;
- experiência visual cripto/GitHub.

## Não entra

- dependência de carteira;
- modelo de DAO;
- token;
- voto plutocrático;
- governança por capital;
- blockchain como banco de dados;
- dados pessoais em cadeia.

## Nova regra de aproveitamento

Antes de reaproveitar algo do GitLaw, perguntar:

```txt
Isso ajuda a transformar demanda territorial em decisão orçamentária rastreável?
```

Se sim, adaptar.

Se apenas reforça a metáfora Git, deixar como referência.
