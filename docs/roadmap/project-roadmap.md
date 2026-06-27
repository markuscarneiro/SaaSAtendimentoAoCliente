<!-- Projeto Desenvolvido na Data Science Academy -->

# Project Roadmap - SaaS de Atendimento ao Cliente

Este roadmap dá a visão de alto nível da construção do projeto. O detalhamento canônico está em `docs/sdd/implementation-plan.md`, `docs/sdd/tasks.md` e `docs/sdd/build-playbook.md`.

O fluxo base é:

```text
Constitution -> Spec -> Plan -> Tasks -> Implementação -> Testes -> Revisão -> Evolução
```

O projeto é full stack (API + dashboard), com ênfase no backend, **sem IA ou RAG**. Execução 100% Docker.

## 1. Fundação SDD

Consolidar documentação, contexto persistente e execução com Claude Code (`CLAUDE.md`, `.claude/`, artefatos em `docs/sdd`).

Pronto quando: estrutura SDD navegável e próxima task clara.

## 2. Setup Full Stack (Fase 1)

Base executável do monorepo: `apps/api`, `apps/web`, Dockerfiles, `docker-compose.yml` (api, web, postgres, redis), `.env.example`, healthchecks.

Pronto quando: `docker compose up --build` sobe o ambiente sem runtime no host.

## 3. Backend Core (Fase 2)

Schema e domínio, autenticação (Bearer JWT), autorização por papéis, multi-tenancy, clientes, conversas, mensagens, atribuição e status.

Pronto quando: fluxo de conversa funciona via API com permissões e isolamento por organização testados.

## 4. Analytics e Dashboard (Fase 3)

Endpoints de analytics de atendimento (status, tempo de primeira resposta, por atendente) e dashboard administrativo consumindo a API real.

Pronto quando: fluxo ponta a ponta demonstrável.

## 5. DevOps e Deploy (Fase 4)

CI containerizado (lint, typecheck, tests, build de imagens) e deploy com migrations e smoke tests em container, sem segredos no repo.

Pronto quando: pipeline valida PRs e deploy containerizado é executável.

## 6. Revisão Final

Revisar implementação contra `acceptance-criteria.md` e `traceability-matrix.md`; documentar pendências e evolução.

**Versão:** 1.0  
**Status:** Proposta  
**Owner:** Equipe do projeto  
**Última atualização:** 2026-06-03
