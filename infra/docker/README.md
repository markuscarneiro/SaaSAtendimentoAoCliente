<!-- Projeto Desenvolvido na Data Science Academy -->

# Docker

Esta pasta concentra arquivos e decisões de infraestrutura Docker.

A execução oficial do projeto deve ser 100% containerizada. A máquina host não deve precisar de Node.js, PostgreSQL, Redis ou ferramentas de migration instaladas diretamente.

Comandos oficiais esperados:

```bash
docker compose up --build
docker compose down
docker compose down -v
docker compose logs -f api
docker compose exec api <comando>
docker compose run --rm api <comando-de-teste>
docker compose run --rm web <comando-de-teste>
```

Specs relacionadas:

- `docs/sdd/specs/docker-execution-spec.md`
- `docs/sdd/specs/deployment-spec.md`
- `docs/sdd/architecture.md`
