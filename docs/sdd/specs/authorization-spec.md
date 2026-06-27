<!-- Projeto Desenvolvido na Data Science Academy -->

# Authorization Spec

## 1. Objetivo

Implementar controle de acesso por papéis e permissões.

O backend deve ser a fonte de verdade da autorização.

## 1.1 Contexto e Motivação

Times de atendimento têm papéis com responsabilidades distintas (owner, admin, manager, agent, viewer); sem controle por papel, qualquer usuário poderia alterar configurações, conversas ou dados de outros. Em um SaaS multi-tenant, o risco dominante é o acesso cruzado entre organizações — por isso a autorização é avaliada sempre no contexto do vínculo com a organização, nunca pelo papel isolado.

## 1.2 Non-Goals

- papéis customizados ou permissões configuráveis por organização (matriz é fixa no MVP);
- permissões por recurso individual (ACL por conversa);
- delegação temporária de permissão;
- auditoria completa de autorização em UI (apenas logs, RNF-002).

## 2. Papéis

- `owner`;
- `admin`;
- `manager`;
- `agent`;
- `viewer`.

## 3. Permissões

| Permissão | Descrição |
|---|---|
| `users.read` | Listar usuários da organização |
| `users.manage` | Criar usuários e alterar papel/status de vínculo |
| `conversations.read` | Ler conversas |
| `conversations.create` | Criar conversas |
| `conversations.manage` | Atribuir e mudar status de conversas |
| `messages.create` | Criar mensagens |
| `analytics.read` | Ler analytics |

## 4. Matriz

| Papel | Permissões |
|---|---|
| owner | todas |
| admin | users.read, users.manage, conversations.read, conversations.create, conversations.manage, messages.create, analytics.read |
| manager | users.read, conversations.read, conversations.manage, messages.create, analytics.read |
| agent | users.read, conversations.read, conversations.create, conversations.manage, messages.create |
| viewer | conversations.read, analytics.read |

Nota: `users.read` existe para popular a atribuição de conversas (manager e agent precisam listar usuários atribuíveis) sem conceder gestão.

## 5. Regras

- Permissão é avaliada no contexto da organização.
- Usuário sem vínculo ativo com organização não acessa dados.
- Rotas sensíveis devem declarar permissão necessária.
- Cross-tenant deve ser bloqueado mesmo quando o usuário tem papel alto em outra organização.
- O frontend pode esconder ações, mas não decide autorização.

## 6. Endpoints e Permissões

| Endpoint | Permissão |
|---|---|
| `GET /users` | `users.read` |
| `POST /users` | `users.manage` |
| `PATCH /users/:id` | `users.manage` |
| `GET /conversations` | `conversations.read` |
| `POST /conversations` | `conversations.create` |
| `GET /conversations/:id` | `conversations.read` |
| `GET /conversations/:id/messages` | `conversations.read` |
| `PATCH /conversations/:id` | `conversations.manage` |
| `POST /conversations/:id/messages` | `messages.create` |
| `GET /analytics/overview` | `analytics.read` |
| `GET /health` | pública (sem autenticação) |

## 6.1 Cenários (BDD)

```gherkin
Cenário: Acesso negado por falta de permissão
DADO um usuário com papel viewer em uma organização
QUANDO ele faz POST /conversations/:id/messages
ENTÃO o sistema retorna 403 FORBIDDEN
E o acesso negado é registrado em log

Cenário: Cross-tenant negado mesmo com papel alto
DADO um usuário owner da organização A
E uma conversa pertencente à organização B
QUANDO ele faz GET /conversations/:id dessa conversa
ENTÃO o sistema retorna 404 NOT_FOUND
E nenhum dado da organização B é exposto
```

## 6.2 Casos de Borda

- rota protegida sem permissão declarada: o guard deve **negar por padrão** (deny-by-default) — a ausência de declaração é erro, não liberação;
- vínculo inativado entre a emissão do token e o request: permissões são resolvidas por request, o acesso é negado imediatamente;
- recurso inexistente vs. inacessível: ambos retornam `404` com a mesma resposta (não vaza existência);
- usuário com papel `owner` é único por organização no MVP (criado no registro; ver `user-management-spec.md` §5).

## 7. Testes Obrigatórios

- owner acessa rota administrativa;
- viewer não cria mensagem;
- agent não gerencia usuários;
- usuário sem vínculo recebe erro;
- usuário de outra organização não acessa recurso;
- rota sem permissão declarada é identificada em revisão.

## 7.1 Riscos e Questões Abertas

Riscos:

- rota nova esquecida sem guard: mitigado pelo deny-by-default (§6.2) e pelo teste de revisão "rota sem permissão declarada é identificada";
- deriva entre a matriz documentada (§4) e a matriz no código: mitigado por teste que valida a matriz inteira papel × permissão;
- escalada via gestão de usuários: mitigada pelas regras do owner em `user-management-spec.md` §5.

Questões abertas:

- papéis customizados por organização ficam pós-MVP (non-goal §1.2).

## 8. Prompt Para Claude Code

```text
Leia authorization-spec.md e implemente guard/middleware de permissões. Aplique nas rotas especificadas e crie testes para acesso permitido, acesso negado e cross-tenant.
```

## 9. Histórico de Mudanças

- **1.2 (2026-06-09):** adicionados contexto/motivação, non-goals, cenários BDD, casos de borda (deny-by-default) e riscos/questões abertas, conforme `spec-template.md`.
- **1.1 (2026-06-09):** adicionada permissão `users.read`, endpoints de gestão de usuários e `GET /conversations/:id/messages` na tabela, e rota pública `/health`.
- **1.0 (2026-06-03):** versão inicial.

**Versão:** 1.2  
**Status:** Proposta  
**Owner:** Equipe do projeto  
**Última atualização:** 2026-06-09  
**Substitui:** N/A
