---
name: sdd-review
description: Use para revisar artefatos Spec-Driven Development antes de implementar, identificando ambiguidades, lacunas, conflitos entre specs, riscos e critérios de aceite ausentes.
---

<!-- Projeto Desenvolvido na Data Science Academy -->

# SDD Review

## Quando Usar

Use antes de qualquer implementação relevante ou quando uma spec parecer vaga, contraditória ou incompleta.

## Leia Primeiro

- `docs/sdd/product-brief.md`
- `docs/sdd/requirements.md`
- `docs/sdd/architecture.md`
- `docs/sdd/implementation-plan.md`
- spec específica da funcionalidade em `docs/sdd/specs/`

## Workflow

1. Resuma o objetivo da funcionalidade.
2. Liste as specs consultadas.
3. Aponte ambiguidades.
4. Aponte conflitos entre documentos.
5. Liste requisitos não testáveis.
6. Sugira melhorias na spec.
7. Não implemente código.

## Saída Esperada

Use este formato:

```text
Resumo
Specs consultadas
Ambiguidades
Conflitos
Riscos
Critérios de aceite faltantes
Perguntas antes da implementação
```

## Regra

Se a spec não for suficiente para implementar com segurança, diga isso explicitamente e peça decisão antes de codar.
