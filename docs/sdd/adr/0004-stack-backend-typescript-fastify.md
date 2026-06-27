<!-- Projeto Desenvolvido na Data Science Academy -->

# ADR-0004 - Stack do Backend: TypeScript, Fastify e Zod

**Status:** Aceito  
**Data:** 2026-06-09

## Contexto

A `architecture.md` define API REST com módulos claros (auth, organizations,
users, roles, customers, conversations, messages, analytics) e exige guards,
middlewares e validação de entrada (ver `security-spec.md` §6: rejeitar campos
desconhecidos, validar antes da regra de negócio). A `apps/api/CLAUDE.md` deixava
o framework HTTP e a linguagem em aberto, a registrar via ADR. Fixar a stack
antes da Fase 1 evita deriva entre sessões de programação assistida por IA.

## Decisão

Adotar no backend (`apps/api`):

- **Node.js 22 LTS** (imagem oficial) como runtime;
- **TypeScript 5.x** (modo estrito) como linguagem;
- **Fastify 5.x** como framework HTTP;
- **Zod 4.x** para validação de payloads e derivação de tipos de DTO;
- **Vitest 3.x** como runner de testes (decisão de tooling, reversível).

Versões major fixadas para evitar deriva e alucinação de APIs entre sessões assistidas por IA; minor/patch livres dentro da major.

A implementação inicial do servidor HTTP com Fastify ocorre na **T1.1b/T1.2**
(esqueleto + `GET /api/v1/health`); os módulos de domínio entram nas tasks da
Fase 2.

## Alternativas Consideradas

- **NestJS**: opinativo e modular, guards/DI prontos, porém mais peso e curva de
  aprendizado para um projeto didático.
- **Express**: o mais difundido e simples, mas exige montar validação e estrutura
  manualmente, com menos guard-rails.
- **JavaScript puro**: dispensa build, mas perde tipos para DTOs/contratos e a
  integração tipada com Prisma e `packages/api-contracts`.

## Consequências

Positivas:

- validação de primeira classe com Zod atende `security-spec.md` §6;
- tipos compartilháveis com o frontend via `packages/api-contracts` (futuro);
- Fastify é leve, rápido e com pouca "mágica", bom para ensino;
- Vitest roda TypeScript nativamente, sem etapa extra de transpile nos testes.

Negativas:

- introduz etapa de build (`tsc`) e tooling de tipos na imagem;
- exige multi-stage build na imagem da API (deps → build → runtime).

## Impacto no Projeto

- `apps/api` nasce em TypeScript com build via `tsc`.
- O `Dockerfile` da API é multi-stage, gerando o Prisma Client e compilando
  TypeScript antes do runtime.
- Testes oficiais executam em container
  (`docs/sdd/specs/docker-execution-spec.md` §8; `.claude/rules/testing.md`).
