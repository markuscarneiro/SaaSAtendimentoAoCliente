<!-- Projeto Desenvolvido na Data Science Academy -->

# Security Spec - SaaS de Atendimento ao Cliente

## 1. Objetivo

Este documento define requisitos e regras de segurança para o MVP.

Segurança deve ser implementada no backend e validada por testes.

## 2. Princípios

- Backend é a fonte de verdade.
- Dados de tenants nunca se misturam.
- Permissão deve ser explícita.
- Erros não devem vazar informação sensível.
- Segredos não entram no repositório.
- Entrada do usuário deve ser validada antes da regra de negócio.

## 3. Autenticação

Requisitos:

- senha com hash seguro (bcrypt ou argon2);
- política de senha: mínimo 8, máximo 72 caracteres (limite compatível com bcrypt);
- login com erro genérico;
- token Bearer JWT com expiração (`JWT_EXPIRES_IN`, default 24h; sem refresh no MVP — ver `specs/auth-spec.md` §3.2.1);
- endpoint `/me`;
- rotas protegidas por middleware.

## 4. Autorização

Requisitos:

- papel por organização;
- matriz de permissões;
- validação por rota;
- testes de acesso negado;
- testes cross-tenant.

## 5. Multi-Tenancy

Requisitos:

- entidades de domínio possuem `organizationId`;
- queries filtram por `organizationId`;
- recursos inacessíveis podem retornar `404`;
- logs devem registrar tenant de forma segura.

## 6. Validação de Entrada

Requisitos:

- validar payloads antes da regra de negócio;
- rejeitar campos desconhecidos ou inválidos;
- limitar tamanho de campos de texto: conteúdo de mensagem até **10.000 caracteres**; demais campos de texto livre (nomes, assunto) até **255 caracteres**;
- nunca aceitar `organizationId` ou `authorId` vindos do payload em rotas de domínio (sempre derivados do contexto autenticado);
- tratar entrada do cliente como dado, nunca como instrução de sistema.

## 7. Segredos

Requisitos:

- `.env` não deve ser versionado;
- `.env.example` deve documentar variáveis;
- chaves reais só em ambiente seguro;
- logs não devem exibir tokens de API.

## 8. Rate Limit e Abuso

Requisito do MVP (usa o Redis do Compose como armazenamento de contadores):

- `POST /auth/login`: máximo de **10 tentativas falhas por email e por IP em janela de 15 minutos**; ao exceder, retornar `429 RATE_LIMITED`;
- contadores são zerados após login bem-sucedido ou ao fim da janela;
- eventos de bloqueio devem ser registrados em log (sem expor a senha tentada).

Recomendado (pós-MVP): rate limit genérico por usuário/órgão nas rotas de escrita.

## 9. Logs e Auditoria

Eventos que devem ser registrados:

- login falho;
- mudança de papel de usuário;
- atribuição e mudança de status de conversa;
- acesso negado.

## 10. Critérios de Aceite

- Rotas protegidas negam usuário anônimo.
- Usuário sem permissão recebe `403`.
- Recurso de outro tenant não é acessível.
- Payload inválido é rejeitado.
- Testes cobrem autenticação, autorização e tenant.

## 11. Como Usar Este Documento com IA

Prompt de execução:

```text
Revise a implementação atual usando docs/sdd/security-spec.md. Priorize vazamento cross-tenant, permissões ausentes, validação de entrada e segredos.
```

## 12. Histórico de Mudanças

- **1.1 (2026-06-09):** rate limit de login virou requisito com limites concretos (§8), política de senha 8–72 (§3), limites de tamanho de texto e proibição de `organizationId`/`authorId` via payload (§6).
- **1.0 (2026-06-03):** versão inicial.

**Versão:** 1.1  
**Status:** Proposta  
**Owner:** Equipe do projeto  
**Última atualização:** 2026-06-09  
**Substitui:** N/A
