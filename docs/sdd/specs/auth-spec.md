<!-- Projeto Desenvolvido na Data Science Academy -->

# Auth Spec

## 1. Objetivo

Implementar autenticação para usuários do SaaS.

Autenticação identifica quem é o usuário. Autorização, descrita em `authorization-spec.md`, define o que ele pode fazer.

## 1.1 Contexto e Motivação

O produto é multi-tenant: todo dado operacional pertence a uma organização e todo acesso parte de um usuário autenticado com vínculo ativo. A autenticação é a porta de entrada do isolamento por tenant (constitution §2.3) — sem ela não há como derivar `organizationId` com segurança. É a primeira funcionalidade de backend do MVP porque todas as demais rotas dependem do middleware e do token definidos aqui.

## 2. Escopo do MVP

Inclui:

- criar organização inicial;
- criar primeiro owner;
- login com email e senha;
- hash seguro de senha;
- emissão de access token ou sessão;
- endpoint `/me`;
- middleware de autenticação;
- logout opcional.

Não inclui:

- SSO;
- OAuth social;
- recuperação de senha;
- MFA.

## 3. Fluxos

## 3.1 Registro de Organização

Entrada:

- nome da organização;
- nome do owner;
- email do owner;
- senha.

Processo:

1. validar payload;
2. verificar email único;
3. criar organização;
4. criar usuário;
5. criar vínculo `organization_members` com papel `owner`;
6. retornar dados básicos.

## 3.2 Login

Entrada:

- email;
- senha.

Processo:

1. buscar usuário por email;
2. comparar senha com hash;
3. verificar status ativo do usuário;
4. carregar o vínculo ativo (`organization_members`) — no MVP cada usuário tem **exatamente um** vínculo ativo; se houver mais de um (estado pós-MVP), usar o mais antigo;
5. usuário sem vínculo ativo não autentica (erro genérico);
6. emitir token;
7. retornar usuário, organização e papel.

## 3.2.1 Token (JWT)

- Claims mínimos: `sub` (userId) e `organizationId`. Papel e permissões são resolvidos a cada request a partir do vínculo (mudança de papel tem efeito imediato).
- Expiração configurável via env `JWT_EXPIRES_IN`; default `24h`. Sem refresh token no MVP: token expirado retorna `401 UNAUTHENTICATED` e exige novo login.
- Segredo em `JWT_SECRET` (nunca commitado).

## 3.3 Me

Retorna:

- usuário;
- organização ativa;
- papel;
- permissões.

## 4. Endpoints

- `POST /api/v1/auth/register-organization`;
- `POST /api/v1/auth/login`;
- `GET /api/v1/me`;
- `POST /api/v1/auth/logout`, opcional.

## 5. Regras

- Senha nunca deve ser salva em texto puro.
- Política de senha: mínimo 8, máximo 72 caracteres (ver `security-spec.md` §3).
- Email já cadastrado no registro retorna `409 CONFLICT`.
- Erro de login deve ser genérico.
- Login tem rate limit (ver `security-spec.md` §8); excesso retorna `429 RATE_LIMITED`.
- Token deve conter o mínimo necessário (§3.2.1).
- Rotas protegidas devem rejeitar usuário anônimo.
- Usuário inativo ou sem vínculo ativo não autentica.
- Logout no MVP é **stateless**: o cliente descarta o token; não há blacklist de tokens. O endpoint `POST /auth/logout` pode ser omitido.

## 5.1 Cenários (BDD)

```gherkin
Cenário: Login bem-sucedido
DADO um usuário ativo "ana@example.com" com vínculo ativo em uma organização
QUANDO ele faz POST /auth/login com email e senha corretos
ENTÃO o sistema retorna 200 com accessToken JWT, usuário, organização e papel
E o token contém sub e organizationId, com expiração de JWT_EXPIRES_IN

Cenário: Credencial inválida com erro genérico
DADO qualquer combinação de email inexistente ou senha incorreta
QUANDO ocorre POST /auth/login
ENTÃO o sistema retorna 401 com a MESMA mensagem genérica nos dois casos
E não revela se o email existe

Cenário: Rate limit de login
DADO 10 tentativas falhas para o mesmo email ou IP em 15 minutos
QUANDO ocorre a 11ª tentativa
ENTÃO o sistema retorna 429 RATE_LIMITED
E o evento de bloqueio é registrado em log sem expor a senha
```

## 5.2 Casos de Borda

- email com maiúsculas ou espaços nas pontas: normalizar (trim + lowercase) no registro e no login — `Ana@X.com` e `ana@x.com` são o mesmo usuário;
- senha com caracteres multibyte (acentos, emoji): contar o limite de 72 em bytes, compatível com bcrypt;
- papel alterado após emissão do token: permissões são resolvidas a cada request pelo vínculo (auth-spec §3.2.1), o efeito é imediato;
- vínculo inativado com token ainda válido: requests passam a falhar com `403`/`404` mesmo antes de o token expirar;
- dois registros simultâneos com o mesmo email: a constraint única do banco decide; o perdedor recebe `409`.

## 6. Testes Obrigatórios

- registra organização e owner;
- impede email duplicado (`409`);
- rejeita senha fora da política (`400`);
- faz login válido;
- rejeita senha incorreta;
- rejeita usuário inexistente com erro genérico;
- rejeita usuário inativo ou sem vínculo ativo;
- aplica rate limit de login (`429`);
- rejeita token expirado (`401`);
- protege rota sem token;
- retorna `/me` autenticado.

## 6.1 Riscos e Questões Abertas

Riscos:

- força bruta em login: mitigada pelo rate limit (`security-spec.md` §8) e pelo erro genérico;
- token JWT não é revogável antes de expirar (logout stateless): janela de exposição limitada por `JWT_EXPIRES_IN`; aceito no MVP;
- senha inicial definida no registro sem verificação de email: aceito no MVP (sem provedor de e-mail).

Questões abertas:

- recuperação de senha e MFA ficam pós-MVP (non-goals §2);
- múltiplos vínculos por usuário (troca de organização) fica pós-MVP; a regra do vínculo único está em §3.2.

## 7. Prompt Para Claude Code

```text
Leia auth-spec.md, api-contract.md, database-schema.md e security-spec.md. Implemente autenticação do MVP com registro de organização, login, middleware e /me. Antes de codar, liste arquivos que serão alterados e testes.
```

## 8. Histórico de Mudanças

- **1.2 (2026-06-09):** adicionados contexto/motivação, cenários BDD, casos de borda (normalização de email, limite de senha em bytes) e riscos/questões abertas, conforme `spec-template.md`.
- **1.1 (2026-06-09):** definidos claims e expiração do JWT (§3.2.1), vínculo único por usuário no MVP, política de senha (8–72), `409` para email duplicado, rate limit de login e logout stateless.
- **1.0 (2026-06-03):** versão inicial.

**Versão:** 1.2  
**Status:** Proposta  
**Owner:** Equipe do projeto  
**Última atualização:** 2026-06-09  
**Substitui:** N/A
