<!-- Projeto Desenvolvido na Data Science Academy -->

# ADR-0003 - Usar Prisma como ORM

**Status:** Aceito  
**Data:** 2026-06-09

## Contexto

A Fase 2 (Backend Core) precisa de uma camada de dados sobre PostgreSQL para
implementar o schema de `database-schema.md` e rodar migrations dentro de
container, conforme `specs/docker-execution-spec.md` §7. A `architecture.md` §6
deixava o ORM em aberto ("Prisma ou Drizzle"), e a `apps/api/CLAUDE.md` exige
registrar a escolha via ADR.

## Decisão

Adotar **Prisma 6.x** como ORM e ferramenta de migrations do backend (versão major fixada para evitar deriva entre sessões assistidas por IA; minor/patch livres).

- schema declarativo único em `apps/api/prisma/schema.prisma`;
- migrations versionadas em `apps/api/prisma/migrations/`;
- `prisma migrate deploy` executado dentro do container da API em ambientes não-dev;
- `prisma migrate dev` usado para gerar migrations em desenvolvimento;
- seed de demonstração (`specs/seed-spec.md`) via mecanismo de seed do Prisma.

## Alternativas Consideradas

- **Drizzle**: SQL-first, leve, sem engine binária. Mais controle e proximidade
  do SQL, porém tooling de migration menos guiado.
- **SQL puro + migrations manuais**: máximo controle, maior custo e mais risco
  de erro humano, sem geração de client tipado.

## Consequências

Positivas:

- schema declarativo único facilita mapear spec → código no fluxo SDD;
- `prisma migrate` cobre geração, aplicação e histórico de migrations;
- client tipado reduz erros de query e combina com TypeScript (ver ADR-0004);
- excelente documentação, adequada ao caráter didático do projeto.

Negativas:

- engine binária do Prisma exige `openssl` na imagem Alpine;
- índice único **parcial** não é expressável de forma declarativa no schema
  (ver `database-schema.md` §3.4) — tratado no nível de aplicação/migration.

## Impacto no Projeto

- Migrations e seeds rodam em container (`docs/sdd/specs/docker-execution-spec.md` §7).
- O acesso ao banco fica atrás de um módulo de infraestrutura
  (`apps/api/src/infra/database/`), conforme `constitution.md` §2.5; repositórios
  por módulo entram nas tasks que os introduzem (T2.4 em diante).
- O filtro por `organizationId` continua sendo responsabilidade explícita de
  services/repositórios e dos testes cross-tenant.
