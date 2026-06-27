<!-- Projeto Desenvolvido na Data Science Academy -->

# Test Plan - SaaS de Atendimento ao Cliente

## 1. Objetivo

Este documento define a estratégia de testes do MVP.

O objetivo é garantir que código assistido por IA seja verificado de forma objetiva.

## 2. Pirâmide de Testes

Prioridade:

1. testes unitários de regras de domínio;
2. testes de integração de API;
3. testes de repositório ou banco quando necessário;
4. testes end-to-end do fluxo principal;
5. smoke tests de deploy.

## 3. Áreas Críticas

## 3.1 Autenticação

Cenários:

- cadastro de organização;
- email duplicado rejeitado;
- login válido;
- login inválido;
- rate limit de login;
- token expirado rejeitado;
- senha com hash;
- rota protegida sem token;
- `/me` com usuário válido.

## 3.2 Autorização

Cenários:

- owner acessa tudo;
- viewer não cria mensagem;
- agent não gerencia usuários;
- manager atribui conversa;
- cross-tenant negado.

## 3.3 Conversas e Mensagens

Cenários:

- criar conversa com customer novo;
- reutilizar customer existente por `email` na mesma organização;
- listar por organização;
- paginar mensagens (`GET /conversations/:id/messages`);
- rejeitar `authorType: system` via API;
- atribuir conversa;
- mudar status com transição válida (tabela §4.0.1);
- rejeitar transição de status inválida;
- reabrir conversa fechada;
- bloquear escrita em conversa fechada;
- atualizar `lastMessageAt`;
- cross-tenant negado.

## 3.4 Analytics

Cenários:

- overview vazio;
- overview com dados;
- filtro por período (defaults e `from > to` rejeitado);
- filtro por organização;
- cálculo de tempo de primeira resposta;
- contagem de mensagens no período;
- agregação por atendente;
- permissão negada.

## 3.5 Gestão de Usuários

Cenários:

- cria usuário com papel atribuível;
- rejeita papel `owner` na criação;
- rejeita email duplicado;
- lista membros apenas da organização;
- altera papel/status com `users.manage`;
- nega alteração do owner;
- nega auto-alteração;
- nega acesso sem permissão;
- cross-tenant negado;
- usuário inativado não autentica.

## 4. Testes End-to-End do MVP

Fluxo recomendado:

1. criar organização;
2. login do owner;
3. criar usuário agent;
4. criar conversa;
5. adicionar mensagem;
6. atribuir conversa ao agent e mudar status;
7. consultar analytics.

## 5. Integrações Externas

Quando integrações externas existirem (ex.: e-mail), devem ficar atrás de interfaces e ser testadas com fakes/mocks controlados, sem depender do serviço real.

## 6. Dados de Teste

Factories recomendadas:

- organization;
- user;
- organizationMember;
- customer;
- conversation;
- message.

## 7. Definição de Pronto Para Testes

Uma funcionalidade está pronta quando:

- possui testes dos critérios de aceite;
- cobre cenário feliz;
- cobre pelo menos um cenário de erro;
- cobre permissão, quando aplicável;
- cobre tenant, quando aplicável;
- validações passam localmente.

## 8. Como Usar Este Documento com IA

Prompt de execução:

```text
Leia docs/sdd/test-plan.md e crie testes para a funcionalidade atual. Cubra permissão, tenant e cenários de falha.
```

**Versão:** 1.1  
**Status:** Proposta  
**Owner:** Equipe do projeto  
**Última atualização:** 2026-06-09  
**Substitui:** N/A
