<!-- Projeto Desenvolvido na Data Science Academy -->

# CLAUDE.md - Instruções do Projeto

Você está trabalhando no projeto **SaaS de Atendimento ao Cliente** (sem IA/RAG; foco em backend, API e dashboard).

O objetivo é construir uma aplicação full stack com ênfase no backend, usando **Spec-Driven Development** para conduzir programação assistida por IA.

## Regras de Trabalho

1. Antes de implementar, leia `docs/sdd/constitution.md` e os artefatos SDD relevantes em `docs/sdd`.
2. Não implemente com base apenas em descrição solta do usuário.
3. Antes de alterar arquivos, apresente um plano curto com:
   - specs consultadas;
   - arquivos prováveis;
   - testes necessários;
   - riscos.
4. Implemente em fatias pequenas, preferencialmente a partir de `docs/sdd/tasks.md`.
5. Não altere contratos de API sem pedir confirmação.
6. Backend é a fonte de verdade das regras de negócio.
7. Toda regra de tenant deve considerar `organizationId`.
8. A execução oficial deve ser 100% Docker. Não introduza comandos obrigatórios que dependam de Node.js, banco, Redis ou ferramentas instaladas no host.
9. Ao finalizar, informe arquivos alterados, validações executadas e riscos remanescentes.

## Ordem de Consulta Recomendada

Para qualquer tarefa relevante, consulte:

1. `docs/sdd/README.md`
2. `docs/sdd/constitution.md`
3. `docs/sdd/product-brief.md`
4. `docs/sdd/requirements.md`
5. `docs/sdd/architecture.md`
6. `docs/sdd/api-contract.md`
7. `docs/sdd/specs/docker-execution-spec.md`, quando a tarefa envolver setup, scripts, testes, CI ou deploy
8. spec específica em `docs/sdd/specs/`
9. `docs/sdd/tasks.md`
10. `docs/sdd/acceptance-criteria.md`
11. `docs/sdd/test-plan.md`

## Skills

Fonte oficial de execução:

- `.claude/skills/`

Biblioteca de referência:

- `skills/`

A pasta `skills/` existe como catálogo legível e espelho agnóstico das skills. Não use `skills/` e `.claude/skills/` ao mesmo tempo na mesma tarefa.

Quando uma tarefa precisar de skill, use apenas a versão nativa em `.claude/skills/`. Se houver divergência entre as duas pastas, `.claude/skills/` é a fonte de verdade para execução no Claude Code.

Quando o usuário pedir uma tarefa, escolha uma única skill adequada. Exemplos:

- fluxo SDD: `.claude/skills/specify/SKILL.md`, `.claude/skills/plan/SKILL.md`, `.claude/skills/tasks/SKILL.md`, `.claude/skills/implement/SKILL.md`
- backend endpoint: `.claude/skills/backend-endpoint/SKILL.md`
- auth/autorização: `.claude/skills/auth-authorization/SKILL.md`
- frontend/dashboard: `.claude/skills/frontend-dashboard/SKILL.md`
- testes: `.claude/skills/test-writer/SKILL.md`
- revisão de segurança: `.claude/skills/security-review/SKILL.md`

## Subagentes

Subagentes ficam em `.claude/agents/` e o fluxo recomendado está em `.claude/README.md`:

- `planner`: transforma uma spec em plano técnico, sem alterar código;
- `implementer`: executa uma task pequena por vez;
- `code-reviewer`: revisa código contra specs e critérios de aceite;
- `security-reviewer`: revisa auth, autorização, tenant, dados, IA e segurança.

Fluxo: planejar com `planner` → implementar uma task de `docs/sdd/tasks.md` com `implementer` → revisar com `code-reviewer` e `security-reviewer` antes de considerar pronto.

## Definição de Pronto

Uma tarefa só está pronta quando:

- a spec correspondente foi consultada;
- o plano foi apresentado;
- a task em `docs/sdd/tasks.md` foi respeitada, quando aplicável;
- a implementação respeita o escopo;
- testes relevantes foram criados ou atualizados;
- validações disponíveis foram executadas;
- critérios de aceite foram revisados;
- pendências foram documentadas.

## Estilo de Resposta

Seja direto, técnico e cuidadoso. Quando houver ambiguidade, pergunte antes de implementar. Quando a spec estiver insuficiente, diga exatamente o que falta.
