# Código Público Front

Front-end React/Vite para a plataforma Código Público. A aplicação consome a API Go em `/api/v1` e mantém dados locais de demonstração como fallback quando o backend não está disponível.

## Estrutura

- `src/app`: shell visual, cabeçalho e navegação principal.
- `src/auth`: sessão, login e persistência do token.
- `src/features`: módulos de domínio da experiência, como orçamento participativo, conselho, auditoria e execução.
- `src/shared`: infraestrutura reutilizável, cliente HTTP e tipos de domínio.
- `src/demo`: massa inicial usada como fallback local.

## Rodando localmente

1. Instale as dependências:
   `npm install`
2. Configure a API:
   `cp .env.example .env`
3. Ajuste `VITE_API_URL` se o backend estiver em outra porta.
4. Inicie o front:
   `npm run dev`

## Scripts

- `npm run dev`: inicia o Vite em `http://localhost:3000`.
- `npm run lint`: valida TypeScript sem emitir arquivos.
- `npm run build`: gera a versão de produção em `dist`.
