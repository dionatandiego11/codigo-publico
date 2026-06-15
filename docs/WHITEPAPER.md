# Código Público — Whitepaper

## Uma infraestrutura aberta e auditável de Orçamento Participativo

O Código Público é uma plataforma livre para transformar problemas de bairros, comunidades e distritos em decisões orçamentárias rastreáveis.

Ele usa princípios de software versionado como infraestrutura institucional: histórico, estados, forks, auditoria, merge e release. Mas a experiência cidadã é simples:

```txt
meu território
→ meu problema
→ minha proposta
→ minha votação
→ meu orçamento
→ minha execução
```

## Resumo

O Código Público organiza o Orçamento Participativo municipal como uma esteira pública:

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

A meta não é apenas aumentar participação digital. A meta é saber:

> O território decidiu? O orçamento incorporou? A execução aconteceu? O próximo ciclo aprendeu?

## 1. O problema

A participação municipal costuma morrer em três lugares:

- antes de entrar no orçamento;
- dentro de uma triagem invisível;
- depois da aprovação, sem execução acompanhável.

O cidadão não sabe onde sua demanda está, quem filtrou, por que não avançou, se entrou na LOA ou se virou obra.

O Código Público responde com uma linha de produção pública, auditável e contestável.

## 2. A ideia

O sistema aceita que o cidadão comece pelo problema simples.

Exemplos:

- falta médico no PSF;
- estrada rural sem manutenção;
- praça sem iluminação;
- transporte escolar irregular;
- ponte quebrada;
- demanda de saneamento.

A demanda nasce simples e amadurece por camadas: apoio, comentários, agrupamento, fork, filtro, votação, matriz, institucionalização e execução.

## 3. Território como unidade política

O território é a base do OP.

```txt
bairro
comunidade
distrito
zona rural
```

Regra:

```txt
1 território = 1 representante
```

O objetivo é impedir que comunidades pequenas ou periféricas desapareçam dentro da média da cidade.

## 4. Quem é quem

| Papel | Quem é | Pode | Não pode |
|---|---|---|---|
| Maintainer Geral | Legislativo municipal | abrir ciclo, receber matriz, institucionalizar no PPA/LDO/LOA | vetar invisivelmente |
| Maintainer Técnico | TI indicada/validada institucionalmente | operar infraestrutura | decidir mérito político |
| Maintainer Territorial | cidadão sorteado do território | organizar demandas, maturar, filtrar com justificativa | ser dono do território |
| Cidadão Territorial | pessoa com vínculo territorial validado | demandar, apoiar, votar, fiscalizar | expor voto individual |

## 5. Sorteio territorial

Cada território tem 1 Maintainer Territorial.

O fluxo é:

```txt
inscrição aberta
→ cidadãos vinculados se candidatam
→ sistema publica hash da lista elegível
→ sorteio com seed pública
→ janela de contestação
→ confirmação do representante
```

Se houver apenas uma pessoa inscrita, a posse deve ser condicionada a publicação, checagem de impedimentos e janela de contestação.

Se não houver inscritos, o território não fica mudo: cidadãos continuam criando demandas e acompanhando; o Maintainer Geral faz zeladoria limitada e novo convite ativo é aberto.

## 6. Filtros sem burocracia invisível

O sistema não coloca especialista como porteiro.

Filtros são regras públicas com retorno:

| Situação | Caminho |
|---|---|
| Falta informação | volta para maturação |
| Duplicidade | agrupa |
| Solução alternativa | fork |
| Custo alto | faseia ou ciclo plurianual |
| Fora da competência municipal | reivindicação externa |
| Ilegal ou inconstitucional | bloqueio fundamentado e reformulação quando cabível |

Toda negativa precisa explicar o motivo e deixar caminho.

## 7. Votação e matriz

Somente propostas maduras e aptas vão à votação territorial.

Depois, as prioridades dos territórios formam a matriz municipal do OP:

- propostas priorizadas;
- território beneficiado;
- valor estimado;
- status dos filtros;
- justificativas;
- vínculo com PPA, LDO e LOA;
- itens que avançam;
- itens devolvidos.

## 8. Institucionalização

O Código Público não substitui a Câmara nem o rito orçamentário.

Ele entrega uma matriz auditável para que o Legislativo incorpore o resultado em:

- audiência;
- comissão;
- emenda;
- anexo;
- PPA;
- LDO;
- LOA;
- plano de execução.

O Legislativo é o Maintainer Geral do rito, mas não pode ser uma caixa preta. Toda alteração ou recusa deve ser justificada.

## 9. Release do ciclo

A release é a versão pública consolidada do ciclo de OP.

Ela registra:

- demandas aprovadas;
- propostas priorizadas;
- territórios beneficiados;
- valores;
- prazos;
- vínculo institucional;
- hashes de auditoria;
- execução;
- divergências.

A release não substitui o ato oficial publicado. Se houver divergência, o sistema abre incidente público.

## 10. Execução e aprendizado

Cada item aprovado vira execução fiscalizável.

Estados possíveis:

- não iniciada;
- em planejamento;
- em licitação;
- em execução;
- atrasada;
- paralisada;
- concluída;
- cancelada;
- frustrada.

A frustração precisa gerar memória e afetar o próximo ciclo.

## 11. Confiança sem exposição

O sistema audita sem expor pessoas.

Blockchain e Diário Oficial servem como âncoras de integridade.

Pode ser ancorado:

- hash da lista elegível do sorteio;
- hash do resultado;
- matriz do OP;
- release do ciclo;
- eventos relevantes de execução.

Nunca deve ser ancorado:

- CPF;
- endereço;
- documento;
- voto individual;
- denúncia identificável;
- dado sensível.

## 12. Sucesso

O sucesso do Código Público deve ser medido por:

- territórios com vínculo ativo;
- demandas maduras;
- propostas votadas;
- matriz incorporada ao orçamento;
- execução concluída;
- atrasos justificados;
- divergências registradas;
- ciclo seguinte aprendendo com o anterior.

## 13. Frase final

O Código Público não é apenas um app para votar.

É uma infraestrutura municipal para transformar necessidade territorial em orçamento público, execução e memória democrática.
