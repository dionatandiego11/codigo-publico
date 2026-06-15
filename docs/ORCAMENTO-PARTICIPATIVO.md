# Orçamento Participativo — Protocolo Operacional

Este documento define o Orçamento Participativo como eixo principal do Código Público.

O sistema não é apenas uma interface de consulta ou reclamação. Ele é uma infraestrutura para transformar problemas territoriais em decisões orçamentárias rastreáveis, institucionalizadas e fiscalizáveis.

## 1. Tese

```txt
Código Público = infraestrutura pública de Orçamento Participativo municipal
```

A metáfora de GitHub continua existindo por baixo:

- histórico;
- versionamento;
- forks;
- diffs;
- merge institucional;
- release do ciclo;
- audit log.

Mas a experiência cidadã é outra:

```txt
meu território
→ meu problema
→ minha proposta
→ minha votação
→ meu orçamento
→ minha execução
```

## 2. Por que OP

O Orçamento Participativo é o caso de uso mais forte para o Código Público porque:

- conecta participação a dinheiro público real;
- tem rito institucional conhecido;
- dialoga com PPA, LDO e LOA;
- permite medir resultado: recurso destinado, obra executada, território atendido;
- dá chão jurídico para a plataforma;
- desloca o foco de “opinião digital” para decisão pública acompanhável.

A métrica de sucesso não é “mais cliques”.

> A métrica é: o território priorizou, a matriz entrou no orçamento, a execução ocorreu e o ciclo seguinte aprendeu com o resultado.

## 3. Unidade política

O território é a unidade política base.

```txt
bairro
comunidade
distrito
zona rural
região reconhecida pelo município
```

Regra central:

> Cada território reconhecido tem direito a 1 representante territorial.

Não há proporcionalidade populacional nesta primeira versão. A decisão política é equilibrar os territórios de forma direta:

```txt
1 território = 1 representação
```

Essa escolha impede que territórios pequenos desapareçam dentro da média municipal.

## 4. Papéis

### Maintainer Geral

É o Legislativo municipal no rito do OP.

Responsabilidades:

- abrir o ciclo;
- definir calendário, territórios e envelope;
- validar ou indicar Maintainer Técnico;
- abrir inscrições para Maintainer Territorial;
- receber a matriz do OP;
- filtrar impedimentos institucionais com justificativa;
- institucionalizar o resultado na Câmara;
- conectar o OP a PPA, LDO e LOA.

### Maintainer Técnico

Opera infraestrutura.

Responsabilidades:

- deploy;
- banco;
- segurança;
- auditoria;
- logs;
- backup;
- parâmetros aprovados.

Não decide mérito político.

### Maintainer Territorial

Representante temporário de um território.

É escolhido por inscrição e sorteio auditável entre cidadãos vinculados ao território.

Responsabilidades:

- organizar demandas;
- agrupar duplicidades;
- orientar forks;
- pedir complementos;
- validar pertinência territorial;
- conduzir maturação;
- encaminhar propostas aptas para votação.

Não é dono do território.

## 5. Esteira do OP

```txt
0. ciclo aberto
1. cadastro e vínculo territorial
2. inscrição para Maintainer Territorial
3. sorteio
4. demanda recebida
5. engajamento inicial
6. agrupamento ou fork
7. maturação territorial
8. primeiro filtro
9. circuit breaker jurídico-orçamentário
10. demanda apta
11. votação territorial
12. consolidação municipal
13. matriz do OP
14. institucionalização na Câmara
15. merge no PPA/LDO/LOA
16. release do ciclo
17. execução
18. aprendizado
```

## 6. Demanda, proposta, projeto e item institucionalizado

### Demanda

Problema bruto apresentado pelo cidadão.

Exemplo:

> Falta médico no PSF do meu bairro.

### Proposta

Demanda amadurecida em solução possível.

Exemplo:

> Garantir escala mínima de clínico geral no PSF X três vezes por semana.

### Projeto priorizado

Proposta que avançou na votação territorial ou na consolidação municipal.

### Item institucionalizado

Projeto incorporado ao rito formal:

- PPA;
- LDO;
- LOA;
- emenda;
- anexo;
- plano de execução;
- compromisso oficial.

## 7. Maturação

A demanda nasce simples e ganha camadas.

Campos mínimos de entrada:

- problema;
- território;
- local;
- categoria;
- descrição simples;
- foto opcional.

Camadas posteriores:

- apoios;
- não apoios;
- comentários;
- evidências;
- informações faltantes;
- agrupamentos;
- forks;
- filtros;
- histórico.

## 8. Agrupamento e fork

Demandas parecidas podem ser agrupadas.

Soluções diferentes para o mesmo problema viram forks.

Exemplo:

```txt
Demanda original:
Quero uma UTI no PSF do bairro.

Fork A:
ampliar horário de atendimento.

Fork B:
criar sala de estabilização.

Fork C:
reforçar transporte sanitário.

Fork D:
pactuar atendimento com hospital regional.
```

O sistema não ridiculariza a demanda mal formulada. Ele preserva o problema e ajuda a amadurecer alternativas viáveis.

## 9. Filtros

