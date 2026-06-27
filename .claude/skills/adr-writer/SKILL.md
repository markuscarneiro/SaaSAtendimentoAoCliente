---
name: adr-writer
description: Use para registrar decisões arquiteturais do Projeto 1 em ADRs curtos, com contexto, decisão, alternativas, consequências e status.
---

<!-- Projeto Desenvolvido na Data Science Academy -->

# ADR Writer

## Quando Usar

Use quando houver decisão arquitetural relevante, como multi-tenancy, auth, ORM, cache ou deploy.

## Leia Primeiro

- `docs/sdd/architecture.md`
- specs relacionadas à decisão
- ADRs existentes em `docs/sdd/adr/`

## Workflow

1. Identifique a decisão.
2. Descreva contexto.
3. Liste alternativas consideradas.
4. Registre decisão.
5. Explique consequências positivas e negativas.
6. Defina status.
7. Crie arquivo numerado em `docs/sdd/adr/`.

## Template

```markdown
# ADR-000X - Título

## Status

Proposto | Aceito | Substituído

## Contexto

## Decisão

## Alternativas Consideradas

## Consequências

## Impacto no Projeto
```

## Regra

ADR deve ser curto e decisivo. Não transformar em tutorial.
