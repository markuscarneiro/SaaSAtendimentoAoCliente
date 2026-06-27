<!-- Projeto Desenvolvido na Data Science Academy -->

# Prompts Para Claude Code - Projeto 1

Esta pasta contém prompts prontos para conduzir o Claude Code durante o Projeto 1.

Use estes prompts como blocos reutilizáveis no fluxo do projeto. A lógica é sempre a mesma:

1. contexto;
2. leitura das specs;
3. crítica;
4. plano;
5. implementação pequena;
6. testes;
7. revisão contra critérios de aceite.

## Arquivos

- [Claude Code Workflow](claude-code-workflow.md): sequência operacional para cada sessão.
- [Prompt Library](prompt-library.md): biblioteca geral de prompts por tipo de tarefa.
- [Feature Implementation Prompts](feature-implementation-prompts.md): prompts específicos por módulo do Projeto 1.
- [Validation Prompts](validation-prompts.md): prompts para usar em validações operacionais.

## Prompt Inicial Recomendado

```text
Leia CLAUDE.md e docs/sdd/README.md. Em seguida, leia constitution.md, product-brief.md, requirements.md, architecture.md, implementation-plan.md e tasks.md. Resuma o produto, o MVP, a arquitetura e a próxima menor task implementável. Não escreva código ainda.
```
