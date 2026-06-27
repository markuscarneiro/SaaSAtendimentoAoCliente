<!-- Projeto Desenvolvido na Data Science Academy -->

# Docker Execution Spec

## 1. Objetivo

Definir a regra de execução 100% em Docker para o projeto.

O projeto deve rodar localmente, em CI e em deploy por meio de containers. A máquina host não deve precisar instalar Node.js, package manager, PostgreSQL, Redis, banco vetorial ou qualquer runtime da aplicação.

## 2. Decisão

A execução oficial do projeto é baseada em Docker.

Dependências permitidas no host:

- Docker Desktop ou Docker Engine;
- Docker Compose v2;
- Git;
- Claude Code ou editor usado para desenvolvimento.

Dependências proibidas como requisito de execução no host:

- Node.js;
- npm, pnpm ou yarn;
- PostgreSQL;
- Redis;
- ferramentas de migration instaladas localmente.

Essas dependências podem existir na máquina do desenvolvedor, mas não podem ser necessárias para executar, testar ou validar o projeto.

## 3. Serviços Obrigatórios no Docker Compose

O `docker-compose.yml` deve orquestrar:

- `api`: backend principal;
- `web`: dashboard administrativo;
- `postgres`: banco transacional;
- `redis`: cache e rate limit;
- serviços auxiliares opcionais, quando necessários para o fluxo de desenvolvimento.

O Compose deve usar uma rede interna para comunicação entre serviços e expor apenas as portas necessárias para acesso pelo navegador e por ferramentas de debug.

## 4. Dockerfiles

O projeto deve conter Dockerfiles para:

- API;
- frontend web.

Os Dockerfiles devem:

- instalar dependências dentro da imagem;
- executar build dentro da imagem;
- usar multi-stage build quando fizer sentido;
- não copiar arquivos sensíveis;
- não depender de artefatos gerados no host.

## 5. Comandos Oficiais

Os comandos oficiais devem usar Docker Compose:

```bash
docker compose up --build
docker compose down
docker compose down -v
docker compose ps
docker compose logs -f api
docker compose exec api <comando>
docker compose run --rm api <comando-de-teste>
docker compose run --rm web <comando-de-teste>
```

Scripts no `package.json`, quando existirem, devem ser conveniências que delegam para Docker Compose, não a forma primária de executar o projeto fora de containers.

## 6. Variáveis de Ambiente

O projeto deve fornecer:

- `.env.example`;
- `.env.docker.example`, se houver diferença entre host e rede Docker;
- documentação das variáveis usadas por cada serviço.

Valores reais de segredo nunca devem ser commitados.

## 7. Migrations e Seeds

Migrations e seeds devem rodar dentro do container da API ou de um container específico de tooling.

Exemplos de padrão esperado:

```bash
docker compose exec api <comando-de-migration>
docker compose exec api <comando-de-seed>
```

Nenhuma migration deve exigir CLI instalada diretamente no host.

## 8. Testes

Testes devem rodar dentro de containers.

Regras:

- testes de integração podem usar `postgres` e `redis` do Compose;
- smoke tests validam o ambiente subido pelo Compose;
- CI deve construir imagens e executar validações em containers.

## 8.1 Non-Goals

- Kubernetes ou orquestração multi-host (Compose é suficiente para o MVP);
- dev containers/devcontainer.json como requisito;
- imagens publicadas em registry público (build local basta no MVP).

## 8.2 Casos de Borda

- porta já ocupada no host (ex.: 3000/5432): portas expostas devem ser configuráveis via variáveis no `.env`;
- volumes com dados de execuções antigas causando estado inconsistente: `docker compose down -v` é o reset documentado;
- arquitetura do host (arm64 vs amd64): usar imagens oficiais multi-arch; nada no build pode assumir arquitetura;
- primeira subida antes de existir migration: serviços de banco sobem saudáveis e a API aguarda banco pronto (healthcheck/depends_on com condição).

## 8.3 Riscos e Questões Abertas

Riscos:

- tempo de build alto a cada mudança: mitigar com multi-stage e cache de camadas (dependências antes do código);
- divergência entre ambiente local e CI: mitigada porque ambos usam as mesmas imagens e comandos Compose.

Questões abertas:

- compose de produção dedicado (`docker-compose.prod.yml`) é detalhado em `deployment-spec.md` e decidido na T4.2.

## 9. Critérios de Aceite

A execução Docker é aceita quando:

- `docker compose up --build` sobe API, web, PostgreSQL e Redis;
- a aplicação pode ser acessada sem instalar runtime da aplicação no host;
- migrations rodam em container;
- testes rodam em container;
- smoke tests rodam contra o ambiente do Compose;
- documentação lista apenas comandos baseados em Docker Compose;
- CI valida build de imagem e testes containerizados.

## 10. Prompt Para Claude Code

```text
Leia docs/sdd/specs/docker-execution-spec.md, docs/sdd/architecture.md e docs/sdd/specs/deployment-spec.md.

Garanta que a execução do projeto seja 100% Docker:
1. crie Dockerfiles para api e web;
2. crie docker-compose.yml com api, web, postgres e redis;
3. garanta que migrations, testes e smoke tests rodem em containers;
4. atualize README e .env.example;
5. não crie instruções que exijam Node.js, PostgreSQL ou Redis instalados no host.

Antes de editar arquivos, apresente plano, comandos oficiais e riscos.
```

## 11. Histórico de Mudanças

- **1.1 (2026-06-09):** adicionados non-goals, casos de borda (portas, volumes, multi-arch) e riscos/questões abertas, conforme `spec-template.md`.
- **1.0 (2026-06-03):** versão inicial.

**Versão:** 1.1  
**Status:** Proposta  
**Owner:** Equipe do projeto  
**Última atualização:** 2026-06-09  
**Substitui:** N/A
