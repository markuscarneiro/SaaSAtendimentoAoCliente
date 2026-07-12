<!-- Projeto Desenvolvido na Data Science Academy -->

# Projeto 1 - Construindo Um SaaS de Atendimento ao Cliente

Este repositório organiza o projeto **SaaS de Atendimento ao Cliente** (sem IA/RAG; foco em backend, API e dashboard).

O projeto é full stack, mas a ênfase operacional está no backend e no uso de **Spec-Driven Development** para conduzir programação assistida por IA com Claude Code ou outro assistente.

## Regra de execução

O projeto deve executar 100% em Docker.

A máquina host deve precisar apenas de Docker, Docker Compose, Git e Claude Code/editor. Backend, frontend, PostgreSQL, Redis, migrations, testes e smoke tests devem rodar em containers.

Spec principal:

- [Docker Execution Spec](docs/sdd/specs/docker-execution-spec.md)

## Rodando localmente (desenvolvimento)

```bash
cp .env.docker.example .env
docker compose up --build
```

Isso sobe API (`:3000`), web (`:5173`), PostgreSQL e Redis. Comandos úteis:

```bash
docker compose run --rm api pnpm db:migrate   # aplica migrations
docker compose run --rm api pnpm db:seed      # popula dados de demonstração
docker compose run --rm api pnpm test         # testes do backend
docker compose run --rm web pnpm test         # testes do frontend
docker compose run --rm smoke-test            # smoke tests (ver seção Deploy)
docker compose down                           # para os containers (mantém dados)
docker compose down -v                        # reset completo (apaga volumes)
```

Para explorar o dashboard com dados de exemplo, rode o seed (`docker compose run --rm api pnpm db:seed`) e acesse http://localhost:5173. Credenciais de demo em [`docs/sdd/specs/seed-spec.md`](docs/sdd/specs/seed-spec.md).

## Screenshots

| Login | Conversas |
|---|---|
| ![Tela de login](docs/screenshots/login.png) | ![Lista de conversas](docs/screenshots/conversations.png) |

| Detalhe da conversa | Analytics |
|---|---|
| ![Detalhe da conversa](docs/screenshots/conversation-detail.png) | ![Tela de analytics](docs/screenshots/analytics.png) |

## Deploy

Spec de referência: [Deployment Spec](docs/sdd/specs/deployment-spec.md).

### Variáveis de ambiente

Copie [`.env.prod.example`](.env.prod.example) para `.env` e preencha com valores reais (nunca commitados). Todas as variáveis abaixo são **obrigatórias** em produção — `docker-compose.prod.yml` falha o `up` imediatamente se alguma estiver ausente:

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | sim | string de conexão do PostgreSQL |
| `REDIS_URL` | sim | string de conexão do Redis |
| `JWT_SECRET` | sim | mínimo 32 caracteres, aleatório |
| `APP_BASE_URL` | sim | URL pública do dashboard (usada no CORS do backend) |
| `API_BASE_URL` | sim | URL pública da API (embutida no build do frontend) |
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` | sim | credenciais do banco |
| `JWT_EXPIRES_IN` | não (default `24h`) | validade do token |
| `RATE_LIMIT_LOGIN_MAX` / `RATE_LIMIT_LOGIN_WINDOW_SECONDS` | não (defaults `10`/`900`) | rate limit de login (`security-spec.md` §8) |
| `API_PORT` / `WEB_PORT` | não | portas expostas ao host |

### Ordem de deploy (`deployment-spec.md` §6)

```bash
# 1-2. Provisionar banco e Redis (sobem junto no passo 4)
# 3. Configurar variáveis
cp .env.prod.example .env   # preencher com valores reais

# 4. Buildar imagens (target `runtime` — imagem mínima de produção)
docker compose -f docker-compose.prod.yml build

# 5. Subir backend (+ banco/redis, dependências do api)
docker compose -f docker-compose.prod.yml up -d postgres redis api

# 6. Executar migrations em container (stage `build`, que tem o Prisma CLI —
#    a imagem `runtime` só tem as dependências de produção)
docker compose -f docker-compose.prod.yml run --rm migrate

# 7. Subir frontend
docker compose -f docker-compose.prod.yml up -d web

# 8. Smoke tests em container (deployment-spec.md §7)
docker compose -f docker-compose.prod.yml run --rm smoke-test
```

Um `503` no health check (`GET /api/v1/health`) após o deploy deve ser tratado como deploy falho, mesmo com o processo de pé (`deployment-spec.md` §8.2).

### Rollback (`deployment-spec.md` §9)

Em caso de falha:

1. reverter a versão da imagem da API (`docker compose -f docker-compose.prod.yml up -d --no-deps api` apontando para a tag anterior);
2. **não** reverter uma migration destrutiva sem plano explícito — preferir migrations aditivas e compatíveis com a versão anterior;
3. preservar logs (`docker compose -f docker-compose.prod.yml logs api > incident-$(date +%s).log`);
4. registrar o incidente.

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
