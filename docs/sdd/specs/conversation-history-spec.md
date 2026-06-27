<!-- Projeto Desenvolvido na Data Science Academy -->

# Conversation History Spec

## 1. Objetivo

Implementar conversas, mensagens e histórico persistente.

## 1.1 Contexto e Motivação

Este é o núcleo do produto: o problema que o SaaS resolve é a perda de histórico e a inconsistência entre atendentes (`product-brief.md` §2). A conversa é a unidade de trabalho do atendimento e a mensagem é o registro auditável (RNF-002) — autoria e data imutáveis sustentam disputas e métricas. Tudo o mais (atribuição, status, analytics, dashboard) é construído sobre estas entidades.

## 2. Escopo

Inclui:

- criar conversa;
- listar conversas;
- consultar detalhes;
- criar mensagens;
- paginar histórico;
- atualizar `lastMessageAt`;
- bloquear cross-tenant.

## 2.1 Non-Goals

- chat em tempo real (WebSocket/SSE) — o MVP usa requisições HTTP convencionais;
- anexos de arquivos (apenas texto);
- edição ou exclusão de mensagens (histórico imutável; ver RNF-002);
- busca full-text em mensagens;
- canais externos (WhatsApp, e-mail, Instagram) — `channel` é `manual` no MVP;
- `priority` e `externalRef` definíveis via API (campos reservados; §4.0.2 e §4.1.2).

## 3. Entidades

- `Customer`;
- `Conversation`;
- `Message`;
- `ConversationEvent`, opcional para evolução.

## 4. Status de Conversa

- `open`;
- `waiting_customer`;
- `waiting_agent`;
- `resolved`;
- `closed`.

### 4.0.1 Transições Válidas

Status só muda via `PATCH /conversations/:id` (exige `conversations.manage`). Mensagens **não** alteram status automaticamente; apenas atualizam `lastMessageAt`.

| De | Para (permitidos) |
|---|---|
| `open` | `waiting_agent`, `waiting_customer`, `resolved` |
| `waiting_agent` | `waiting_customer`, `resolved` |
| `waiting_customer` | `waiting_agent`, `resolved` |
| `resolved` | `closed`, `open` (reabertura) |
| `closed` | `open` (reabertura) |

Regras:

- transição fora da tabela retorna `409 CONFLICT`;
- reabertura é exclusivamente `PATCH { "status": "open" }` a partir de `resolved` ou `closed`;
- `PATCH` para o mesmo status atual é no-op aceito (`200`);
- mensagens são permitidas em qualquer status **exceto** `closed` (`409 CONFLICT`);
- toda atribuição e mudança de status deve ser registrada em log de aplicação (RNF-002); registrar também uma mensagem `system` na conversa é opcional no MVP;
- o diagrama de estados em `architecture.md` §5.1 espelha esta tabela.

### 4.0.2 Autoria de Mensagens

- `POST /conversations/:id/messages` aceita `authorType` apenas `agent` ou `customer`; `system` é reservado ao backend (`400 VALIDATION_ERROR`).
- `authorId` nunca vem do payload: para `agent`, é o usuário autenticado; para `customer`, é o customer da conversa.
- `priority` da conversa é sempre `normal` no MVP; o campo existe no domínio/banco mas não é definível nem alterável via API (reservado pós-MVP, como `externalRef`).

## 4.1 Criação e Resolução de Customer

Uma conversa sempre referencia um `Customer` (`conversations.customer_id` é obrigatório). No MVP não há endpoint dedicado para criar customer: ele é resolvido implicitamente ao criar a conversa.

### 4.1.1 Momento e atomicidade

- O `Customer` é resolvido e a `Conversation` é criada na mesma transação de `POST /conversations`.
- Se a resolução do customer falhar, a conversa não é criada (sem registros órfãos).
- O `organizationId` do customer e da conversa é sempre o da organização autenticada; o cliente da requisição nunca informa `organizationId`.

### 4.1.2 Campos aceitos no MVP

O corpo de `POST /conversations` aceita apenas `customer.name` (obrigatório) e `customer.email` (opcional), conforme `api-contract.md`.

- `externalRef` e `metadata` existem em `domain-model.md`/`database-schema.md`, mas são reservados para integrações futuras e **não** são definíveis por este endpoint no MVP.
- Qualquer chave extra enviada em `customer` deve ser ignorada ou rejeitada por validação, conforme política de validação do backend.

### 4.1.3 Estratégia de resolução (ordem)

Avaliada sempre dentro da organização autenticada:

1. **Por `email`** — se `customer.email` for informado e já existir um `Customer` ativo com o mesmo `(organizationId, email)`, a conversa reutiliza esse customer existente.
2. **Sem correspondência ou sem `email`** — cria um novo `Customer` com o `name` informado (e `email`, se houver).

Notas:

- A reutilização por `email` é o único critério de deduplicação do MVP e é *best-effort*: quando o `email` é omitido, não há deduplicação e um novo customer é sempre criado.
- Na reutilização, o registro existente **não** é sobrescrito silenciosamente (o `name` da requisição não substitui o `name` já gravado). Atualização de dados de customer fica fora do escopo deste endpoint.
- A busca usa o índice `(organization_id, email)` já previsto em `database-schema.md`.
- Quando `externalRef` passar a ser aceito (pós-MVP), ele deve ter prioridade sobre o `email` na resolução. O índice único parcial `(organization_id, external_ref)` onde `external_ref` não é nulo já está previsto em `database-schema.md` §3.4; resta criá-lo via migration e expor o campo no contrato ao habilitar.

## 5. Regras

