---
name: security-review
description: Use para revisar riscos de autenticação, autorização, multi-tenancy, validação de entrada, segredos e vazamento de dados em funcionalidades do Projeto 1.
---

<!-- Projeto Desenvolvido na Data Science Academy -->

# Security Review

## Quando Usar

Use antes de considerar uma funcionalidade pronta, especialmente em auth, autorização, conversas e analytics.

## Leia Primeiro

- `docs/sdd/security-spec.md`
- `docs/sdd/specs/authorization-spec.md`
- spec específica da funcionalidade
- código alterado

## Workflow

1. Identifique superfície de ataque.
2. Verifique autenticação.
3. Verifique permissão.
4. Verifique filtro por tenant.
5. Verifique validação de entrada.
6. Verifique logs e segredos.
7. Recomende correções priorizadas.

## Regras

- Findings primeiro, ordenados por severidade.
- Use arquivo e linha quando possível.
- Não reescreva a funcionalidade inteira sem necessidade.
- Diferencie risco real de melhoria opcional.

## Saída Esperada

```text
Findings
Risco
Evidência
Correção recomendada
Testes ausentes
```
