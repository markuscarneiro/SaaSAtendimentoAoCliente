<!-- Projeto Desenvolvido na Data Science Academy -->

# Claude Code Workflow - Projeto 1

Este workflow deve ser repetido em cada etapa prática do Projeto 1.

## 1. Abrir Sessão

Use quando iniciar um novo bloco de trabalho.

```text
Leia CLAUDE.md e docs/sdd/README.md.

Depois leia:
- docs/sdd/constitution.md
- docs/sdd/product-brief.md
- docs/sdd/requirements.md
- docs/sdd/architecture.md
- docs/sdd/implementation-plan.md
- docs/sdd/tasks.md

Resuma:
1. objetivo do produto;
2. escopo do MVP;
3. arquitetura principal;
4. fase atual do implementation-plan;
5. próxima menor task implementável;
6. riscos técnicos mais importantes.

Não implemente nada ainda.
```

## 2. Selecionar Skill

Use para orientar o assistente antes de uma tarefa específica.

```text
Siga a skill .claude/skills/{NOME_DA_SKILL}/SKILL.md.

Tarefa:
{DESCREVA_A_TAREFA}

Antes de implementar:
1. liste as specs que você vai consultar;
2. resuma o entendimento;
3. aponte ambiguidades;
4. proponha um plano incremental;
5. liste testes necessários;
6. indique a task correspondente em docs/sdd/tasks.md, se existir.

Não altere arquivos até apresentar o plano.
```

## 3. Revisar Spec

Use antes de codar uma funcionalidade.

```text
Revise a spec abaixo antes da implementação:

- {CAMINHO_DA_SPEC}
- docs/sdd/api-contract.md
- docs/sdd/domain-model.md
- docs/sdd/security-spec.md
- docs/sdd/acceptance-criteria.md

Quero que você identifique:
1. ambiguidades;
2. conflitos com outras specs;
3. critérios de aceite ausentes;
4. riscos de segurança;
5. testes obrigatórios.

Não implemente código.
```

## 4. Planejar Implementação

Use depois que a spec estiver clara.

```text
Com base nas specs consultadas, crie um plano de implementação incremental para:

{FUNCIONALIDADE}

O plano deve conter:
1. ordem das etapas;
2. arquivos prováveis;
3. alterações de banco, se houver;
4. endpoints afetados;
5. testes por etapa;
6. riscos;
7. critério de parada da primeira etapa.

Não implemente ainda.
```

## 5. Implementar Primeira Fatia

Use para evitar que o assistente tente fazer tudo de uma vez.

```text
Implemente apenas a primeira etapa do plano aprovado.

Restrições:
- não altere escopo;
- não altere contrato de API sem pedir confirmação;
- siga os padrões existentes;
- adicione ou atualize testes relacionados;
- use fakes para provedores externos;
- preserve isolamento por organizationId.

Ao final, informe arquivos alterados e validações executadas.
```

## 6. Rodar Validações

Use depois da implementação.

```text
Rode as validações disponíveis para a alteração feita:

1. testes relacionados;
2. typecheck, se existir;
3. lint, se existir;
4. build, se fizer sentido.

Se algo falhar:
- explique a causa provável;
- proponha correção;
- corrija apenas o necessário.
```

## 7. Revisar Contra Critérios de Aceite

Use antes de considerar a tarefa pronta.

```text
Compare a implementação com:

- docs/sdd/acceptance-criteria.md
- {SPEC_ESPECIFICA}
- docs/sdd/test-plan.md

Classifique cada critério como:
- OK;
- Parcial;
- Falta;
- Não se aplica.

Liste também:
1. riscos remanescentes;
2. testes faltantes;
3. possíveis melhorias fora do escopo.

Não implemente melhorias fora do escopo.
```

## 8. Atualizar Spec

Use quando uma decisão mudar o comportamento planejado.

```text
A implementação exigiu uma mudança de comportamento em relação à spec.

Atualize a documentação relevante antes de continuar:
- {SPEC_AFETADA}
- docs/sdd/api-contract.md, se contrato mudou;
- docs/sdd/database-schema.md, se schema mudou;
- docs/sdd/architecture.md ou ADR, se decisão arquitetural mudou.

Explique o motivo da alteração.
```

## 9. Fechar Aula

Use para gerar resumo operacional.

```text
Gere um resumo operacional da etapa atual:

1. problema resolvido;
2. specs usadas;
3. prompts usados;
4. decisões tomadas;
5. arquivos alterados;
6. testes executados;
7. erros ou ajustes feitos pela IA;
8. lição principal sobre SDD.

O resumo deve ser útil para desenvolvedores revisarem depois.
```

## 10. Gerenciar Sessão no Claude Code

Use estas regras para evitar contexto poluído e reduzir custo.

### 10.1 Usar `/clear`

Use `/clear` quando:

- terminar uma tarefa e começar outra não relacionada;
- o Claude começar a misturar assuntos;
- duas tentativas de correção falharem;
- o contexto estiver cheio de exploração antiga.

Prompt após `/clear`:

```text
Leia CLAUDE.md, docs/sdd/constitution.md, docs/sdd/tasks.md e a spec da tarefa atual.

Retome somente a task abaixo:
{TASK}

Não use decisões de sessões anteriores que não estejam documentadas em specs, tasks ou ADRs.
```

### 10.2 Usar `/resume`

Use `/resume` quando:

- a tarefa é longa, mas ainda é a mesma;
- há contexto útil na sessão anterior;
- você precisa continuar uma implementação interrompida.

Ao retomar, peça:

```text
Resuma o estado atual da sessão, arquivos alterados, validações executadas e próxima ação segura.
```

### 10.3 Usar `/rewind`

Use `/rewind` quando:

- o Claude seguiu uma direção errada;
- uma alteração grande contaminou a sessão;
- você quer voltar antes de um plano ruim ou diff ruim.

Depois do rewind:

```text
Antes de tentar novamente, explique por que a abordagem anterior falhou e proponha um plano menor.
```

### 10.4 Abrir Sessão Nova Após Plano

Para tarefas grandes:

1. use uma sessão em Plan Mode para explorar e planejar;
2. registre o plano em `docs/sdd/tasks.md` ou na conversa;
3. abra uma sessão nova;
4. peça implementação apenas da primeira task.

Prompt:

```text
Esta é uma sessão nova focada em implementação.

Leia CLAUDE.md, docs/sdd/constitution.md, docs/sdd/tasks.md e as specs da task T{ID}.

Implemente apenas essa task. Não retome exploração anterior que não esteja documentada.
```
