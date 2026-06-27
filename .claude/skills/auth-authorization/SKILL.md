---
name: auth-authorization
description: Use para implementar ou revisar autenticação, autorização, papéis, permissões e isolamento multi-tenant no backend do Projeto 1.
---

<!-- Projeto Desenvolvido na Data Science Academy -->

# Auth Authorization

## Quando Usar

Use em tarefas de login, sessão, papéis, permissões, guards, middlewares e cross-tenant.

## Leia Primeiro

- `docs/sdd/specs/auth-spec.md`
- `docs/sdd/specs/authorization-spec.md`
- `docs/sdd/security-spec.md`
- `docs/sdd/database-schema.md`
- módulos existentes `auth`, `users`, `organizations`, `roles`

## Workflow

1. Identifique o fluxo: autenticação ou autorização.
2. Verifique payloads e respostas.
3. Verifique permissões.
4. Verifique vínculo usuário-organização.
5. Implemente middleware/guard.
6. Aplique nas rotas.
7. Teste acesso permitido, negado e cross-tenant.

## Regras

- Senha sempre com hash.
- Erro de login deve ser genérico.
- Permissão é avaliada por organização.
- Backend decide autorização.
- Nunca confiar em flags vindas do frontend.

## Saída Esperada

Informe:

- fluxo implementado;
- permissões aplicadas;
- cenários de teste;
- risco residual de segurança.
