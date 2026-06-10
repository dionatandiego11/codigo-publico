# Features

Cada pasta em `features/` representa uma área funcional do Código Público.

Regra desta camada:

- componentes de tela e componentes específicos da área ficam dentro da própria feature;
- exports públicos da feature passam pelo `index.ts`;
- imports compartilhados devem usar `@/src/...` para evitar caminhos relativos frágeis;
- mocks ainda podem existir durante a migração, mas devem ser consumidos pela camada de app/API sempre que possível.

Estrutura atual:

```text
features/
  admin/
  citizen-area/
  civic-prs/
  executions/
  home/
  issues/
  open-data/
  organic-law/
  releases/
  repositories/
  territories/
```
