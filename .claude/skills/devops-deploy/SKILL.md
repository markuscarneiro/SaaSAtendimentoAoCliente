---
name: devops-deploy
description: Use para configurar CI/CD, Docker, variáveis de ambiente, health check, smoke tests e documentação de deploy do Projeto 1.
disable-model-invocation: true
---

<!-- Projeto Desenvolvido na Data Science Academy -->

# DevOps Deploy

## Quando Usar

Use em tarefas de Docker, CI/CD, deploy, health check, scripts e variáveis de ambiente.

## Leia Primeiro

- `docs/sdd/specs/docker-execution-spec.md`
- `docs/sdd/specs/deployment-spec.md`
- `docs/sdd/architecture.md`
- comandos oficiais baseados em Docker Compose
- arquivos em `infra/`

## Workflow

1. Identifique ambiente alvo.
2. Liste serviços necessários.
3. Documente variáveis sem segredos reais.
4. Configure health check.
5. Configure lint, typecheck, tests e build.
6. Configure Dockerfiles e Docker Compose.
7. Configure deploy containerizado.
8. Adicione smoke tests básicos em containers.

## Regras

- Nunca commitar segredos reais.
- CI deve construir imagens e usar comandos containerizados.
- Migrations precisam de ordem clara e devem executar em container.
- Não criar comando obrigatório que dependa de Node.js, banco ou Redis no host.

## Saída Esperada

Informe:

- arquivos de infra alterados;
- variáveis documentadas;
- comandos de validação;
- passos de deploy.
