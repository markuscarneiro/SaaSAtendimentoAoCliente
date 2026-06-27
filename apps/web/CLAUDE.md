<!-- Projeto Desenvolvido na Data Science Academy -->

# CLAUDE.md - apps/web

Contexto local do dashboard administrativo.

- Leia `docs/sdd/specs/admin-dashboard-spec.md` e `docs/sdd/api-contract.md` antes de alterar telas.
- Para comandos, build e testes, siga `docs/sdd/specs/docker-execution-spec.md`.
- O frontend não decide autorização final; ele apenas reflete permissões vindas da API.
- Toda tela deve ter estados de loading, erro, vazio e sucesso.
- Prefira componentes simples que validem o produto sem roubar o foco operacional do backend.

## Estrutura-alvo

As pastas abaixo ainda não existem; crie-as sob demanda na task que as introduz (não pré-crie pastas vazias). O framework do frontend está proposto no ADR-0005 (React + Vite + TypeScript) — confirme o status do ADR antes de iniciar T3.2.

```text
apps/web/
  Dockerfile
  package.json
  public/
  src/
    app/
    features/       # auth, conversations, analytics, settings
    components/
    services/       # cliente HTTP que consome os contratos de api-contract.md
    lib/
    styles/
```
