<!-- Projeto Desenvolvido na Data Science Academy -->

# SDD - Índice dos Artefatos do Projeto 1

Esta pasta contém os artefatos de Spec-Driven Development usados para orientar a implementação do SaaS de Atendimento ao Cliente.

Use estes documentos como fonte de verdade para conduzir o Claude Code:

1. ler contexto;
2. identificar lacunas;
3. propor plano;
4. implementar em fatias pequenas;
5. testar;
6. revisar contra critérios de aceite.

## Artefatos Centrais

- [Constitution](constitution.md)
- [Spec Template](spec-template.md)
- [Product Brief](product-brief.md)
- [Requirements](requirements.md)
- [Architecture](architecture.md)
- [Domain Model](domain-model.md)
- [API Contract](api-contract.md)
- [OpenAPI Contract](openapi.yaml)
- [Database Schema](database-schema.md)
- [Security Spec](security-spec.md)
- [Test Plan](test-plan.md)
- [Implementation Plan](implementation-plan.md)
- [Tasks](tasks.md)
- [Acceptance Criteria](acceptance-criteria.md)
- [Traceability Matrix](traceability-matrix.md)
- [Build Playbook](build-playbook.md)

## ADRs

- [ADR-0001 - Usar Monorepo Full Stack](adr/0001-monorepo-full-stack.md)
- [ADR-0002 - Multi-Tenancy Por OrganizationId](adr/0002-multi-tenancy-por-organization-id.md)
- [ADR-0003 - Usar Prisma como ORM](adr/0003-orm-prisma.md) _(proposta)_
- [ADR-0004 - Stack do Backend: TypeScript, Fastify e Zod](adr/0004-stack-backend-typescript-fastify.md) _(proposta)_
- [ADR-0005 - Frontend: React + Vite + TypeScript](adr/0005-frontend-react-vite.md) _(proposta)_
- [ADR-0006 - Execução 100% em Docker](adr/0006-execucao-100-docker.md)

## Specs Específicas

- [Auth Spec](specs/auth-spec.md)
- [Authorization Spec](specs/authorization-spec.md)
- [User Management Spec](specs/user-management-spec.md)
- [Conversation History Spec](specs/conversation-history-spec.md)
- [Analytics Spec](specs/analytics-spec.md)
- [Admin Dashboard Spec](specs/admin-dashboard-spec.md)
- [Docker Execution Spec](specs/docker-execution-spec.md)
- [Deployment Spec](specs/deployment-spec.md)
- [Seed Spec](specs/seed-spec.md)

## Prompt Inicial Recomendado

```text
Leia docs/sdd/README.md, constitution.md, product-brief.md, requirements.md, architecture.md, implementation-plan.md e tasks.md. Resuma o produto, a arquitetura, o MVP e a próxima menor task implementável. Não escreva código ainda.
```
