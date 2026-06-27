<!-- Projeto Desenvolvido na Data Science Academy -->

# API Contract - SaaS de Atendimento ao Cliente

## 1. Objetivo

Este documento define os contratos principais da API REST.

O frontend, o backend e o Claude Code devem tratar este arquivo como fonte de verdade para endpoints, payloads, respostas e erros.

## 2. Convenções

Base path:

```text
/api/v1
```

Formato:

```json
{
  "data": {},
  "meta": {},
  "error": null
}
```

Erro:

```json
{
  "data": null,
  "meta": {},
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": []
  }
}
```

## 3. Autenticação

Rotas protegidas exigem um JSON Web Token (JWT) enviado no header `Authorization`. O MVP não usa cookie de sessão.

```text
Authorization: Bearer <jwt>
```

Requisições sem token válido em rota protegida retornam `401` com `error.code = UNAUTHENTICATED`. Ver `docs/sdd/specs/auth-spec.md`.

## 4. Paginação

Query params:

- `page` (mínimo 1, default 1);
- `pageSize` (mínimo 1, máximo 100, default 20);
- `sort`;
- `direction` (`asc`, `desc`).

Campos aceitos em `sort`, por recurso:

| Recurso | Campos de `sort` | Default |
|---|---|---|
| `GET /conversations` | `createdAt`, `lastMessageAt` | `lastMessageAt desc` |
| `GET /conversations/:id/messages` | apenas `createdAt` | `createdAt asc` |
| `GET /users` | `name`, `createdAt` | `name asc` |

Valor de `sort` fora da lista do recurso retorna `400 VALIDATION_ERROR`.

