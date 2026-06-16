# Corrigir Documentação

Documento de controle para alinhar os textos do projeto à versão mais evoluída do conceito.

## Fonte canônica atual

O documento principal deve ser:

```txt
docs/PROTOCOLO-OP.md
```

Ele consolida a versão mais atual da teoria operacional do Código Público:

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

## Correção principal

Alguns documentos ainda falam em:

```txt
1 território = 1 Maintainer Territorial
```

Mas o `PROTOCOLO-OP.md` evoluiu para:

```txt
1 território = 1 conselho territorial sorteado
```

O conselho territorial deve ser entendido como colegiado de 3 a 7 cidadãos sorteados, conforme regimento local.

## Novo entendimento

O território não deve depender de uma única pessoa como filtro.

O fluxo mais maduro distribui poder entre:

- protocolo;
- limiar popular de apoio;
- conselho territorial sorteado;
- Legislativo como Maintainer Geral;
- auditoria pública;
- incidente público em caso de veto político.

## Termos a substituir ou revisar

| Termo antigo | Termo recomendado |
|---|---|
| Maintainer Territorial individual | Conselho Territorial sorteado |
| representante territorial único | colegiado territorial sorteado |
| filtro do maintainer | filtro protocolar + limiar popular + casos ambíguos ao conselho |
| conselho/maintainer decide aptidão | aptidão passa por dois portões: sistema + apoio popular |
| matriz como arena de disputa | matriz como consolidação territorial + estruturante |
| veto institucional genérico | admissibilidade formal ou incidente público de divergência |

## Documentos que precisam ser revisados

- `docs/CONCEITO.md`
- `docs/resumo.md`
- `docs/WHITEPAPER.md`
- `docs/GOVERNANCA-TERRITORIAL.md`
- `docs/PROTOCOLO-DE-MAINTAINERS-TERRITORIAIS.md`
- `docs/PROTOCOLO-DE-VINCULO-TERRITORIAL.md`
- `docs/sugestao_de_governanca.md`
- `docs/ORCAMENTO-PARTICIPATIVO.md`
- `docs/proximos-passos.md`
- `README.md`

## Pontos conceituais a alinhar

### 1. Conselho territorial

O território deve ter representação, mas não concentrada em uma pessoa.

Formulação recomendada:

> Cada território reconhecido tem direito a um conselho territorial sorteado, colegiado, temporário e auditável.

### 2. Dois portões de aptidão

A proposta não deve depender do julgamento isolado de um representante.

Formulação recomendada:

```txt
Portão A — protocolar: sistema verifica requisitos mínimos.
Portão B — popular: comunidade atinge limiar de apoio.
Casos ambíguos: sobem ao conselho territorial.
```

### 3. Envelope em dois níveis

O orçamento do ciclo deve ser dividido antes da votação.

Formulação recomendada:

```txt
Envelope do ciclo
├─ porção territorial: piso igual + carência
└─ porção estruturante: projetos entre territórios
```

### 4. Matriz do OP

A matriz não deve virar disputa final entre territórios.

Formulação recomendada:

> A matriz consolida vencedores territoriais já financiados, aloca a porção estruturante e identifica conflitos ou sinergias entre territórios.

### 5. Veto político

O Legislativo pode exercer papel institucional, mas não veto invisível.

Formulação recomendada:

```txt
admissibilidade formal → filtro legítimo e justificado
veto político fora da lista formal → incidente público de divergência institucional
```

### 6. Aprendizado

Execução frustrada deve alterar o ciclo seguinte.

Formulação recomendada:

> Frustração dá reentrada prioritária à demanda e, quando crônica, aumenta o peso de carência do território no próximo envelope.

## Regra para futuras edições

Antes de alterar qualquer documento, verificar:

```txt
Esse texto está alinhado ao PROTOCOLO-OP.md?
```

Se não estiver, o `PROTOCOLO-OP.md` prevalece.
