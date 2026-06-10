# Código Público

Documentação conceitual inicial da plataforma **Código Público**.

O Código Público é uma plataforma open source de democracia direta municipal inspirada na lógica de colaboração do GitHub. A proposta é tornar a vida normativa do município mais legível, auditável e participativa, permitindo que cidadãos, técnicos e agentes públicos acompanhem problemas, debatam soluções, proponham alterações legais e fiscalizem a execução das decisões aprovadas.

## Ideia Central

O projeto trata o município como um **sistema operacional cívico**.

Nesse modelo, a Lei Orgânica funciona como o kernel jurídico da cidade. Leis municipais, planos, orçamentos, políticas públicas e atos administrativos passam a ser visualizados como partes versionadas de um sistema vivo, sujeito a problemas, propostas, revisões, aprovação, publicação e fiscalização.

A metáfora não pretende reduzir o direito a software. Ela serve para aproximar a cidadania dos processos normativos, criando uma linguagem visual e operacional mais compreensível:

- problemas públicos viram issues;
- lacunas normativas viram issues normativas;
- propostas de emenda viram PRs cívicos;
- alterações textuais viram commits;
- comparações de redação viram diffs normativos;
- pareceres técnicos, jurídicos e populares viram reviews;
- aprovações formais viram merges institucionais;
- textos consolidados viram branch principal;
- novas versões da lei viram releases legislativas;
- cumprimento das decisões vira fiscalização de execução.

## Mapa Conceitual

| Governo municipal | Código Público |
| --- | --- |
| Município | Sistema operacional cívico |
| Lei Orgânica | Kernel jurídico |
| Leis municipais | Módulos normativos |
| PPA, LDO e LOA | Runtime orçamentário |
| Políticas públicas | Serviços públicos |
| Problemas públicos | Issues |
| Lacunas normativas | Issues normativas |
| Propostas de emenda | PRs cívicos |
| Alterações textuais | Commits |
| Comparação de texto | Diff normativo |
| Parecer jurídico ou técnico | Review |
| Aprovação formal | Merge institucional |
| Texto consolidado | Branch principal |
| Nova versão da lei | Release legislativa |
| Fiscalização | Acompanhamento da execução |

## Problema

A participação municipal costuma ser fragmentada, burocrática e pouco compreensível para a maioria da população. Em geral, o cidadão encontra barreiras para responder perguntas simples:

- qual texto da Lei Orgânica está vigente agora?
- quais artigos foram alterados?
- por que uma alteração foi proposta?
- que problema público originou determinada proposta?
- quem analisou juridicamente, tecnicamente ou orçamentariamente a mudança?
- como comparar o texto vigente com o texto proposto?
- quais propostas estão em votação?
- uma norma aprovada foi de fato executada?
- onde está o histórico consolidado das decisões?

O Código Público organiza essas respostas em uma interface única, versionada e orientada a fluxo.

## Ciclo Principal

O fluxo central do produto é:

```text
Lei Orgânica vigente
-> artigo comentável
-> issue pública ou normativa
-> PR cívico
-> diff normativo
-> reviews técnicos, jurídicos e populares
-> verificações institucionais
-> votação
-> merge institucional
-> release legislativa
-> fiscalização da execução
```

Esse ciclo conecta diagnóstico, proposta, deliberação, formalização e controle social.

## Públicos

### Cidadãos

Pessoas que desejam entender seus direitos, apontar problemas, comentar artigos, apoiar demandas, votar em consultas e fiscalizar execução.

### Técnicos e Especialistas

Profissionais que analisam viabilidade, impacto operacional, compatibilidade jurídica, impacto orçamentário, dados públicos e riscos de execução.

### Agentes Públicos

Vereadores, servidores, procuradorias, controladorias e secretarias que precisam receber demandas, revisar propostas, registrar pareceres, encaminhar votações e consolidar normas.

### Sociedade Civil Organizada

Associações, coletivos, observatórios sociais, conselhos municipais e movimentos que podem abrir issues, propor PRs cívicos e acompanhar releases legislativas.

## Módulos Funcionais

### Lei Orgânica Versionada

Consulta estruturada da Lei Orgânica municipal, com artigos, capítulos, versões, comentários e modo de leitura simplificado.

Funcionalidades esperadas:

- listar artigos vigentes;
- buscar por tema, artigo ou termo jurídico;
- alternar entre texto técnico e explicação cidadã;
- ver histórico de alterações;
- abrir debate em artigo específico;
- iniciar proposta de alteração a partir de um artigo.

### Issues Públicas

Registro e acompanhamento de problemas públicos, falhas de execução, pedidos de transparência, inconsistências orçamentárias e lacunas normativas.

Tipos previstos:

- problema público;
- lacuna normativa;
- falha de execução;
- inconsistência orçamentária;
- sugestão de melhoria;
- pedido de transparência.

Uma issue pode estar vinculada a território, tema, órgão responsável, artigo da lei e PR cívico.

### PRs Cívicos

Propostas de alteração normativa inspiradas em pull requests. Cada PR cívico descreve o que muda, por que muda, qual texto será alterado e quais issues pretende resolver.

Um PR cívico pode conter:

- resumo cidadão;
- justificativa jurídica, social ou técnica;
- artigos afetados;
- diff normativo;
- issues vinculadas;
- comentários públicos;
- reviews;
- checks institucionais;
- votação;
- linha do tempo até o merge institucional.

### Diff Normativo

