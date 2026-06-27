<!-- Projeto Desenvolvido na Data Science Academy -->

# User Management Spec

## 1. Objetivo

Permitir que a organização cadastre e gerencie seus usuários internos (admins, managers, agents e viewers).

Sem esta funcionalidade, o único usuário existente seria o owner criado em `POST /auth/register-organization`, o que inviabiliza atribuição de conversas (RF-006), a matriz de papéis (RF-003) e o analytics por atendente (RF-007).

## 2. Contexto

- "Usuário" aqui significa **usuário + vínculo** (`organization_members`) com a organização autenticada.
- A entidade global `users` tem email único no sistema; o papel e o status pertencem ao vínculo.
- No MVP, cada usuário tem exatamente **um** vínculo ativo (ver `auth-spec.md` §5).

## 3. Escopo do MVP

Inclui:

- criar usuário com papel, dentro da organização autenticada;
- listar membros da organização (paginado);
- alterar papel e/ou status do vínculo.

Não inclui (non-goals):

- convite por e-mail (não há provedor de e-mail no MVP; a senha inicial é definida na criação);
- troca de senha e recuperação de senha;
- remoção física de usuário (usar `status: inactive`);
- usuário em múltiplas organizações;
- alteração de nome/email do usuário.

## 4. Endpoints

Ver contratos completos em `api-contract.md` §6.2 e `openapi.yaml`.

| Endpoint | Permissão | Descrição |
|---|---|---|
| `GET /api/v1/users` | `users.read` | Lista membros (usuário + papel + status), paginado |
| `POST /api/v1/users` | `users.manage` | Cria usuário e vínculo com papel |
| `PATCH /api/v1/users/:id` | `users.manage` | Altera papel e/ou status do vínculo |

## 5. Regras

- Papéis criáveis/atribuíveis via API: `admin`, `manager`, `agent`, `viewer`. O papel `owner` só nasce no registro da organização.
- O vínculo do `owner` não pode ser alterado por esta API (`409 CONFLICT`).
- Usuário não altera o próprio vínculo (evita auto-demoção e lockout) (`409 CONFLICT`).
- Email duplicado (já existente no sistema) retorna `409 CONFLICT`.
- Senha segue a política de `security-spec.md` §3 (mínimo 8, máximo 72 caracteres) e é armazenada com hash.
- `PATCH` em usuário sem vínculo com a organização autenticada retorna `404 NOT_FOUND` (não vaza existência cross-tenant).
- Vínculo `inactive` bloqueia login e acesso aos dados da organização (ver `auth-spec.md`).
- Mudança de papel é ação sensível e deve ser registrada em log (`security-spec.md` §9).

## 6. Casos de Erro

- payload inválido (papel fora da lista, senha curta) → `400 VALIDATION_ERROR`;
- sem permissão → `403 FORBIDDEN`;
- usuário de outra organização → `404 NOT_FOUND`;
- email duplicado, alterar owner, alterar a si mesmo → `409 CONFLICT`.

## 6.1 Cenários (BDD)

```gherkin
Cenário: Admin cria agente que consegue operar
DADO um usuário com papel admin na organização A
QUANDO ele faz POST /users com name, email, senha válida e role agent
ENTÃO o sistema retorna 201 e cria usuário + vínculo ativo na organização A
E o novo agente consegue fazer login e aparece na lista de atribuíveis

Cenário: Auto-alteração negada
DADO um usuário com users.manage
QUANDO ele faz PATCH /users/:id apontando para o próprio userId
ENTÃO o sistema retorna 409 CONFLICT
E o vínculo permanece inalterado
```

## 6.2 Casos de Borda

- email com maiúsculas/espaços: normalizado (trim + lowercase) como em `auth-spec.md` §5.2 — duplicidade é detectada após normalização;
- inativar usuário com conversas atribuídas: as conversas **mantêm** `assignedUserId` (histórico); reatribuição é ação manual via `PATCH /conversations/:id`;
- inativar o único admin além do owner: permitido (o owner sempre mantém `users.manage`);
- reativar vínculo inativo: `PATCH { "status": "active" }`, sem recriar o usuário;
- listagem com página além do total: retorna lista vazia com `meta.total` correto.

## 7. Critérios de Aceite

- admin cria usuário com papel `agent` e ele consegue logar;
- lista de membros retorna apenas membros da organização autenticada;
- papel de um membro pode ser alterado por quem tem `users.manage`;
- vínculo pode ser inativado e o usuário perde acesso;
- owner não é alterado via API;
- usuário não altera o próprio vínculo;
- agent (sem `users.manage`) não cria nem altera usuários;
- tentativa cross-tenant é negada.

## 8. Testes Obrigatórios

- cria usuário válido com cada papel atribuível;
- rejeita papel `owner` na criação;
- rejeita email duplicado com `409`;
- lista paginada filtrada por organização;
- altera papel com `users.manage`;
- nega alteração do owner;
- nega auto-alteração;
- nega criação/alteração sem permissão (`403`);
- nega acesso a usuário de outra organização (`404`);
- usuário inativado não autentica.

## 8.1 Riscos e Questões Abertas

Riscos:

- senha inicial definida pelo admin (sem convite por e-mail): risco de compartilhamento inseguro da senha; aceito no MVP e documentado como non-goal — troca de senha pelo próprio usuário fica pós-MVP;
- owner único: se o owner perder acesso, não há recuperação self-service no MVP (sem reset de senha); operação manual via banco é o plano de contingência.

Questões abertas:

- convite por e-mail com definição de senha pelo próprio usuário: pós-MVP, depende de provedor de e-mail;
- transferência de ownership: pós-MVP.

## 9. Prompt Para Claude Code

```text
Leia user-management-spec.md, authorization-spec.md, api-contract.md (§6.2) e security-spec.md. Implemente criação, listagem e atualização de membros da organização com testes de permissão, owner, auto-alteração e cross-tenant. Antes de codar, apresente plano com arquivos e testes.
```

## 10. Histórico de Mudanças

- **1.1 (2026-06-09):** adicionados cenários BDD, casos de borda (normalização de email, inativação com conversas atribuídas) e riscos/questões abertas, conforme `spec-template.md`.
- **1.0 (2026-06-09):** versão inicial (gestão de usuários incluída no MVP).

**Versão:** 1.1  
**Status:** Proposta  
**Owner:** Equipe do projeto  
**Última atualização:** 2026-06-09  
**Substitui:** N/A
