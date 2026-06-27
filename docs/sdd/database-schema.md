<!-- Projeto Desenvolvido na Data Science Academy -->

# Database Schema - SaaS de Atendimento ao Cliente

## 1. Objetivo

Este documento descreve o schema relacional recomendado para o MVP.

Ele deve orientar migrations, ORM, testes e queries.

## 2. Banco

Banco recomendado:

- PostgreSQL;
- ORM a definir no setup, como Prisma ou Drizzle.

## 3. Tabelas

## 3.1 organizations

| Campo | Tipo | Observação |
|---|---|---|
| id | uuid/text | PK |
| name | text | obrigatório |
| slug | text | único |
| status | text | active, inactive |
| created_at | timestamp | obrigatório |
| updated_at | timestamp | obrigatório |

Índices:

- unique `slug`;
- index `status`.

## 3.2 users

| Campo | Tipo | Observação |
|---|---|---|
| id | uuid/text | PK |
| name | text | obrigatório |
| email | text | único |
| password_hash | text | obrigatório |
| status | text | active, inactive |
| created_at | timestamp | obrigatório |
| updated_at | timestamp | obrigatório |

Índices:

- unique `email`.

## 3.3 organization_members

| Campo | Tipo | Observação |
|---|---|---|
| id | uuid/text | PK |
| organization_id | uuid/text | FK organizations |
| user_id | uuid/text | FK users |
| role | text | owner, admin, manager, agent, viewer |
| status | text | active, inactive |
| created_at | timestamp | obrigatório |
| updated_at | timestamp | obrigatório |

Índices:

- unique `organization_id, user_id`;
- index `user_id`;
- index `organization_id, role`.

## 3.4 customers

| Campo | Tipo | Observação |
|---|---|---|
| id | uuid/text | PK |
| organization_id | uuid/text | FK organizations |
| name | text | obrigatório |
| email | text | opcional |
| external_ref | text | opcional |
| metadata | jsonb | opcional |
| created_at | timestamp | obrigatório |

Índices:

- index `organization_id`;
- index `organization_id, email`;
- unique parcial `organization_id, external_ref` onde `external_ref` não é nulo (suporta deduplicação por `externalRef` pós-MVP; ver `specs/conversation-history-spec.md` §4.1).

## 3.5 conversations

| Campo | Tipo | Observação |
|---|---|---|
| id | uuid/text | PK |
| organization_id | uuid/text | FK organizations |
| customer_id | uuid/text | FK customers |
| assigned_user_id | uuid/text | FK users opcional |
| status | text | open, waiting_customer, waiting_agent, resolved, closed |
| priority | text | low, normal, high; default `normal` (MVP usa apenas `normal`; campo reservado) |
| channel | text | manual no MVP |
| subject | text | opcional |
| last_message_at | timestamp | opcional |
| created_at | timestamp | obrigatório |
| updated_at | timestamp | obrigatório |

Índices:

- index `organization_id, status`;
- index `organization_id, assigned_user_id`;
- index `organization_id, last_message_at`.

## 3.6 messages

| Campo | Tipo | Observação |
|---|---|---|
| id | uuid/text | PK |
| organization_id | uuid/text | FK organizations |
| conversation_id | uuid/text | FK conversations |
| author_type | text | customer, agent, system |
| author_id | uuid/text | opcional |
| content | text | obrigatório |
| metadata | jsonb | opcional |
| created_at | timestamp | obrigatório |

Índices:

- index `organization_id, conversation_id, created_at`.

## 3.7 Padrões de Query Esperados

Mapeamento entre as queries operacionais previstas e os índices que as atendem. Query nova que não se encaixe aqui deve atualizar esta seção (e possivelmente criar índice).

| Query | Origem | Índice usado |
|---|---|---|
| Conversas da organização filtradas por status, ordenadas por `last_message_at` | `GET /conversations` | `(organization_id, status)` + `(organization_id, last_message_at)` |
| Conversas atribuídas a um usuário | `GET /conversations?assignedUserId=` | `(organization_id, assigned_user_id)` |
| Mensagens de uma conversa paginadas por criação | `GET /conversations/:id/messages` | `(organization_id, conversation_id, created_at)` |
| Resolução de customer por email na organização | `POST /conversations` (§4.1 da spec) | `(organization_id, email)` em `customers` |
| Membros de uma organização (com papel) | `GET /users`, guard de permissões | `(organization_id, user_id)` único + `(organization_id, role)` |
| Vínculos de um usuário (login/contexto) | `POST /auth/login`, middleware | `(user_id)` em `organization_members` |
| Usuário por email | `POST /auth/login`, criação de usuário | unique `email` em `users` |
| Agregações de analytics por organização e período | `GET /analytics/overview` | `(organization_id, status)` e `(organization_id, conversation_id, created_at)`; recorte por `created_at` |

## 4. Regras de Integridade

- Todas as tabelas de domínio devem carregar `organization_id`.
- FK deve impedir referências inválidas.
- Exclusões reais devem ser evitadas para dados auditáveis.
- Preferir status `archived` ou `inactive`.
- Mensagens devem preservar histórico (autoria e data imutáveis).

## 5. Como Usar Este Documento com IA

Prompt de execução:

```text
Leia docs/sdd/database-schema.md e gere migrations iniciais seguindo o ORM do projeto. Antes de alterar arquivos, compare com domain-model.md e liste divergências.
```

## 6. Histórico de Mudanças

- **1.2 (2026-06-09):** adicionada seção de padrões de query esperados (§3.7), mapeando queries do contrato aos índices.
- **1.1 (2026-06-09):** `priority` marcado como campo reservado com default `normal`.
- **1.0 (2026-06-03):** versão inicial.

**Versão:** 1.2  
**Status:** Proposta  
**Owner:** Equipe do projeto  
**Última atualização:** 2026-06-09  
**Substitui:** N/A