Visualização comparativa entre texto vigente e texto proposto.

O objetivo é permitir que qualquer pessoa veja, de forma clara:

- o que está sendo adicionado;
- o que está sendo removido;
- qual artigo será afetado;
- qual a justificativa da alteração;
- quais riscos ou ressalvas aparecem nos reviews.

### Reviews e Pareceres

Camada de análise pública, jurídica, técnica, orçamentária e institucional.

Exemplos de revisão:

- revisão popular;
- revisão jurídica;
- revisão técnica;
- revisão orçamentária;
- controladoria;
- comissão legislativa.

### Verificações Institucionais

Checks simulados ou reais que avaliam admissibilidade e riscos da proposta.

Exemplos:

- compatibilidade com a Constituição Federal;
- compatibilidade com a Constituição Estadual;
- competência municipal;
- impacto orçamentário;
- proteção de dados pessoais;
- necessidade de quórum qualificado.

### Votações

Módulo de consulta ou deliberação popular para PRs cívicos qualificados.

Funcionalidades esperadas:

- resumo da medida em linguagem simples;
- argumentos favoráveis e contrários;
- prazo de votação;
- quórum necessário;
- comprovante criptográfico ou protocolo de participação;
- integração futura com identidade digital válida.

### Releases Legislativas

Registro das novas versões consolidadas das normas após aprovação formal.

Cada release deve indicar:

- versão;
- data;
- norma afetada;
- changelog;
- PRs incorporados;
- artigos alterados;
- documento oficial;
- autoridade ou órgão promulgador.

### Fiscalização de Execução

Acompanhamento do cumprimento prático daquilo que foi aprovado.

Esse módulo responde a uma pergunta essencial: depois do merge institucional, a decisão saiu do papel?

Pode acompanhar:

- órgão responsável;
- prazo;
- status de execução;
- percentual de progresso;
- dotação orçamentária;
- gasto realizado;
- evidências;
- atualizações oficiais;
- denúncias de descumprimento.

### Meu Território

Recorte territorial da participação cívica. Permite visualizar issues, PRs, votações e execuções que afetam diretamente um bairro, distrito ou zona municipal.

### Minha Área

Painel pessoal do cidadão, com suas issues, votos, comprovantes e participações.

### Dados Públicos

Painel de transparência operacional com métricas agregadas, status dos repositórios normativos e exportação futura de bases abertas.

### Admin e Triagem

Console administrativo para simular ou operar fluxos internos:

- triagem de issues;
- alteração de status;
- envio de PR para votação;
- merge institucional;
- execução de checks;
- consolidação de releases.

## Princípios

### Clareza Pública

Toda pessoa deve conseguir entender o que uma norma faz, por que ela existe e como ela pode mudar.

### Versionamento Institucional

Alterações legais devem ter histórico, autoria, justificativa, diff e rastreabilidade.

### Participação Estruturada

A opinião popular deve sair do comentário solto e entrar em fluxos verificáveis de diagnóstico, proposta, revisão e decisão.

### Auditabilidade

Cada etapa relevante precisa deixar trilha: issue, PR, review, voto, merge, release e fiscalização.

### Linguagem Dupla

O sistema deve preservar o texto jurídico técnico, mas oferecer uma camada de explicação cidadã acessível.

### Integridade Institucional

A plataforma não substitui automaticamente o rito legal. Ela organiza, qualifica e torna auditável a participação e a tramitação.

## Estado Atual do Protótipo

O front-end atual é um protótipo React com dados mockados em memória.

Ele já contém telas para:

- página inicial;
- Lei Orgânica;
- detalhe de artigo;
- issues;
- PRs cívicos;
- votações;
- releases;
- fiscalização;
- repositórios;
- meu território;
- minha área;
- dados públicos;
- painel administrativo.

O roteamento é controlado por estado local no componente principal. Ainda não há persistência real, autenticação, backend integrado ou banco de dados.

## Estrutura Atual do Front-end

```text
src/
  App.tsx
  main.tsx
  types.ts
  index.css
  lib/
    mock-data.ts
    api.ts
  components/
    Navbar.tsx
    HomeView.tsx
    OrganicLawViewer.tsx
    ArticleDetailView.tsx
    IssueTracker.tsx
    CivicPRHub.tsx
    ReleasesView.tsx
    FiscalizacaoView.tsx
    RepositoryHub.tsx
    MeuTerritorioView.tsx
    MinhaAreaView.tsx
    DadosPublicosView.tsx
    AdminPanel.tsx
```

## Executando Localmente

Pré-requisitos:

- Node.js
- npm

Instale as dependências:

```bash
npm install
```

Execute o servidor de desenvolvimento:

```bash
npm run dev
```

Por padrão, o Vite sobe em:

```text
http://localhost:3000
```

Para checagem de tipos:

```bash
npm run lint
```

## Horizonte de Evolução

Possíveis próximas etapas:

- substituir roteamento manual por roteamento real;
- persistir issues, PRs, votos e releases;
- separar melhor estado de sessão e dados públicos;
- criar backend para normas versionadas;
- implementar diff normativo real;
- modelar fluxo institucional de revisão;
- integrar identidade digital;
- criar papéis e permissões;
- registrar logs auditáveis;
- expor dados em API pública;
- conectar fiscalização a evidências reais.

## Licença

O protótipo declara licença Apache 2.0 nos arquivos-fonte atuais. A definição final da licença do projeto deve ser formalizada em arquivo próprio de licença.
