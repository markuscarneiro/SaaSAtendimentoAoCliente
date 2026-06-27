<!-- Projeto Desenvolvido na Data Science Academy -->

# ADR-0001 - Usar Monorepo Full Stack

**Status:** Aceito  
**Data:** 2026-06-03

## Contexto

O Projeto 1 é uma aplicação full stack com backend, frontend administrativo, pacotes compartilhados, specs SDD, prompts e skills.

Como o objetivo operacional é mostrar fluxo ponta a ponta com Claude Code, a estrutura precisa facilitar navegação, contratos compartilhados e evolução incremental.

## Decisão

Usaremos monorepo com:

- `apps/api`;
- `apps/web`;
- `packages/shared`;
- `packages/api-contracts`;
- `docs/sdd`;
- `.claude`.

## Alternativas Consideradas

- Repositórios separados para frontend e backend.
- Projeto único sem separação de apps.

## Consequências

Positivas:

- facilita validações e evolução incremental;
- mantém specs próximas ao código;
- permite tipos e contratos compartilhados;
- simplifica onboarding dos desenvolvedores.

Negativas:

- exige organização clara;
- pode parecer grande no início do projeto.

## Impacto no Projeto

Claude Code deve sempre considerar o contexto do monorepo antes de alterar arquivos.
