<!-- Projeto Desenvolvido na Data Science Academy -->

# Tasks - Projeto 1

**Versão:** 1.1  
**Status:** Proposta  
**Owner:** Equipe do projeto  
**Última atualização:** 2026-06-09  
**Substitui:** N/A

## 1. Objetivo

Este arquivo quebra o `implementation-plan.md` em unidades executáveis pequenas para Claude Code.

Cada task deve ser implementada isoladamente, revisada contra specs e validada com testes ou checagens equivalentes.

O mapeamento entre requisitos (`RF-xxx`/`RNF-xxx`), tasks, critérios de aceite e áreas de teste está em `docs/sdd/traceability-matrix.md`.

## 2. Convenção

Status:

- `[ ]` pendente;
- `[~]` em andamento;
- `[x]` concluída;
- `[!]` bloqueada.

Cada task deve seguir:

```text
Ler specs -> planejar -> implementar -> testar -> revisar.
```

## 3. Fase 0 - Preparação SDD

### T0.1 - Validar Estrutura SDD

- [ ] Ler `constitution.md`, `README.md`, `implementation-plan.md`.
- [ ] Conferir se `docs/sdd`, `docs/sdd/specs`, `docs/sdd/adr`, `docs/prompts` e `.claude` existem.
- [ ] Atualizar índices se necessário.

Critério de pronto:

- estrutura de SDD navegável a partir do `README.md`.

### T0.2 - Configurar Instruções Persistentes do Claude

- [ ] Revisar `CLAUDE.md`.
- [ ] Garantir referência à constitution.
- [ ] Garantir regra de leitura de specs antes do código.

Critério de pronto:

- Claude Code recebe contexto operacional estável.

## 4. Fase 1 - Setup Full Stack

### T1.1 - Criar Setup Base do Monorepo

Specs:

- `architecture.md`;
- `implementation-plan.md`;
- `specs/docker-execution-spec.md`;
- ADRs 0003, 0004 e 0005 (stack — confirmar status antes de iniciar).

Executar em fatias (uma por sessão/commit, conforme constitution §2.8):

- [ ] **T1.1a** configurar workspace do monorepo e `.env.example`;
- [ ] **T1.1b** preparar `apps/api` (esqueleto TypeScript + Fastify), Dockerfile da API e `docker-compose.yml` com api, PostgreSQL e Redis;
- [ ] **T1.1c** preparar `apps/web` (esqueleto Vite), Dockerfile do web, serviço web no Compose e scripts delegando para Docker Compose.

Critério de pronto:

- `docker compose up --build` sobe o ambiente base.

### T1.2 - Configurar Serviços Docker

Specs:

- `database-schema.md`;
- `specs/docker-execution-spec.md`;
- `specs/deployment-spec.md`.

Tasks:

- [ ] configurar PostgreSQL;
- [ ] configurar Redis;
- [ ] implementar `GET /api/v1/health` na API (`api-contract.md` §6.5, `deployment-spec.md` §5);
- [ ] configurar health checks dos serviços no Compose (API via `/health`);
- [ ] documentar variáveis.

Critério de pronto:

- serviços sobem via Docker Compose sem dependência de banco ou Redis no host.

## 5. Fase 2 - Backend Core

### T2.1 - Criar Schema Inicial

Specs:

- `domain-model.md`;
- `database-schema.md`;
- `security-spec.md`.

Tasks:

- [ ] implementar modelos/tabelas de organização, usuário e membership;
- [ ] implementar tabelas de customer, conversation e message;
- [ ] criar índices essenciais;
- [ ] validar `organizationId` em entidades de domínio.

Critério de pronto:

- migration inicial criada e revisada.

### T2.2 - Implementar Auth

Specs:

- `specs/auth-spec.md`;
- `api-contract.md`;
- `security-spec.md`.

Tasks:

- [ ] criar registro de organização;
- [ ] criar owner;
- [ ] implementar login (JWT conforme `auth-spec.md` §3.2.1);
- [ ] implementar rate limit de login com Redis (`security-spec.md` §8);
- [ ] implementar `/me`;
- [ ] criar testes de auth (incluindo email duplicado `409` e rate limit `429`).

Critério de pronto:

- login válido e inválido cobertos por testes.

### T2.3 - Implementar Autorização

Specs:

- `specs/authorization-spec.md`;
- `security-spec.md`.

Tasks:

- [ ] implementar matriz de permissões;
- [ ] criar guard/middleware;
- [ ] aplicar em rotas sensíveis;
- [ ] testar acesso permitido, negado e cross-tenant.

Critério de pronto:

- backend bloqueia ações sem permissão.

