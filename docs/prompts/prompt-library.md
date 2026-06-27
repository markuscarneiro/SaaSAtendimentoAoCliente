<!-- Projeto Desenvolvido na Data Science Academy -->

# Prompt Library - Projeto 1

Biblioteca de prompts reutilizáveis para Claude Code.

Use os placeholders entre chaves, como `{FUNCIONALIDADE}`, `{SPEC}` e `{ENDPOINT}`.

## 1. Prompts de Contexto

### 1.1 Entendimento Inicial

```text
Leia CLAUDE.md e docs/sdd/README.md.

Depois leia os documentos centrais:
- docs/sdd/constitution.md
- docs/sdd/product-brief.md
- docs/sdd/requirements.md
- docs/sdd/architecture.md
- docs/sdd/implementation-plan.md
- docs/sdd/tasks.md

Resuma o produto, o MVP, a arquitetura, as restrições e a próxima menor task implementável.

Não implemente código.
```

### 1.2 Mapa de Specs

```text
Leia docs/sdd/README.md e crie um mapa de quais specs devem ser consultadas para implementar {FUNCIONALIDADE}.

Para cada spec, diga:
1. por que ela importa;
2. quais decisões ela contém;
3. quais riscos ela ajuda a reduzir.

Não implemente nada.
```

## 2. Prompts de Crítica

### 2.1 Criticar Spec

```text
Siga .claude/skills/sdd-review/SKILL.md.

Revise {SPEC}.

Procure:
1. ambiguidades;
2. requisitos não testáveis;
3. conflitos com api-contract.md;
4. conflitos com database-schema.md;
5. riscos de segurança;
6. critérios de aceite faltantes.

Não implemente código.
```

### 2.2 Comparar Spec e Código

```text
Compare a implementação atual de {FUNCIONALIDADE} com:
- {SPEC}
- docs/sdd/acceptance-criteria.md
- docs/sdd/test-plan.md

Liste divergências objetivas entre spec e código.

Não corrija ainda. Primeiro apresente o diagnóstico.
```

## 3. Prompts de Planejamento

### 3.1 Plano Incremental

```text
Crie um plano incremental para implementar {FUNCIONALIDADE}.

Consulte:
- {SPEC}
- docs/sdd/api-contract.md
- docs/sdd/domain-model.md
- docs/sdd/database-schema.md
- docs/sdd/security-spec.md
- docs/sdd/test-plan.md

O plano deve conter:
1. etapas pequenas;
2. arquivos prováveis;
3. migrations, se houver;
4. endpoints;
5. testes;
6. riscos;
7. primeira etapa recomendada.

Não implemente ainda.
```

### 3.2 Plano de Refatoração

```text
Analise {AREA_OU_MODULO} e proponha um plano de refatoração sem mudar comportamento.

Restrições:
- preservar contratos de API;
- preservar testes existentes;
- não alterar schema sem necessidade;
- não ampliar escopo.

Liste riscos e ordem segura de execução.
```

## 4. Prompts de Implementação

### 4.1 Implementar Endpoint

```text
Siga .claude/skills/backend-endpoint/SKILL.md.

Implemente {ENDPOINT} seguindo:
- docs/sdd/api-contract.md
- {SPEC}
- docs/sdd/security-spec.md
- docs/sdd/test-plan.md

Implemente em uma fatia pequena:
1. contrato/DTO/schema;
2. service;
3. controller/route;
4. testes.

Não altere outros endpoints.
```

### 4.2 Implementar Migration

```text
Siga .claude/skills/database-migration/SKILL.md.

Implemente a migration necessária para {FUNCIONALIDADE}.

Antes de criar a migration, compare:
- docs/sdd/domain-model.md
- docs/sdd/database-schema.md
- {SPEC}

Liste tabelas, campos, índices e constraints antes de alterar arquivos.
```

### 4.3 Implementar Testes

```text
Siga .claude/skills/test-writer/SKILL.md.

Crie testes para {FUNCIONALIDADE}.

Cubra:
1. cenário feliz;
2. payload inválido;
3. usuário sem permissão;
4. cross-tenant, se aplicável;
5. falha de provider externo, se aplicável.

Não chame serviços reais externos.
```

## 5. Prompts de Revisão

### 5.1 Code Review SDD

```text
Revise a alteração atual como code review.

Priorize:
1. bugs;
2. regressões;
3. falhas de segurança;
4. violação de tenant;
5. divergência com spec;
6. testes ausentes.

Use referências de arquivo e linha quando possível.
Não faça resumo longo antes dos achados.
```

### 5.2 Security Review

```text
Siga .claude/skills/security-review/SKILL.md.

Revise {FUNCIONALIDADE} procurando:
1. autenticação ausente;
2. permissão ausente;
3. vazamento cross-tenant;
4. validação insuficiente;
5. exposição de segredos.

Liste findings por severidade.
```

## 6. Prompts de Documentação

### 6.1 ADR

```text
Siga .claude/skills/adr-writer/SKILL.md.

Crie um ADR para a decisão:
{DECISAO}

Inclua:
1. contexto;
2. decisão;
3. alternativas consideradas;
4. consequências;
5. impacto no projeto.
```

### 6.2 Atualizar Spec

```text
Atualize {SPEC} para refletir a decisão abaixo:

{DECISAO}

Não altere implementação. Apenas documentação.
Garanta consistência com api-contract.md, database-schema.md e acceptance-criteria.md quando aplicável.
```

## 7. Prompts de Encerramento

### 7.1 Resumo Técnico da Tarefa

```text
Resuma a tarefa concluída:

1. objetivo;
2. specs consultadas;
3. arquivos alterados;
4. testes criados;
5. validações executadas;
6. riscos remanescentes;
7. próxima menor fatia recomendada.
```

### 7.2 Retrospectiva de Etapa

```text
Crie uma retrospectiva operacional desta etapa:

1. o que queríamos construir;
2. como a spec guiou a implementação;
3. onde o Claude Code ajudou;
4. onde precisamos corrigir o rumo;
5. quais testes deram confiança;
6. qual lição de SDD ficou clara.
```
