<!-- Projeto Desenvolvido na Data Science Academy -->

# Feature Implementation Prompts - Projeto 1

Prompts específicos por funcionalidade do Projeto 1 (atendimento ao cliente, sem IA/RAG).

## 1. Autenticação

```text
Siga .claude/skills/auth-authorization/SKILL.md.

Implemente autenticação do MVP seguindo:
- docs/sdd/specs/auth-spec.md
- docs/sdd/api-contract.md
- docs/sdd/database-schema.md
- docs/sdd/security-spec.md

Escopo desta etapa:
1. registro de organização com owner;
2. login com email e senha;
3. hash de senha;
4. middleware de autenticação (Bearer JWT);
5. endpoint /me;
6. testes.

Antes de implementar, apresente plano e arquivos prováveis.
```

## 2. Autorização

```text
Siga .claude/skills/auth-authorization/SKILL.md.

Implemente autorização por papéis e permissões seguindo:
- docs/sdd/specs/authorization-spec.md
- docs/sdd/security-spec.md

Escopo:
1. matriz de permissões;
2. guard/middleware;
3. aplicação em rotas sensíveis;
4. testes de acesso permitido, negado e cross-tenant.
```

## 3. Conversas e Mensagens

```text
Siga .claude/skills/backend-endpoint/SKILL.md.

Implemente conversas e mensagens seguindo:
- docs/sdd/specs/conversation-history-spec.md
- docs/sdd/api-contract.md
- docs/sdd/domain-model.md
- docs/sdd/database-schema.md

Escopo:
1. migrations/modelos (customer, conversation, message);
2. criar conversa com resolução de customer (§4.1);
3. listar conversas;
4. consultar conversa;
5. criar mensagem;
6. paginação e tenant;
7. testes.
```

## 4. Atribuição e Status

```text
Siga .claude/skills/backend-endpoint/SKILL.md.

Implemente atribuição e mudança de status de conversa seguindo:
- docs/sdd/specs/conversation-history-spec.md
- docs/sdd/api-contract.md

Escopo:
1. PATCH /conversations/:id (assignedUserId e status);
2. validação de transições de status;
3. permissão conversations.manage;
4. testes de transição inválida e cross-tenant.
```

## 5. Analytics

```text
Siga .claude/skills/backend-endpoint/SKILL.md.

Implemente analytics de atendimento seguindo:
- docs/sdd/specs/analytics-spec.md
- docs/sdd/database-schema.md

Priorize fórmulas corretas no backend (status, tempo de primeira resposta, volume por atendente).
Crie testes para período, organização e permissão analytics.read.
```

## 6. Dashboard

```text
Siga .claude/skills/frontend-dashboard/SKILL.md.

Implemente dashboard administrativo seguindo:
- docs/sdd/specs/admin-dashboard-spec.md
- docs/sdd/api-contract.md

Escopo inicial:
1. login;
2. lista de conversas;
3. detalhe da conversa;
4. envio de mensagem;
5. atribuição e status;
6. métricas básicas.

Não mova regras de negócio para o frontend.
```

## 7. CI/CD e Deploy

```text
Siga .claude/skills/devops-deploy/SKILL.md.

Configure CI/CD e deploy seguindo:
- docs/sdd/specs/docker-execution-spec.md
- docs/sdd/specs/deployment-spec.md
- docs/sdd/architecture.md

Inclua:
1. lint;
2. typecheck;
3. testes;
4. build;
5. Docker obrigatório;
6. health check;
7. smoke tests.

Não inclua segredos reais. Não crie comandos obrigatórios que dependam de runtime instalado no host.
```
