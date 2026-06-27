<!-- Projeto Desenvolvido na Data Science Academy -->

# Implementation Plan - SaaS de Atendimento ao Cliente

## 1. Objetivo

Este documento organiza a implementação do MVP em fases incrementais.

Ele deve ser usado para evitar pedidos grandes demais ao assistente de IA.

## 2. Estratégia

Implementar em fatias pequenas, cada uma com:

- spec revisada;
- plano do Claude Code;
- implementação limitada;
- testes;
- revisão contra critérios de aceite.

## 3. Fase 0 - Preparação

Entregas:

- estrutura do monorepo;
- `docs/sdd`;
- instruções do assistente;
- scripts básicos;
- ambiente local 100% Docker.

Specs usadas:

- `product-brief.md`;
- `requirements.md`;
- `architecture.md`;

## 4. Fase 1 - Setup Full Stack

Entregas:

- `apps/api`;
- `apps/web`;
- Dockerfiles para API e web;
- Docker Compose com API, web, PostgreSQL e Redis;
- lint, tipos e testes iniciais.

Critérios:

- `docker compose up --build` sobe o ambiente;
- backend e frontend rodam em containers;
- migrations e testes rodam em containers;
- teste mínimo passa sem runtime instalado no host.

## 5. Fase 2 - Backend Core

Entregas:

- domínio inicial;
- schema do banco;
- autenticação (com rate limit de login);
- autorização;
- organizações;
- gestão de usuários (criar, listar, alterar papel/status);
- clientes;
- conversas;
- mensagens (incluindo histórico paginado);
- atribuição e status de conversa;
- seed de demonstração.

Specs usadas:

- `domain-model.md`;
- `database-schema.md`;
- `api-contract.md`;
- `specs/auth-spec.md`;
- `specs/authorization-spec.md`;
- `specs/user-management-spec.md`;
- `specs/conversation-history-spec.md`;
- `specs/seed-spec.md`.

## 6. Fase 3 - Analytics e Dashboard

Entregas:

- endpoints de analytics de atendimento;
- dashboard administrativo;
- fluxo ponta a ponta.

Specs usadas:

- `specs/analytics-spec.md`;
- `specs/admin-dashboard-spec.md`.

## 7. Fase 4 - DevOps e Deploy

Entregas:

- CI;
- Docker obrigatório;
- Docker Compose;
- variáveis de ambiente;
- health check;
- smoke tests;
- plano de deploy.

Specs usadas:

- `specs/docker-execution-spec.md`;
- `specs/deployment-spec.md`.

## 12. Prompts de Execução

## 12.1 Leitura

```text
Leia as specs relevantes para a fase atual. Resuma o objetivo, dependências, riscos e critérios de aceite. Não implemente ainda.
```

## 12.2 Plano

```text
Crie um plano incremental para a fase atual. Liste arquivos prováveis, testes necessários e ordem de implementação.
```

## 12.3 Implementação

```text
Implemente apenas a primeira etapa do plano aprovado. Não altere escopo. Atualize testes relacionados.
```

## 12.4 Revisão

```text
Compare a implementação com as specs e critérios de aceite. Liste divergências, riscos e lacunas de teste.
```

## 13. Como Usar Este Documento com IA

Prompt de execução:

```text
Leia docs/sdd/implementation-plan.md e diga qual é a próxima menor fatia implementável para o estado atual do projeto. Não escreva código antes de apresentar o plano.
```

**Versão:** 1.1  
**Status:** Proposta  
**Owner:** Equipe do projeto  
**Última atualização:** 2026-06-09  
**Substitui:** N/A