Filtro não é portão único. É camada de maturidade.

### Primeiro filtro territorial

Feito pelo Maintainer Territorial.

Verifica:

- se é do território;
- se é problema público;
- se há informação mínima;
- se é duplicada;
- se precisa de agrupamento;
- se precisa virar fork.

### Circuit breaker jurídico-orçamentário

Feito pelo sistema a partir de regras públicas.

Verifica:

- competência municipal;
- custo maior que o envelope;
- necessidade de faseamento;
- dependência de outro ente federativo;
- vedação constitucional ou legal;
- benefício privado indevido;
- violação de direitos fundamentais.

### Filtro institucional

Feito pelo Maintainer Geral/Legislativo na matriz do OP.

Toda negativa precisa indicar:

- regra que impede;
- custo que inviabiliza;
- incompatibilidade;
- ajuste possível;
- retorno para maturação, fork ou ciclo futuro.

## 10. Retornos da esteira

| Problema | Caminho |
|---|---|
| Falta informação | volta para maturação |
| Demanda duplicada | agrupa |
| Solução divergente | cria fork |
| Fora do território | reterritorializa ou contesta |
| Custo alto | faseia ou vai para ciclo plurianual |
| Fora da competência | vira reivindicação externa |
| Ilegal/inconstitucional | bloqueia com fundamento e permite reformulação quando cabível |
| Sem apoio suficiente | fica dormente para ciclo futuro |
| Recusa institucional | devolve com justificativa auditável |

Regra:

> Toda negativa deve deixar caminho de correção, fork, recurso ou memória pública.

## 11. Votação territorial

A votação ocorre sobre propostas aptas.

O voto individual nunca é exposto.

O resultado público deve ser agregado por:

- território;
- proposta;
- ciclo;
- total de apoios;
- total de votos;
- posição final.

O primeiro modo pode ser votação simples de priorização. Modos futuros podem incluir alocação simbólica de orçamento ou ranking de prioridades.

## 12. Matriz do OP

A matriz do OP consolida:

- propostas priorizadas por território;
- justificativas;
- valores estimados;
- status dos filtros;
- relação com PPA, LDO e LOA;
- itens que avançam;
- itens devolvidos;
- itens para ciclo futuro.

A matriz não pode ser alterada invisivelmente pelo Legislativo.

## 13. Institucionalização

O Legislativo incorpora o que avançar ao rito formal:

- audiência;
- comissão;
- emenda;
- anexo;
- PPA;
- LDO;
- LOA;
- plano de execução;
- publicação oficial.

O sistema registra o caminho institucional.

## 14. Release do ciclo

A release é a versão pública, consolidada e auditável do ciclo.

Ela registra:

- demandas aprovadas;
- propostas priorizadas;
- territórios beneficiados;
- vínculo com PPA, LDO e LOA;
- valores previstos;
- prazos;
- status institucional;
- hashes de auditoria;
- itens de execução;
- divergências e recusas justificadas.

A release não substitui automaticamente o ato oficial publicado.

Se houver divergência entre sistema e ato oficial, o sistema abre incidente público de divergência institucional.

## 15. Execução e aprendizado

Estados de execução:

- não iniciada;
- em planejamento;
- em licitação;
- em execução;
- atrasada;
- paralisada;
- concluída;
- cancelada;
- frustrada.

O aprendizado do ciclo seguinte deve considerar:

- atraso;
- paralisação;
- promessa frustrada;
- demanda dormente;
- território com carência persistente;
- execução concluída.

## 16. Sorteio

O Maintainer Territorial nasce de inscrição e sorteio auditável.

Fluxo:

```txt
Maintainer Geral abre inscrição
→ cidadãos vinculados se inscrevem
→ sistema publica hash da lista elegível
→ sistema usa seed pública
→ sorteia titular e suplentes
→ abre janela de contestação
→ confirma representante
```

Se houver apenas uma pessoa inscrita:

- aclamação condicionada;
- janela pública de contestação;
- checagem de impedimentos;
- mandato provisório ou reduzido, conforme regra local.

Se não houver inscritos:

- território não fica mudo;
- cidadãos continuam abrindo demandas e acompanhando;
- Maintainer Geral faz zeladoria limitada;
- novo convite ativo deve ser aberto.

## 17. Auditoria e blockchain

Blockchain é âncora de integridade, não banco de dados pessoal.

Pode ancorar:

- abertura de ciclo;
- hash da lista do sorteio;
- resultado do sorteio;
- matriz do OP;
- release do ciclo;
- atualizações relevantes de execução.

Nunca deve conter:

- CPF;
- nome completo;
- endereço;
- documento;
- voto individual;
- denúncia identificável;
- dado sensível.

## 18. Decisões pendentes

- duração do mandato territorial;
- limite de mandatos consecutivos;
- quórum de recall;
- regra final para inscrito único;
- regra final para território sem inscritos;
- fórmula do índice de carência;
- tamanho do envelope;
- formato de votação;
- lista de vedações do circuit breaker;
- forma jurídica de entrada no PPA/LDO/LOA;
- efeitos da execução frustrada no próximo ciclo.
