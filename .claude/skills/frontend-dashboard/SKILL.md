---
name: frontend-dashboard
description: Use para implementar o dashboard administrativo consumindo contratos reais da API, com estados de loading, erro, vazio e sucesso, sem duplicar regra de negócio do backend.
---

<!-- Projeto Desenvolvido na Data Science Academy -->

# Frontend Dashboard

## Quando Usar

Use em tarefas de frontend do dashboard administrativo.

## Leia Primeiro

- `docs/sdd/specs/admin-dashboard-spec.md`
- `docs/sdd/api-contract.md`
- specs dos fluxos consumidos
- componentes existentes em `apps/web/src/`

## Workflow

1. Identifique tela ou fluxo.
2. Liste endpoints consumidos.
3. Modele estados: loading, erro, vazio e sucesso.
4. Implemente UI simples e funcional.
5. Consuma o contrato real da API.
6. Não duplicar regra de autorização.
7. Teste fluxo principal.

## Regras

- Backend decide permissões.
- Estados vazios devem ser úteis.
- Evitar complexidade visual antes de validar fluxo.

## Saída Esperada

Informe:

- telas alteradas;
- endpoints usados;
- estados implementados;
- limitações ou mocks.