- Toda conversa pertence a uma organização.
- Todo `Customer` pertence a uma organização e é resolvido/criado no escopo da organização autenticada.
- A reutilização de customer por `email` nunca cruza organização.
- Toda mensagem pertence à mesma organização da conversa.
- Mensagens devem preservar autoria.
- Mensagens devem ser ordenadas por `createdAt`.
- Conversas fechadas não recebem novas mensagens sem reabertura.
- Listagens devem ser paginadas.

## 6. Endpoints

- `GET /api/v1/conversations`;
- `POST /api/v1/conversations`;
- `GET /api/v1/conversations/:id` (inclui as 20 mensagens mais recentes, em ordem crescente de `createdAt`);
- `GET /api/v1/conversations/:id/messages` (histórico completo, paginado, ordem crescente de `createdAt`);
- `POST /api/v1/conversations/:id/messages`.

## 6.1 Cenários (BDD)

```gherkin
Cenário: Criar conversa com customer novo
DADO um usuário autenticado com conversations.create na organização A
QUANDO ele faz POST /conversations com customer.name "Cliente X" (sem email)
ENTÃO o sistema cria um Customer novo e a Conversation na mesma transação
E ambos pertencem à organização A com status open

Cenário: Reutilizar customer pelo email
DADO um Customer existente com email "c@x.com" na organização A
QUANDO POST /conversations informa customer.email "c@x.com"
ENTÃO a conversa referencia o customer existente
E o name já gravado NÃO é sobrescrito

Cenário: Mensagem em conversa fechada
DADO uma conversa com status closed
QUANDO ocorre POST /conversations/:id/messages
ENTÃO o sistema retorna 409 CONFLICT
E nenhuma mensagem é criada

Cenário: Transição de status inválida
DADO uma conversa com status open
QUANDO ocorre PATCH /conversations/:id com status closed
ENTÃO o sistema retorna 409 CONFLICT (closed só é alcançável a partir de resolved)
```

## 6.2 Casos de Borda

- conteúdo com unicode, emoji e RTL: aceito como dado (UTF-8), limite de 10.000 caracteres contado em caracteres;
- email do customer com maiúsculas: normalizar (trim + lowercase) antes da resolução §4.1.3, evitando duplicar customer;
- dois `PATCH` concorrentes na mesma conversa: a transição é validada contra o estado **atual no banco**, na mesma transação — o segundo request pode receber `409`;
- mensagem criada em concorrência com fechamento da conversa: a checagem de status e o insert ocorrem na mesma transação;
- `lastMessageAt` com mensagens quase simultâneas: recebe o maior `createdAt` persistido, nunca regride;
- página além do total em listagens: retorna lista vazia com `meta.total` correto, não erro;
- conversa sem mensagens: detalhe retorna `messages: []`.

## 7. Critérios de Aceite

- criar conversa com customer novo (só `name`);
- criar conversa reutilizando customer existente pelo `email` na mesma organização;
- criar conversa e customer na mesma transação (sem customer órfão em caso de falha);
- listar apenas conversas da organização;
- consultar conversa com mensagens;
- adicionar mensagem de agent;
- atualizar `lastMessageAt`;
- negar acesso cross-tenant;
- paginar mensagens.

## 8. Testes Obrigatórios

- cria conversa válida com customer novo;
- reutiliza customer existente quando `email` coincide na mesma organização;
- cria novo customer quando `email` é omitido (sem deduplicação);
- não reutiliza customer de `email` igual em outra organização;
- não sobrescreve o `name` do customer existente ao reutilizar;
- rejeita payload inválido (sem `customer.name`);
- lista por organização;
- bloqueia conversa de outro tenant;
- cria mensagem e atualiza conversa;
- impede mensagem em conversa fechada;
- rejeita `authorType: system` via API;
- ignora/rejeita `authorId` enviado no payload;
- pagina histórico completo via `GET /conversations/:id/messages`;
- rejeita transição de status fora da tabela §4.0.1;
- reabre conversa fechada com `PATCH { "status": "open" }`.

## 8.1 Riscos e Questões Abertas

Riscos:

- deduplicação de customer por `email` é best-effort (§4.1.3): sem email, customers duplicam; aceito no MVP, com `externalRef` previsto como solução pós-MVP;
- crescimento da tabela `messages`: paginação obrigatória e índice `(organization_id, conversation_id, created_at)` mitigam; arquivamento fica pós-MVP;
- mudança de status sem mensagem `system` (opcional no MVP) reduz a visibilidade na linha do tempo: o log de aplicação é a fonte de auditoria.

Questões abertas:

- reabertura automática quando cliente "responde" após fechamento: não existe no MVP (mensagem em `closed` é `409`); revisitar quando houver canais externos;
- soft-delete/arquivamento de conversas antigas: pós-MVP.

## 9. Prompt Para Claude Code

```text
Leia conversation-history-spec.md, domain-model.md e api-contract.md. Implemente conversas e mensagens em fatias: migrations, services, endpoints e testes. Priorize tenant, resolução de customer (§4.1) e paginação.
```

## 10. Histórico de Mudanças

- **1.2 (2026-06-09):** adicionados contexto/motivação, non-goals, cenários BDD, casos de borda (concorrência, normalização de email, unicode) e riscos/questões abertas, conforme `spec-template.md`.
- **1.1 (2026-06-09):** adicionadas tabela de transições de status (§4.0.1), regras de autoria de mensagens (§4.0.2), endpoint `GET /conversations/:id/messages` e definição das 20 mensagens recentes no detalhe.
- **1.0 (2026-06-03):** versão inicial.

**Versão:** 1.2  
**Status:** Proposta  
**Owner:** Equipe do projeto  
**Última atualização:** 2026-06-09  
**Substitui:** N/A
