<!-- Projeto Desenvolvido na Data Science Academy -->

# ADR-0006 - Execução 100% em Docker

## Status

Aceita.

## Contexto

O projeto precisa ser reproduzível em qualquer máquina e deve evitar dependência de runtimes instalados no host.

Em uma aplicação full stack com backend, frontend, banco e Redis, pequenas diferenças de ambiente podem gerar falhas difíceis de diagnosticar.

## Decisão

A execução oficial do projeto será 100% baseada em Docker.

Todo desenvolvimento local, teste, migration, seed, smoke test e deploy deve ser executado por containers ou por comandos que deleguem para Docker Compose.

A máquina host precisa apenas de:

- Docker Desktop ou Docker Engine;
- Docker Compose v2;
- Git;
- Claude Code ou editor.

## Consequências Positivas

- reduz divergência entre ambientes;
- facilita onboarding;
- torna CI mais próximo do ambiente local;
- centraliza dependências;
- simplifica reprodução de bugs.

## Consequências Negativas

- imagens podem aumentar o tempo inicial de setup;
- hot reload precisa ser configurado com cuidado;
- volumes e permissões exigem atenção;
- consumo de memória pode ser maior.

## Referências

- `docs/sdd/specs/docker-execution-spec.md`
- `docs/sdd/specs/deployment-spec.md`
- `docs/sdd/architecture.md`
