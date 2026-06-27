<!-- Projeto Desenvolvido na Data Science Academy -->

# Build Playbook - Construindo o Projeto com Claude Code

## 1. Objetivo

Guia operacional para implementar o SaaS de Atendimento ao Cliente em sessões do Claude Code, a partir dos artefatos SDD já existentes.

Não substitui as specs. É o roteiro de execução: por onde começar, em que ordem, com quais skills/agents e como saber que uma fatia está pronta.

Fontes de verdade que este playbook apenas orquestra: `constitution.md`, `requirements.md`, `architecture.md`, `api-contract.md`, `openapi.yaml`, `tasks.md`, `acceptance-criteria.md`, `test-plan.md` e `traceability-matrix.md`.

## 2. Pré-requisitos no host

- Docker e Docker Compose v2;
- Git;
- Claude Code (ou editor).

Nada além disso. Node.js, PostgreSQL e Redis rodam apenas em containers (RNF-007 / ADR-0006 / `specs/docker-execution-spec.md`).

## 3. Princípios inegociáveis (valem em toda task)

- Backend é a fonte de verdade das regras de negócio.
- Toda entidade e query de domínio considera `organizationId`; testar tentativa cross-tenant.
- Não alterar `api-contract.md`/`openapi.yaml` sem confirmação; se mudar, atualizar os dois juntos (eles são espelhados).
- Execução, migrations, testes e smoke tests rodam em container.
- Uma skill por task. Usar somente `.claude/skills/`; `skills/` é referência documental.
- Não criar pastas vazias antecipadamente. Cada pasta de código é criada sob demanda pela task que a introduz, seguindo `architecture.md` (§7 módulos) e o `CLAUDE.md` local de cada app.

## 4. Como iniciar cada sessão

Prompt de abertura (carrega contexto sem codar):

```text
Leia docs/sdd/README.md, constitution.md, requirements.md, architecture.md,
api-contract.md, traceability-matrix.md e tasks.md.
Resuma o produto, a arquitetura e a próxima task pendente em tasks.md.
Não escreva código ainda.
```

O `tasks.md` é o ponteiro de estado entre sessões: `[ ]` pendente, `[~]` em andamento, `[x]` concluída, `[!]` bloqueada.

## 5. Loop padrão por task

Toda task segue: **ler specs -> planejar -> implementar -> testar -> revisar.**

| Etapa | Ferramenta | Como acionar |
|---|---|---|
| Planejar | agent `planner` ou skill `plan` | "Use o planner para transformar a task <ID> em plano técnico. Não altere código." |
| Implementar | agent `implementer` + skill da área | "Siga `.claude/skills/<skill>/SKILL.md` e implemente <ID>. Apresente o plano antes." |
| Testar | skill `test-writer` | "Crie testes conforme `test-plan.md`: sucesso, erro, permissão, tenant." |
| Revisar | agents `code-reviewer` + `security-reviewer` | "Revise <ID> contra specs e critérios de aceite." |

Skill por área: `auth-authorization`, `backend-endpoint`, `frontend-dashboard`, `devops-deploy`, `database-migration`, `api-contract-review`, `security-review`.

## 6. Sequência de fases

Siga a ordem de `tasks.md`; ela já respeita as dependências. Em cada task, carregue apenas as specs listadas naquela task (controle de contexto).

### Fase 0 - Preparação SDD (T0.1, T0.2)
Validar estrutura SDD e instruções do Claude. Confirmar que `CLAUDE.md` referencia `constitution.md` e a regra de ler specs antes de codar.

### Fase 1 - Setup 100% Docker (T1.1, T1.2) — gargalo inicial
Specs: `architecture.md`, `specs/docker-execution-spec.md`, `specs/deployment-spec.md`, `database-schema.md`.
Entregar: `docker-compose.yml` (api, web, postgres, redis), Dockerfiles multi-stage, `.env.example`, `GET /api/v1/health`, healthchecks.
Stack proposta nos ADRs 0003 (Prisma), 0004 (TypeScript + Fastify + Zod) e 0005 (React + Vite) — **confirmar o status dos ADRs antes de iniciar a fase**. Executar T1.1 nas fatias a/b/c.
Gate: `docker compose up --build` sobe todos os serviços com healthcheck verde, sem runtime no host.

