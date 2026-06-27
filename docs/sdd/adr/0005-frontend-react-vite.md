<!-- Projeto Desenvolvido na Data Science Academy -->

# ADR-0005 - Frontend: React + Vite + TypeScript

**Status:** Aceito  
**Data:** 2026-06-09

## Contexto

A T3.2 (Admin Dashboard) introduz o frontend (`apps/web`). O dashboard apenas
consome a API REST (login, conversas, mensagens, analytics) e não decide
autorização (`admin-dashboard-spec.md` §4; `constitution.md` §2.2). A
`apps/web/CLAUDE.md` exige registrar o framework via ADR.

## Decisão

Adotar **React 19.x + Vite 7.x + TypeScript 5.x** como SPA para o dashboard (majors fixadas; minor/patch livres).

- roteamento com `react-router-dom` 7.x;
- chamadas HTTP via `fetch` encapsuladas em um cliente que entende o envelope
  `{data, meta, error}` do contrato;
- token JWT em `localStorage`, enviado no header `Authorization`;
- estados de loading, erro, vazio e sucesso em toda tela (`admin-dashboard-spec.md` §4);
- testes com **Vitest** (+ Testing Library quando houver componentes a testar).

## Alternativas Consideradas

- **Next.js**: SSR e roteamento completos, porém peso e complexidade de runtime
  em container desnecessários para um MVP que só consome API.
- **Vue 3 + Vite**: alternativa leve e válida; React foi escolhido por ser o
  ecossistema mais comum no material didático.

## Consequências

Positivas:

- build estático simples, servido por um servidor Node mínimo no container;
- DX rápida com Vite; tipos compartilháveis com o backend no futuro.

Negativas:

- SPA precisa de configuração de runtime (URL da API) injetada na página, já que
  o build do Vite é estático.

## Impacto no Projeto

- O backend passa a habilitar **CORS** (`@fastify/cors`) para a origem do
  dashboard (`APP_BASE_URL`).
- O `apps/web/Dockerfile` é multi-stage: build do Vite e um servidor estático
  Node que injeta a configuração de runtime (`API_BASE_URL`).
- A autorização continua no backend; o frontend usa `permissions` do `/me`
  apenas para esconder ações.