### T2.4 - Implementar Conversas e Mensagens

Specs:

- `specs/conversation-history-spec.md`;
- `api-contract.md`;
- `database-schema.md`.

Tasks:

- [ ] criar entidades de customer, conversation e message;
- [ ] implementar criação de conversa com resolução de customer (§4.1);
- [ ] implementar listagem;
- [ ] implementar detalhe (20 mensagens mais recentes);
- [ ] implementar `GET /conversations/:id/messages` paginado;
- [ ] implementar criação de mensagem (regras de autoria do §4.0.2);
- [ ] testar paginação e tenant.

Critério de pronto:

- fluxo básico de conversa funciona via API.

### T2.5 - Implementar Atribuição e Status

Specs:

- `specs/conversation-history-spec.md`;
- `api-contract.md`.

Tasks:

- [ ] implementar `PATCH /conversations/:id` (atribuição e status);
- [ ] validar transições de status (tabela `conversation-history-spec.md` §4.0.1, incluindo reabertura);
- [ ] exigir `conversations.manage`;
- [ ] registrar atribuição e mudança de status em log;
- [ ] testar transição inválida e cross-tenant.

Critério de pronto:

- conversa pode ser atribuída e mudar de status com regras respeitadas.

### T2.6 - Implementar Gestão de Usuários

Specs:

- `specs/user-management-spec.md`;
- `specs/authorization-spec.md`;
- `api-contract.md` (§6.2).

Tasks:

- [ ] implementar `POST /users` (criação com papel);
- [ ] implementar `GET /users` (listagem paginada);
- [ ] implementar `PATCH /users/:id` (papel e status do vínculo);
- [ ] testar permissões, owner protegido, auto-alteração negada e cross-tenant.

Critério de pronto:

- admin cria agente, agente loga e pode receber conversa atribuída.

### T2.7 - Criar Seed de Demonstração

Specs:

- `specs/seed-spec.md`;
- `specs/docker-execution-spec.md`.

Tasks:

- [ ] implementar seed idempotente (org demo, usuários por papel, customers, conversas, mensagens);
- [ ] documentar comando de seed em container no README;
- [ ] testar idempotência.

Critério de pronto:

- após o seed, login demo funciona e `GET /conversations` e `GET /analytics/overview` retornam dados.

## 6. Fase 3 - Analytics e Dashboard

### T3.1 - Implementar Analytics Backend

Specs:

- `specs/analytics-spec.md`.

Tasks:

- [ ] criar overview;
- [ ] calcular conversas por status;
- [ ] calcular tempo de primeira resposta;
- [ ] calcular volume por atendente;
- [ ] testar fórmulas.

Critério de pronto:

- analytics respeita organização e período.

### T3.2 - Implementar Dashboard MVP

Specs:

- `specs/admin-dashboard-spec.md`;
- `api-contract.md`.

Executar em fatias (uma por sessão/commit):

- [ ] **T3.2a** login + shell autenticado (rotas protegidas, logout local);
- [ ] **T3.2b** lista de conversas (filtros, paginação, estados de loading/erro/vazio);
- [ ] **T3.2c** detalhe da conversa + envio de mensagem + paginação do histórico;
- [ ] **T3.2d** atribuição e status (usando `GET /users`) + tela de métricas básicas.

Critério de pronto:

- fluxo ponta a ponta demonstrável.

## 7. Fase 4 - DevOps e Deploy

### T4.1 - Configurar CI

Specs:

- `specs/docker-execution-spec.md`;
- `specs/deployment-spec.md`.

Tasks:

- [ ] lint;
- [ ] typecheck;
- [ ] tests;
- [ ] build;
- [ ] build de imagens Docker.

Critério de pronto:

- pipeline valida PRs usando containers.

### T4.2 - Preparar Deploy

Specs:

- `specs/docker-execution-spec.md`;
- `specs/deployment-spec.md`.

Tasks:

- [ ] criar ou revisar Dockerfiles de produção;
- [ ] criar ou revisar Compose de produção/staging, se aplicável;
- [ ] criar health check;
- [ ] documentar variáveis;
- [ ] preparar migrations executadas em container;
- [ ] criar smoke tests executados em container;
- [ ] documentar rollback.

Critério de pronto:

- deploy containerizado pode ser executado sem segredos no repo.

## 8. Prompt Para Executar Próxima Task

```text
Leia docs/sdd/constitution.md, docs/sdd/tasks.md e as specs listadas na próxima task pendente.

Escolha a próxima task pendente, resuma o objetivo, liste arquivos prováveis, testes necessários e riscos.

Não implemente até apresentar o plano.
```
