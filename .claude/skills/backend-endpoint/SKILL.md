---
name: backend-endpoint
description: Use para implementar endpoints backend no Projeto 1 seguindo contratos SDD, validações, permissões, multi-tenancy, testes e revisão contra critérios de aceite.
---

<!-- Projeto Desenvolvido na Data Science Academy -->

# Backend Endpoint

## Quando Usar

Use ao criar ou alterar endpoint REST no backend.

## Leia Primeiro

- `docs/sdd/api-contract.md`
- `docs/sdd/domain-model.md`
- `docs/sdd/database-schema.md`
- `docs/sdd/security-spec.md`
- spec específica em `docs/sdd/specs/`
- arquivos existentes do módulo em `apps/api/src/modules/`

## Workflow

1. Confirme o endpoint e o contrato.
2. Identifique permissão necessária.
3. Identifique regras de tenant.
4. Liste arquivos que serão alterados.
5. Proponha plano incremental.
6. Implemente DTO/schema, service, controller e testes.
7. Rode validações disponíveis.
8. Revise contra critérios de aceite.

## Regras

- Não altere contrato sem pedir confirmação.
- Não coloque regra de negócio no controller.
- Toda query de domínio deve filtrar por `organizationId`.
- Testes devem cobrir sucesso, validação, permissão e cross-tenant quando aplicável.

## Saída Esperada

Ao final, informe:

- arquivos alterados;
- endpoints implementados;
- testes criados;
- validações executadas;
- riscos ou pendências.
