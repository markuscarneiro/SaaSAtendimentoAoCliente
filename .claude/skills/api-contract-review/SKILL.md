---
name: api-contract-review
description: Use para revisar contratos de API entre frontend e backend, validando payloads, respostas, erros, paginação, permissões e aderência às specs SDD.
---

<!-- Projeto Desenvolvido na Data Science Academy -->

# API Contract Review

## Quando Usar

Use antes de implementar uma rota, antes de conectar frontend, ou quando payloads estiverem inconsistentes.

## Leia Primeiro

- `docs/sdd/api-contract.md`
- `docs/sdd/requirements.md`
- spec específica em `docs/sdd/specs/`
- contratos em `packages/api-contracts/`, se existirem

## Workflow

1. Liste endpoints afetados.
2. Verifique request, response e erros.
3. Verifique permissões por endpoint.
4. Verifique paginação e filtros.
5. Verifique compatibilidade com frontend.
6. Aponte inconsistências.
7. Sugira atualização de spec antes de código.

## Regras

- Contrato explícito vence inferência.
- Não invente campos não especificados.
- Erros devem seguir padrão global.
- Recursos inacessíveis por tenant podem retornar `404`.

## Saída Esperada

```text
Endpoints revisados
Campos ausentes
Campos ambíguos
Erros esperados
Permissões
Mudanças recomendadas
```
