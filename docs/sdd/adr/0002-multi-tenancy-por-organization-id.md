<!-- Projeto Desenvolvido na Data Science Academy -->

# ADR-0002 - Multi-Tenancy Por OrganizationId

**Status:** Aceito  
**Data:** 2026-06-03

## Contexto

O produto é um SaaS B2B. Dados de uma organização nunca podem aparecer para outra.

O MVP precisa orientar multi-tenancy de forma simples, explícita e testável.

## Decisão

Usaremos `organizationId` como estratégia principal de isolamento.

Toda entidade operacional deve carregar `organizationId`, e toda query de domínio deve filtrar por esse campo.

## Alternativas Consideradas

- Banco separado por tenant.
- Schema separado por tenant.
- Row-level security desde o MVP.

## Consequências

Positivas:

- simples de orientar;
- fácil de testar;
- reduz infraestrutura;
- funciona bem para MVP.

Negativas:

- exige disciplina em todas as queries;
- falhas de filtro podem causar vazamento;
- pode exigir RLS ou separação maior em produção madura.

## Impacto no Projeto

Toda spec, endpoint e teste sensível deve considerar cross-tenant.
