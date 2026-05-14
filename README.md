# React + VIACEP Cadastro com MongoDB e SQLite

Projeto em React que integra com a API VIACEP, preenche um formulário de endereço editável e salva registros com nome, CPF e e-mail usando MongoDB ou SQLite.

## Funcionalidades

- Busca de endereço usando API ViaCEP
- Formulário de cadastro editável com validação
- Persistência em dois bancos de dados:
  - MongoDB (não relacional)
  - SQLite (relacional)
- Seleção dinâmica do tipo de armazenamento pelo usuário
- Rotas CRUD para registros

## Como usar

1. Instale dependências:
   ```bash
   npm install
   ```
2. Crie um arquivo `.env` a partir de `.env.example`:
   ```bash
   copy .env.example .env
   ```
3. Ajuste as variáveis de ambiente conforme necessário:
   - `MONGO_URI` para conexão MongoDB
   - `DB_TYPE` para definir o banco padrão no backend (`mongodb` ou `sqlite`)
   - `VITE_DEFAULT_DB` para definir o banco padrão no frontend
4. Inicie o projeto:
   ```bash
   npm run dev
   ```
5. Abra no browser em `http://localhost:5173`.

## Uso

- Selecione o banco de dados na interface (`MongoDB` ou `SQLite`).
- O frontend envia a escolha para a API usando o parâmetro `db`.
- As operações CRUD funcionam independentemente do banco selecionado.

## Backend

- `server/index.js` — servidor Express, lógica de escolha de banco e rotas CRUD
- `server/storage.js` — abstração de armazenamento para MongoDB e SQLite
- `server/models/Registration.js` — esquema Mongoose para MongoDB

## Frontend

- `src/App.jsx` — interface principal, seleção de banco e chamadas à API
- `src/main.jsx` — entrada do aplicativo React
- `src/styles.css` — estilos da interface

## Observações

- O SQLite cria o arquivo `server/data/db.sqlite` automaticamente.
- Se o MongoDB estiver indisponível, a aplicação ainda pode funcionar usando SQLite.