Resposta:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 100
  },
  "error": null
}
```

## 5. Códigos de Erro

| Código | HTTP | Uso |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Payload ou query inválidos |
| `UNAUTHENTICATED` | 401 | Usuário não autenticado |
| `FORBIDDEN` | 403 | Usuário sem permissão |
| `NOT_FOUND` | 404 | Recurso inexistente ou inacessível |
| `CONFLICT` | 409 | Conflito de regra de negócio (ex.: email duplicado, transição de status inválida) |
| `RATE_LIMITED` | 429 | Limite de uso excedido |

## 6. Endpoints

## 6.1 Auth

### POST `/auth/register-organization`

Cria organização inicial e usuário owner. Email já cadastrado retorna `409 CONFLICT`. Senha deve ter entre 8 e 72 caracteres (ver `security-spec.md` §3).

Request:

```json
{
  "organizationName": "Acme Support",
  "ownerName": "Ana Silva",
  "ownerEmail": "ana@example.com",
  "password": "strong-password"
}
```

Response `201`:

```json
{
  "data": {
    "organization": {
      "id": "org_123",
      "name": "Acme Support"
    },
    "user": {
      "id": "usr_123",
      "name": "Ana Silva",
      "email": "ana@example.com"
    }
  },
  "meta": {},
  "error": null
}
```

### POST `/auth/login`

Tentativas falhas em excesso retornam `429 RATE_LIMITED` (limites em `security-spec.md` §8).

Request:

```json
{
  "email": "ana@example.com",
  "password": "strong-password"
}
```

Response `200`:

```json
{
  "data": {
    "accessToken": "jwt",
    "user": {
      "id": "usr_123",
      "name": "Ana Silva",
      "email": "ana@example.com"
    },
    "organization": {
      "id": "org_123",
      "name": "Acme Support"
    },
    "role": "owner"
  },
  "meta": {},
  "error": null
}
```

### GET `/me`

Retorna usuário autenticado, organização ativa e permissões.

## 6.2 Users

Gestão de usuários da organização autenticada. Ver `docs/sdd/specs/user-management-spec.md`.

### GET `/users`

Lista membros da organização (usuário + papel + status do vínculo). Resposta paginada. Exige `users.read`.

Response `200` (`data`):

```json
[
  {
    "id": "usr_456",
    "name": "Bruno Costa",
    "email": "bruno@example.com",
    "role": "agent",
    "status": "active"
  }
]
```

### POST `/users`

Cria usuário e vínculo com a organização autenticada. Exige `users.manage`. Não permite criar `owner`. Email já cadastrado retorna `409 CONFLICT`.

Request:

```json
{
  "name": "Bruno Costa",
  "email": "bruno@example.com",
  "password": "strong-password",
  "role": "agent"
}
```

Response `201`:

```json
{
  "data": {
    "id": "usr_456",
    "name": "Bruno Costa",
    "email": "bruno@example.com",
    "role": "agent"
  },
  "meta": {},
  "error": null
}
```

### PATCH `/users/:id`

Atualiza papel e/ou status do vínculo do usuário com a organização. Exige `users.manage`. Regras (ver `user-management-spec.md`): não altera o `owner`; usuário não altera o próprio vínculo; `role` permitido: `admin`, `manager`, `agent`, `viewer`. Violações retornam `409 CONFLICT`.

Request (ao menos um campo):

```json
{
  "role": "manager",
  "status": "inactive"
}
```

## 6.3 Conversations

### GET `/conversations`

Lista conversas da organização autenticada. Resposta paginada (`meta` com `page`, `pageSize`, `total`).

Query:

- `status` (`open`, `waiting_customer`, `waiting_agent`, `resolved`, `closed`);
- `assignedUserId`;
- `page`;
- `pageSize`;
- `sort`;
- `direction` (`asc`, `desc`).

### POST `/conversations`

Request:

```json
{
  "customer": {
    "name": "Cliente Exemplo",
    "email": "cliente@example.com"
  },
  "subject": "Dúvida sobre cancelamento",
  "channel": "manual"
}
```

Response `201`:

```json
{
  "data": {
    "id": "conv_123",
    "status": "open",
    "subject": "Dúvida sobre cancelamento"
  },
  "meta": {},
  "error": null
}
```

### GET `/conversations/:id`

Retorna conversa, cliente, mensagens recentes e metadados.

`data.messages` contém as **20 mensagens mais recentes**, em ordem crescente de `createdAt`. Histórico completo via `GET /conversations/:id/messages`.

### GET `/conversations/:id/messages`

Lista mensagens da conversa, paginadas, em ordem crescente de `createdAt`. Exige `conversations.read`. Resposta paginada (`meta` com `page`, `pageSize`, `total`).

Query:

- `page`;
- `pageSize`.

### POST `/conversations/:id/messages`

Registra mensagem de atendente ou de cliente. Exige `messages.create`. Conversa com status `closed` retorna `409 CONFLICT`.

Regras:

- `authorType` aceita apenas `agent` ou `customer`; `system` é reservado ao backend e retorna `400 VALIDATION_ERROR`;
- `authorId` não é aceito no payload: o backend deriva o autor (`agent` → usuário autenticado; `customer` → customer da conversa);
- `content` é obrigatório, com tamanho máximo definido em `security-spec.md` §6.

Request:

```json
{
  "authorType": "agent",
  "content": "Olá, vou verificar isso para você."
}
```

### PATCH `/conversations/:id`

Atualiza atribuição e/ou status da conversa. Exige `conversations.manage`. Transição de status inválida retorna `409 CONFLICT`. Ver `docs/sdd/specs/conversation-history-spec.md`.

Request (ao menos um campo):

```json
{
  "assignedUserId": "usr_456",
  "status": "resolved"
}
```

Response `200`:

```json
{
  "data": {
    "id": "conv_123",
    "status": "resolved",
    "assignedUserId": "usr_456"
  },
  "meta": {},
  "error": null
}
```

## 6.4 Analytics

### GET `/analytics/overview`

Métricas de atendimento da organização. Exige `analytics.read`. Ver `docs/sdd/specs/analytics-spec.md`.

Query:

- `from` (opcional; default: 30 dias antes de `to`);
- `to` (opcional; default: data atual).

`from > to` retorna `400 VALIDATION_ERROR`. O período efetivo é ecoado em `meta.from` e `meta.to`.

Response:

```json
{
  "data": {
    "conversationsTotal": 120,
    "openConversations": 20,
    "resolvedConversations": 80,
    "closedConversations": 20,
    "messagesTotal": 940,
    "avgFirstResponseSeconds": 540,
    "byAgent": [
      {
        "userId": "usr_123",
        "assignedConversations": 30,
        "messagesSent": 210
      }
    ]
  },
  "meta": {
    "from": "2026-01-01",
    "to": "2026-01-31"
  },
  "error": null
}
```

## 6.5 Health

### GET `/health`

Rota **pública** (sem autenticação), usada por health checks de container e smoke tests. Ver `docs/sdd/specs/deployment-spec.md` §5.

Exceção ao envelope padrão: a resposta não usa `data/meta/error`.

Response `200`:

```json
{
  "status": "ok",
  "services": {
    "database": "ok",
    "redis": "ok"
  }
}
```

Se algum serviço estiver indisponível, retorna `503` com o serviço marcado como `"error"`. Não expõe segredos nem detalhes sensíveis.

## 7. Regras Globais de API

- Rotas protegidas devem validar autenticação.
- Rotas sensíveis devem validar permissão.
- Recursos devem ser filtrados por organização.
- `404` pode ser usado para recurso inexistente ou inacessível, evitando vazamento de informação.
- Payloads devem ser validados antes de executar regra de negócio.

## 8. Como Usar Este Documento com IA

Prompt de execução:

```text
Leia docs/sdd/api-contract.md e implemente apenas os DTOs, schemas de validação e rotas vazias para os endpoints do módulo solicitado. Não altere os contratos sem pedir confirmação.
```

## 9. Histórico de Mudanças

Mudanças neste contrato devem ser espelhadas em `openapi.yaml` (e vice-versa) e registradas aqui.

- **1.1 (2026-06-09):** adições não-breaking — endpoints de Users (§6.2), `GET /conversations/:id/messages`, `GET /health` (§6.5), métrica `messagesTotal`, defaults de `from`/`to`, whitelist de `sort` (§4), coluna HTTP na tabela de erros, `409` para email duplicado e `429` no login, regras de autoria em mensagens.
- **1.0 (2026-06-03):** versão inicial.

**Versão:** 1.1  
**Status:** Proposta  
**Owner:** Equipe do projeto  
**Última atualização:** 2026-06-09  
**Substitui:** N/A
