---
name: test-writer
description: Use para criar testes automatizados alinhados às specs SDD, cobrindo sucesso, falha, permissões e tenant.
---

<!-- Projeto Desenvolvido na Data Science Academy -->

# Test Writer

## Quando Usar

Use após planejar uma funcionalidade ou ao revisar lacunas de cobertura.

## Leia Primeiro

- `docs/sdd/test-plan.md`
- `docs/sdd/acceptance-criteria.md`
- spec específica da funcionalidade
- testes existentes do módulo

## Workflow

1. Extraia critérios de aceite.
2. Liste cenários de teste.
3. Priorize regras críticas.
4. Use factories, mocks e fakes existentes.
5. Implemente testes pequenos.
6. Rode validações.
7. Aponte lacunas restantes.

## Regras

- Integrações externas (ex.: e-mail), quando existirem, devem usar fake/mock, não o serviço real.
- Cobrir permissão quando rota for protegida.
- Cobrir cross-tenant quando houver `organizationId`.

## Saída Esperada

Informe:

- testes adicionados;
- critérios cobertos;
- cenários não cobertos;
- resultado dos comandos.
