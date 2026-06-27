<!-- Projeto Desenvolvido na Data Science Academy -->

# CLAUDE.md - apps/api

Contexto local do backend.

- Leia `docs/sdd/constitution.md`, `docs/sdd/api-contract.md`, `docs/sdd/openapi.yaml`, `docs/sdd/domain-model.md`, `docs/sdd/database-schema.md` e `docs/sdd/security-spec.md` antes de implementar endpoints.
- Para comandos, migrations e testes, siga `docs/sdd/specs/docker-execution-spec.md`.
- Regras de negócio, autorização, tenant, custo e rastreabilidade ficam no backend.
- Toda entidade operacional deve respeitar `organizationId`.
- Controllers/routes devem ser finos; regras ficam em services/use cases.
- Testes devem cobrir sucesso, erro, permissão e cross-tenant quando aplicável.

## Estrutura-alvo

As pastas abaixo ainda não existem; crie-as sob demanda na task que as introduz (não pré-crie pastas vazias). Módulos seguem `architecture.md` §7; infra segue §3/§8. Framework HTTP e ORM estão propostos nos ADRs 0004 (TypeScript + Fastify + Zod) e 0003 (Prisma) — confirme o status dos ADRs antes da Fase 1.

```text
apps/api/
  Dockerfile
  package.json
  src/
    modules/        # auth, organizations, users, roles, customers,
                    # conversations, messages, analytics
    infra/          # database, cache, observability
    common/         # guards, middlewares, validators, errors, decorators, types
    config/
    tests/
  prisma/           # ou equivalente do ORM escolhido (inclui migrations)
```
