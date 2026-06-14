# Código Público — Conceito

O **Código Público** é uma plataforma municipal de democracia direta
versionada, inspirada na lógica do GitHub: a cidade funciona como um
**repositório cívico**, os bairros e comunidades como **territórios
mantidos**, e os problemas públicos como **issues territoriais**.

> Transformar problemas reais do território em demandas públicas rastreáveis,
> auditáveis e eventualmente convertíveis em propostas, votações, fiscalização
> ou alteração normativa.

## Mapa conceitual

```txt
Cidade               = instância soberana do sistema
Bairro/comunidade    = território-base
Cidadão              = colaborador territorial
Problema público     = issue
Proposta pública     = PR cívico
Parecer técnico      = review
Aprovação formal     = merge institucional
Nova versão da norma = release
Histórico público    = audit log (hash encadeado)
Blockchain           = prova externa de integridade
```

## Instância municipal

O app não nasce genérico. Nasce como instância de uma cidade
(ex.: `Código Público Brumadinho`) e é replicável: a infraestrutura como
código (`infra/opentofu`) permite que outra cidade suba a sua própria
instância soberana.

## O ciclo completo

```txt
Lei vigente (texto versionado)
  → issue territorial (problema concreto do bairro)
  → PR cívico (proposta com diff normativo)
  → reviews técnicos, jurídicos e populares
  → votação (resultado agregado, voto sigiloso)
  → merge institucional (rito formal, papel institucional)
  → release legislativa
  → fiscalização da execução
```

## O cidadão começa pelo problema, não pela lei

Buraco na rua, estrada rural ruim, falta de iluminação, risco de
deslizamento, transporte escolar, falta de médico, pedido de transparência —
tudo vira **issue territorial**, com território, categoria, autor com vínculo
validado, órgão responsável e trilha de auditoria.

## Frases-síntese

> O Código Público transforma o bairro em unidade de participação
> democrática, o problema público em issue territorial e a decisão
> institucional em evento auditável.

> O vínculo territorial não é apenas declarado nem imposto: ele é validado,
> contestável, recorrível e auditável.

> Uma cidade, um território-base, um cidadão validado, uma participação
> rastreável.
