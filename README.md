<!-- Projeto Desenvolvido na Data Science Academy -->

# Projeto 1 - Construindo Um SaaS de Atendimento ao Cliente

Este repositório organiza o projeto **SaaS de Atendimento ao Cliente** (sem IA/RAG; foco em backend, API e dashboard).

O projeto é full stack, mas a ênfase operacional está no backend e no uso de **Spec-Driven Development** para conduzir programação assistida por IA com Claude Code ou outro assistente.

## Regra de execução

O projeto deve executar 100% em Docker.

A máquina host deve precisar apenas de Docker, Docker Compose, Git e Claude Code/editor. Backend, frontend, PostgreSQL, Redis, migrations, testes e smoke tests devem rodar em containers.

Spec principal:

- [Docker Execution Spec](docs/sdd/specs/docker-execution-spec.md)

## Estrutura principal

Esta é a **estrutura-alvo** do monorepo. No início, o repositório contém apenas specs (`docs/`), configuração do Claude Code (`.claude/`), skills e os `CLAUDE.md` locais de cada app. As pastas de código (`apps/*/src`, `packages/*`, `infra/ci`, `infra/deploy`, `scripts`) **não existem ainda**: são criadas sob demanda durante a implementação, pela task que as introduz, seguindo `docs/sdd/architecture.md` (§7 módulos, §3/§8 infra) e o `CLAUDE.md` local de cada app. Não criamos pastas vazias antecipadamente.

```text
projeto-1-saas-atendimento-ia/
  apps/
    api/
    web/

  docs/
    roadmap/
    sdd/
      adr/
      specs/
    prompts/

  .claude/
    skills/
    agents/

  packages/
    shared/
    api-contracts/
    config/
    testing/

  infra/
    docker/
    ci/
    deploy/

  skills/
  scripts/
```

## Papel de cada pasta

- `apps/api`: backend principal da aplicação. _(hoje só `CLAUDE.md`; código criado durante a implementação)_
- `apps/web`: dashboard administrativo do SaaS. _(hoje só `CLAUDE.md`; código criado durante a implementação)_
- `docs/roadmap`: roadmap de implementação do projeto.
- `docs/sdd`: artefatos SDD que guiarão a implementação.
- `docs/sdd/specs`: specs específicas por funcionalidade.
- `docs/sdd/adr`: decisões arquiteturais.
- `docs/prompts`: biblioteca de prompts e workflows para Claude Code.
- `.claude/skills`: fonte oficial das skills executadas pelo Claude Code.
- `.claude/agents`: subagentes para planejamento, implementação e revisão.
- `packages/shared`: tipos, constantes e schemas compartilhados. _(criado durante a implementação)_
- `packages/api-contracts`: contratos de request, response e erros entre frontend e backend. _(criado durante a implementação)_
- `packages/config`: configurações compartilhadas de lint, TypeScript e formatação. _(criado durante a implementação)_
- `packages/testing`: factories, mocks e fixtures de teste. _(criado durante a implementação)_
- `infra`: Docker, CI/CD e documentação de deploy. Hoje só `infra/docker/`; `infra/ci` e `infra/deploy` _(criados durante a implementação)_.
- `skills`: biblioteca de referência e espelho agnóstico das skills; não deve ser usada junto com `.claude/skills` na mesma tarefa.
- `scripts`: automações locais do projeto. _(criado durante a implementação)_

## Uso com Claude Code

Arquivo de instruções do projeto:

- [CLAUDE.md](CLAUDE.md)
- [Configuração Nativa do Claude Code](.claude/README.md)
- [Configuração do Claude Code](.claude/settings.json)
- [Regras por Caminho do Claude Code](.claude/rules)

Prompts prontos:

- [Prompts Para Claude Code](docs/prompts/README.md)
- [Workflow no Claude Code](docs/prompts/claude-code-workflow.md)
- [Biblioteca de Prompts](docs/prompts/prompt-library.md)
- [Prompts Por Funcionalidade](docs/prompts/feature-implementation-prompts.md)
- [Prompts de Validação](docs/prompts/validation-prompts.md)

Skills reutilizáveis:

- [Índice de Skills](skills/README.md)
- [Skills Nativas do Claude Code](.claude/skills)
- [Subagentes do Claude Code](.claude/agents)
- [Contexto Local do Backend](apps/api/CLAUDE.md)
- [Contexto Local do Frontend](apps/web/CLAUDE.md)

## Documentação do Projeto

Roadmap principal:

- [Roadmap do Projeto](docs/roadmap/project-roadmap.md)

## Artefatos SDD

Estes documentos em `docs/sdd` compõem a base de especificação do projeto:

- `product-brief.md`;
- `constitution.md`;
- `requirements.md`;
- `architecture.md`;
- `domain-model.md`;
- `api-contract.md`;
- `openapi.yaml`;
- `database-schema.md`;
- `security-spec.md`;
- `test-plan.md`;
- `implementation-plan.md`;
- `tasks.md`;
- `acceptance-criteria.md`;
- `traceability-matrix.md`;
- `build-playbook.md`.

Specs específicas ficam em `docs/sdd/specs`, como:

- `auth-spec.md`;
- `authorization-spec.md`;
- `user-management-spec.md`;
- `conversation-history-spec.md`;
- `analytics-spec.md`;
- `admin-dashboard-spec.md`;
- `docker-execution-spec.md`;
- `deployment-spec.md`;
- `seed-spec.md`.

Esses artefatos devem ser tratados como documentos vivos. Toda funcionalidade relevante começa pela especificação, passa pela implementação assistida por IA e termina em validação contra critérios de aceite.