### Fase 2 - Backend Core (T2.1 a T2.7)
- T2.1 schema/migrations (skill `database-migration`): organizations, users, members, customers, conversations, messages; índices; `organizationId` em todas as entidades.
- T2.2 auth (skill `auth-authorization`): register-organization, login com rate limit (`security-spec.md` §8), `/me`. Token Bearer JWT apenas (`api-contract.md` §3, `auth-spec.md` §3.2.1).
- T2.3 autorização: matriz de permissões (inclui `users.read`), guard/middleware, cross-tenant negado (`specs/authorization-spec.md`).
- T2.4 conversas e mensagens (skill `backend-endpoint`): criar/listar/detalhar/mensagem, histórico paginado (`GET /conversations/:id/messages`), regras de autoria (§4.0.2) e resolução de customer (`specs/conversation-history-spec.md` §4.1).
- T2.5 atribuição e status: `PATCH /conversations/:id`, tabela de transições (§4.0.1), `conversations.manage`.
- T2.6 gestão de usuários (skill `backend-endpoint` ou `auth-authorization`): criar/listar/alterar membros (`specs/user-management-spec.md`).
- T2.7 seed de demonstração (`specs/seed-spec.md`): idempotente, em container.

### Fase 3 - Analytics e Dashboard (T3.1, T3.2)
- T3.1 analytics backend (`specs/analytics-spec.md` §4.1 — fórmulas): overview por organização e período (status, tempo de primeira resposta, por atendente).
- T3.2 dashboard MVP (skill `frontend-dashboard`): login, lista/detalhe de conversa, mensagem, atribuição/status, métricas; consumir contratos reais; estados de loading/erro/vazio/sucesso; não duplicar regra de negócio.

### Fase 4 - DevOps e Deploy (T4.1, T4.2)
Skill `devops-deploy`. CI containerizado (lint, typecheck, tests, build de imagens) e deploy/migrations/smoke tests em container, sem segredos no repo.

## 7. Gate de "pronto" por task

Antes de marcar `[x]` em `tasks.md`, confirme a Definição de Pronto do `CLAUDE.md`:

- spec correspondente consultada;
- plano foi apresentado;
- escopo da task respeitado;
- testes relevantes criados/atualizados (sucesso, erro, permissão, tenant) e passando **em container**;
- validações disponíveis executadas;
- critérios de aceite de `acceptance-criteria.md` revisados;
- linha correspondente da `traceability-matrix.md` coberta;
- pendências documentadas.

## 8. Cadência entre sessões

- Uma branch por fatia (ex.: `feat/t2.2-auth`); commit ao fim de cada task verde.
- Atualizar status em `tasks.md` ao iniciar (`[~]`) e concluir (`[x]`).
- Registrar decisões técnicas relevantes como ADR em `docs/sdd/adr/` (ex.: framework, ORM).
- Próxima sessão: prompt do §4 + "qual a próxima task pendente em tasks.md?".

## 9. Riscos a vigiar

- Pular a Fase 1: sem o esqueleto Docker, todas as demais tasks travam.
- Deriva de contrato: mudanças de payload exigem atualizar `api-contract.md` + `openapi.yaml` juntos, com confirmação.
- Custo de contexto: carregar specs em excesso por task; prefira as specs listadas na task.
- Vazamento cross-tenant: filtro por `organizationId` obrigatório e coberto por teste.

## 10. Como Usar Este Documento com IA

```text
Leia docs/sdd/build-playbook.md e tasks.md. Escolha a próxima task pendente,
diga a fase, as specs a ler, a skill/agent a usar e o critério de pronto.
Apresente o plano antes de implementar.
```

**Versão:** 1.1  
**Status:** Proposta  
**Owner:** Equipe do projeto  
**Última atualização:** 2026-06-09  
**Substitui:** N/A
