# Fundamentação Teórica — Código Público

Este documento explica a base política do Código Público após a virada conceitual para **infraestrutura de Orçamento Participativo municipal**.

O projeto não abandona a metáfora de Git. Ela passa a operar como infraestrutura interna de rastreabilidade, enquanto a tese pública fica centrada em território, orçamento, execução e aprendizado.

## Tese central

O Código Público é uma constituição operacional para Orçamento Participativo:

```txt
território
→ demanda simples
→ maturação
→ filtros públicos
→ votação territorial
→ matriz do OP
→ institucionalização no PPA/LDO/LOA
→ execução fiscalizada
→ aprendizado do ciclo seguinte
```

Sua aposta é que regras públicas implementadas em código podem reduzir arbitrariedade, captura e invisibilidade na decisão orçamentária municipal.

## 1. Code is law — Lawrence Lessig

O sistema assume a tese de que arquitetura técnica regula comportamento político.

No Código Público, isso significa:

- estados da esteira são regras institucionais;
- filtros precisam ser públicos e testáveis;
- parâmetros locais devem ser explícitos;
- todo movimento relevante gera auditoria;
- constantes de política não podem ficar escondidas como detalhe técnico.

O código não é só ferramenta. Ele é parte do rito.

## 2. Democracia territorial

A unidade democrática base é o território.

```txt
bairro
comunidade
distrito
zona rural
```

A decisão central é:

```txt
1 território = 1 representação
```

Essa escolha evita que regiões populosas dominem comunidades pequenas e dá existência política direta a periferias e zona rural.

A justiça social do sistema começa pela justiça territorial.

## 3. Sorteio e legitimidade — Bernard Manin e Hélène Landemore

Bernard Manin mostra que eleição historicamente favorece visibilidade, riqueza e redes de influência. Landemore reforça a defesa de modelos abertos, rotativos e não exclusivamente eleitorais.

No Código Público:

- o Maintainer Territorial é temporário;
- nasce de inscrição e sorteio auditável;
- responde ao território e ao Maintainer Geral;
- pode sofrer recall;
- deve justificar filtros e decisões.

A legitimidade tem duas partes:

```txt
origem      = sorteio auditável entre cidadãos vinculados
exercício   = mandato limitado, justificativa, recurso, recall e auditoria
```

## 4. Governança de comuns — Elinor Ostrom

O OP é um comum institucional: cidadãos disputam recursos escassos, regras de prioridade e execução pública.

Ostrom ajuda a separar:

```txt
kernel comum
  regras democráticas mínimas, privacidade, sorteio, auditoria, retornos

regimento local
  calendário, mandato, envelope, índice de carência, prazos, quórum
```

O município deve poder parametrizar o rito, mas não violar limites comuns:

- nenhum território reconhecido sem voz;
- maintainer vitalício proibido;
- filtro sem justificativa proibido;
- voto individual exposto proibido;
- dado pessoal em blockchain proibido;
- alteração invisível de histórico proibida.

## 5. Proceduralismo epistêmico — David Estlund

O sistema não presume que todo voto popular produz automaticamente a melhor decisão.

Ele cria uma linha de maturidade:

```txt
demanda simples
→ apoio
→ informação complementar
→ agrupamento
→ fork
→ filtro
→ votação
```

A legitimidade vem de um procedimento público que tende a melhorar a decisão sem retirar a voz do cidadão.

## 6. Deliberação sem barreira

O cidadão não precisa preencher um caderno técnico para participar.

A entrada é simples:

> Falta médico no PSF do meu bairro.

A deliberação acontece por camadas:

- apoios;
- não apoios;
- comentários;
- evidências;
- perguntas;
- forks;
- filtros;
- justificativas;
- retorno à esteira.

O sistema evita dois extremos:

- voto bruto sem informação;
- tecnocracia que bloqueia a participação na porta.

## 7. Republicanismo da não-dominação — Philip Pettit

O Maintainer Territorial é necessário e perigoso.

Ele pode organizar o território, mas não pode virar autoridade informal.

Salvaguardas:

- mandato temporário;
- limite de mandatos;
- recall;
- justificativa obrigatória;
- recurso ao Maintainer Geral;
- audit log;
- denúncia sigilosa;
- impossibilidade de apagar histórico.

O cidadão deve poder contestar o poder local sem ficar exposto a retaliação.

## 8. Democracia monitória — John Keane

O sistema não confia em virtude individual. Ele cria monitoramento permanente.

Instrumentos:

- audit events;
- hash chain;
- release do ciclo;
- incidentes de divergência institucional;
- execução fiscalizada;
- âncoras externas como Diário Oficial e blockchain pública.

Blockchain entra como prova externa de integridade, não como local para dado pessoal.

## 9. Risco de dominação local

Transparência radical pode ser perigosa em territórios capturados por patrões, grupos econômicos, redes clientelistas ou violência.

Por isso:

- denúncia sigilosa deve existir;
- contestação sensível pode ser protegida;
- dados pessoais ficam criptografados fora de blockchain;
- blockchain guarda apenas hash;
- acesso a dado sensível exige rito formal;
- toda abertura de dado sensível gera auditoria.

## 10. Orçamento, escassez e circuit breaker

O OP lida com desejo público sob escassez.

O sistema deve aceitar a demanda inicial, mas aplicar filtros públicos:

- competência municipal;
- custo maior que o envelope;
- demanda individual privada;
- vedação constitucional;
- dependência de outro ente;
- necessidade de faseamento;
- impacto permanente sem fonte.

O circuit breaker não deve humilhar a demanda. Ele deve traduzir, devolver, fasear ou transformar em reivindicação externa quando possível.

## 11. Execução e aprendizado — Archon Fung

Participação sem execução vira teatro.

O Código Público fecha o ciclo quando a decisão aprovada vira item fiscalizável.

A execução precisa produzir memória:

- concluída;
- atrasada;
- paralisada;
- cancelada;
- frustrada.

Essa memória deve influenciar o próximo ciclo, especialmente quando um território acumula carência persistente ou promessas não cumpridas.

## 12. A lacuna principal

A teoria avançou mais rápido que o sistema.

O app atual ainda carrega peças do modelo antigo:

```txt
Lei Orgânica → issue → PR cívico → votação → release
```

O modelo operacional precisa migrar para:

```txt
Ciclo OP → território → demanda → proposta → votação territorial → matriz → execução
```

Essa é a distância conceitual que orienta o roadmap.

## 13. Perguntas em aberto

- Qual duração do mandato territorial?
- Qual limite de mandatos consecutivos?
- Como calcular o índice de carência?
- Como tratar território sem inscrito para sorteio?
- Como definir quórum de recall?
- Como impedir filtro institucional invisível?
- Como registrar divergência entre sistema e ato oficial?
- Como execução frustrada altera o próximo ciclo?
- Qual evento deve ser ancorado em blockchain?

## 14. Referências teóricas

- Lawrence Lessig — *Code and Other Laws of Cyberspace*.
- Bernard Manin — *The Principles of Representative Government*.
- Hélène Landemore — *Open Democracy*.
- Elinor Ostrom — *Governing the Commons*.
- David Estlund — *Democratic Authority*.
- Philip Pettit — *Republicanism*.
- John Keane — *The Life and Death of Democracy*.
- Archon Fung — participação, deliberação e governança responsiva.
- Iris Marion Young e Anne Phillips — inclusão e presença política.
