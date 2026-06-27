<!-- Projeto Desenvolvido na Data Science Academy -->

# Prompts de Validação - Projeto 1

Prompts para simular, validar e revisar comportamentos do projeto.

## 1. Prompt Ruim vs Prompt Bom

### Prompt ruim

```text
Crie um SaaS de atendimento ao cliente.
```

### Prompt bom

```text
Leia:
- docs/sdd/product-brief.md
- docs/sdd/requirements.md
- docs/sdd/architecture.md
- docs/sdd/api-contract.md
- docs/sdd/specs/conversation-history-spec.md

Implemente apenas o endpoint POST /api/v1/conversations.

Antes de codar:
1. resuma a regra de negócio;
2. liste arquivos prováveis;
3. liste testes;
4. aponte riscos de tenant.

Não implemente mensagens ainda.
```

## 2. Validar Se a Spec Está Pronta

```text
Leia docs/sdd/specs/conversation-history-spec.md e diga se a spec está pronta para implementação.

Procure especialmente:
1. resolução de customer (§4.1);
2. transições de status válidas;
3. autorização por permissão;
4. formato de erro;
5. paginação.

Não implemente. Faça perguntas se algo estiver indefinido.
```

## 3. Plano Antes do Código

```text
Quero implementar analytics de atendimento.

Siga .claude/skills/backend-endpoint/SKILL.md.
Leia docs/sdd/specs/analytics-spec.md.

Antes de codar, apresente um plano com:
1. ordem de implementação;
2. tabelas e índices afetados;
3. fórmulas e queries necessárias;
4. testes;
5. riscos de cálculo;
6. primeira fatia implementável.
```

## 4. Revisão Contra Spec

```text
Revise a implementação atual de autenticação contra:
- docs/sdd/specs/auth-spec.md
- docs/sdd/security-spec.md
- docs/sdd/test-plan.md
- docs/sdd/acceptance-criteria.md

Classifique cada critério como OK, Parcial ou Falta.
Não corrija ainda.
```

## 5. Erro Controlado de Tenant

```text
Você implementou uma rota sem validar organizationId.

Pare e revise a alteração usando:
- docs/sdd/security-spec.md
- docs/sdd/specs/authorization-spec.md

Explique:
1. qual risco foi criado;
2. qual teste deveria ter impedido;
3. como corrigir;
4. que prompt teria evitado o erro.
```

## 6. Evolução da Spec

```text
Decidimos permitir filtrar conversas por prioridade na listagem.

Atualize:
- docs/sdd/specs/conversation-history-spec.md
- docs/sdd/api-contract.md
- docs/sdd/openapi.yaml

Não implemente código. Apenas atualize specs e explique o impacto.
```

## 7. Testes de Conversas

```text
Crie testes para criação e atribuição de conversa.

Cubra:
1. criação com customer novo;
2. reutilização de customer por email na mesma organização;
3. atribuição e mudança de status;
4. transição de status inválida;
5. acesso cross-tenant negado.

Use as factories de teste; não dependa de serviços externos.
```

## 8. Checkpoint de Backend

```text
Faça um checkpoint do backend antes de avançar para o dashboard.

Revise:
- autenticação;
- autorização;
- organizações;
- conversas;
- mensagens;
- atribuição e status;
- contratos de API;
- testes;
- riscos cross-tenant.

Retorne:
1. pronto para avançar;
2. precisa corrigir antes;
3. testes faltantes;
4. próxima tarefa recomendada.
```

## 9. Retrospectiva ao Final da Etapa

```text
Gere uma retrospectiva da etapa para os desenvolvedores.

Inclua:
1. objetivo da etapa;
2. specs usadas;
3. prompts usados;
4. decisões tomadas;
5. o que funcionou bem;
6. onde foi preciso corrigir o rumo;
7. testes que deram confiança;
8. lição central sobre SDD.
```
