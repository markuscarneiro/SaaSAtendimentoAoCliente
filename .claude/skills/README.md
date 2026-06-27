<!-- Projeto Desenvolvido na Data Science Academy -->

# Skills de Referência - Projeto 1

Este diretório contém uma biblioteca de referência das skills do Projeto 1.

Cada skill é um diretório com um `SKILL.md`. Esta pasta é mantida como catálogo legível e espelho agnóstico das instruções.

## Fonte Oficial Para Claude Code

Para execução no Claude Code, a fonte oficial é:

```text
.claude/skills/
```

A pasta `skills/` não deve ser usada diretamente pelo Claude Code quando existir uma versão correspondente em `.claude/skills/`.

Regra anti-duplicidade:

- use `.claude/skills/<nome>/SKILL.md` para executar tarefas no Claude Code;
- use `skills/<nome>/SKILL.md` apenas como referência documental;
- não peça ao Claude para seguir as duas versões na mesma tarefa;
- se houver divergência, `.claude/skills/` prevalece para execução.

## Skills Disponíveis

- [SDD Review](sdd-review/SKILL.md): revisar specs antes de implementar.
- [Backend Endpoint](backend-endpoint/SKILL.md): implementar endpoints backend orientados por contrato.
- [API Contract Review](api-contract-review/SKILL.md): revisar consistência de contratos de API.
- [Database Migration](database-migration/SKILL.md): criar ou revisar schema e migrations.
- [Auth Authorization](auth-authorization/SKILL.md): implementar autenticação, autorização e multi-tenancy.
- [Test Writer](test-writer/SKILL.md): escrever testes alinhados aos critérios de aceite.
- [Security Review](security-review/SKILL.md): revisar riscos de segurança, tenant e validação de entrada.
- [ADR Writer](adr-writer/SKILL.md): registrar decisões arquiteturais.
- [Frontend Dashboard](frontend-dashboard/SKILL.md): implementar dashboard consumindo contratos reais.
- [DevOps Deploy](devops-deploy/SKILL.md): configurar CI/CD, Docker, health check e deploy.

## Skills Exclusivas do Fluxo SDD (apenas em `.claude/skills/`)

As skills operacionais do fluxo SDD são nativas do Claude Code e existem somente em `.claude/skills/`; elas não têm espelho aqui propositalmente:

- `specify`: criar ou evoluir specs;
- `plan`: gerar plano técnico;
- `tasks`: quebrar plano em tasks;
- `implement`: executar a próxima task pequena.

## Como Usar Como Referência

Use uma skill por tarefa. Para execução com Claude Code, aponte para `.claude/skills`. Exemplo:

```text
Siga a skill .claude/skills/backend-endpoint/SKILL.md.
Implemente POST /api/v1/conversations seguindo docs/sdd/api-contract.md e docs/sdd/specs/conversation-history-spec.md.
Antes de codar, apresente o plano.
```

## Regra Operacional

Se o Claude Code tentar implementar sem ler specs, interrompa e peça:

```text
Pare. Primeiro leia os artefatos SDD relevantes, resuma o entendimento, liste ambiguidades e só depois proponha um plano.
```
