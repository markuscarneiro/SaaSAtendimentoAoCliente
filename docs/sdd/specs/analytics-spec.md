<!-- Projeto Desenvolvido na Data Science Academy -->

# Analytics Spec

## 1. Objetivo

Definir métricas administrativas de atendimento do SaaS.

Analytics deve transformar dados operacionais em visão de volume, status e produtividade do atendimento.

## 1.1 Contexto e Motivação

A ausência de métricas simples (volume, tempo de resposta) é uma das dores listadas no `product-brief.md` §2. Gestores precisam responder "quantas conversas temos, quão rápido respondemos e quem está sobrecarregado" sem exportar dados. As fórmulas ficam especificadas aqui (§4.1) para que o código e os testes derivem da spec, e não de interpretação por sessão de IA.

## 2. Escopo do MVP

Endpoints agregados simples, calculados a partir do banco transacional.

Não inclui:

- data warehouse;
- pipeline analítico complexo;
- gráficos avançados;
- segmentação preditiva.

## 3. Métricas

## 3.1 Conversas

- total de conversas;
- conversas abertas;
- conversas resolvidas;
- conversas fechadas;
- mensagens por período.

## 3.2 Produtividade

- conversas atribuídas por atendente;
- mensagens enviadas por atendente;
- tempo de primeira resposta.

## 4. Endpoint Principal

```text
GET /api/v1/analytics/overview?from=2026-01-01&to=2026-01-31
```

Parâmetros `from` e `to` são opcionais: `to` default é a data atual; `from` default é 30 dias antes de `to`. Ambos inclusivos. `from > to` retorna `400 VALIDATION_ERROR`. O período efetivo é ecoado em `meta`.

Response:

```json
{
  "data": {
    "conversationsTotal": 120,
    "openConversations": 20,
    "resolvedConversations": 80,
    "closedConversations": 20,
    "messagesTotal": 940,
    "avgFirstResponseSeconds": 540,
    "byAgent": [
      {
        "userId": "usr_123",
        "assignedConversations": 30,
        "messagesSent": 210
      }
    ]
  },
  "meta": {
    "from": "2026-01-01",
    "to": "2026-01-31"
  },
  "error": null
}
```

## 4.1 Definição das Fórmulas

Todas as agregações filtram por `organization_id`. O recorte de período é **sempre por data de criação** (`created_at` em `[from, to]`); o status considerado é o **status atual** (snapshot) das conversas criadas no período.

- `conversationsTotal` = contagem de `conversations` criadas no período.
- `openConversations` = contagem de `conversations` criadas no período com status atual `open`.
- `resolvedConversations` = contagem de `conversations` criadas no período com status atual `resolved`.
- `closedConversations` = contagem de `conversations` criadas no período com status atual `closed`.
- `messagesTotal` = contagem de `messages` criadas no período (qualquer `author_type`).
- `avgFirstResponseSeconds` = média, sobre as conversas criadas no período, do intervalo entre a primeira mensagem do cliente e a primeira mensagem de atendente (`author_type = agent`) posterior a ela; ignora conversas sem mensagem de cliente ou sem resposta de atendente.
- `byAgent[].assignedConversations` = contagem de `conversations` criadas no período com `assigned_user_id = userId` (atribuição atual).
- `byAgent[].messagesSent` = contagem de `messages` criadas no período com `author_type = agent` e `author_id = userId`.

Métricas sem dados retornam `0` (`avgFirstResponseSeconds = 0` quando nenhuma conversa tem resposta; `byAgent = []` quando não há atribuições nem mensagens de atendente).

## 4.2 Casos de Borda

- **timezone:** `from` e `to` são datas interpretadas em **UTC**; o período cobre `[from 00:00:00Z, to 23:59:59Z]`. Timezone por organização fica pós-MVP;
- `from = to`: período de um dia, válido;
- usuário inativado que enviou mensagens no período: continua aparecendo em `byAgent` (dado histórico não é apagado);
- conversa com primeira mensagem de atendente **antes** de qualquer mensagem de cliente (conversa iniciada pela empresa): ignorada no `avgFirstResponseSeconds` (não há "primeira resposta");
- período inteiramente no futuro: resposta válida com tudo zerado.

## 5. Regras

- Métricas filtram por organização.
- Usuário precisa de `analytics.read`.
- Período deve ser validado (`from <= to`; defaults do §4).
- Fórmulas devem ser testadas.
- Dados ausentes devem retornar zero, não erro.

## 6. Testes Obrigatórios

- overview vazio;
- overview com dados;
- filtro por período;
- filtro por organização;
- permissão negada;
- cálculo de tempo de primeira resposta;
- agregação por atendente.

## 6.1 Riscos e Questões Abertas

Riscos:

- agregações no banco transacional podem ficar lentas com volume alto: aceito no MVP (escopo pequeno); cache/materialização ficam pós-MVP;
- recorte por `created_at` com status snapshot (§4.1) significa que uma conversa criada antes do período não aparece, mesmo que resolvida dentro dele: comportamento definido e documentado, não bug.

Questões abertas:

- timezone por organização (hoje fixo em UTC, §4.2) fica pós-MVP;
- métricas adicionais (tempo de resolução, CSAT) ficam pós-MVP.

## 7. Prompt Para Claude Code

```text
Leia analytics-spec.md e implemente endpoints de analytics com queries agregadas simples. Crie testes para fórmulas, período, organização e permissões.
```

## 8. Histórico de Mudanças

- **1.2 (2026-06-09):** adicionados contexto/motivação, casos de borda (timezone UTC, conversa iniciada pela empresa) e riscos/questões abertas, conforme `spec-template.md`.
- **1.1 (2026-06-09):** definidos defaults e validação de `from`/`to`, semântica período × snapshot nas fórmulas (§4.1) e métrica `messagesTotal`.
- **1.0 (2026-06-03):** versão inicial.

**Versão:** 1.2  
**Status:** Proposta  
**Owner:** Equipe do projeto  
**Última atualização:** 2026-06-09  
**Substitui:** N/A
