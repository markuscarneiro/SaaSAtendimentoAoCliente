<!-- Projeto Desenvolvido na Data Science Academy -->

# Acceptance Criteria - SaaS de Atendimento ao Cliente

## 1. Objetivo

Este documento define critérios de aceite globais do MVP.

Ele deve ser usado para validar se a implementação está pronta.

## 2. Critérios Globais do MVP

O MVP é aceito quando:

- a aplicação roda localmente 100% via Docker Compose;
- backend, frontend, banco e Redis não dependem de runtime instalado no host;
- o backend expõe APIs protegidas;
- o frontend permite fluxo ponta a ponta;
- dados são isolados por organização;
- usuários possuem papéis e permissões;
- conversas e mensagens são persistidas;
- conversas podem ser atribuídas e mudar de status;
- métricas básicas aparecem no dashboard;
- testes críticos passam;
- CI executa validações principais.

## 2.1 Execução Docker

Aceito quando:

- `docker compose up --build` sobe API, web, PostgreSQL e Redis;
- migrations executam em container;
- testes executam em container;
- smoke tests validam o ambiente do Compose;
- README e specs não exigem Node.js, banco ou Redis instalados no host;
- CI constrói imagens Docker e roda validações containerizadas.

## 3. Organização e Usuários

Aceito quando:

- é possível criar organização com owner;
- owner consegue login;
- `/me` retorna organização ativa;
- usuário sem autenticação não acessa rotas protegidas;
- usuário sem permissão recebe erro adequado;
- admin cria usuários com papel e eles conseguem logar;
- membros são listados por organização;
- papel/status de vínculo pode ser alterado, com owner protegido e auto-alteração negada;
- login com tentativas falhas em excesso é bloqueado por rate limit.

## 4. Conversas

Aceito quando:

- usuário autorizado cria conversa;
- conversa fica associada à organização;
- customer é resolvido/criado na criação da conversa;
- mensagens são registradas com autor derivado no backend (`system` não é aceito via API);
- histórico completo é paginado via `GET /conversations/:id/messages`;
- conversa pode ser atribuída a um usuário;
- status muda respeitando transições válidas;
- conversa fechada não recebe mensagem sem reabertura;
- usuário de outra organização não acessa a conversa.

## 5. Analytics

Aceito quando:

- overview filtra por organização e período (defaults e validação `from <= to`);
- métricas de status e volume de mensagens são calculadas conforme `analytics-spec.md` §4.1;
- tempo de primeira resposta é calculado;
- volume por atendente é calculado;
- endpoint respeita permissão `analytics.read`.

## 6. Dashboard

Aceito quando:

- usuário faz login;
- lista conversas;
- abre conversa;
- envia mensagem;
- atribui responsável;
- muda status;
- vê métricas básicas.

## 7. Qualidade

Aceito quando:

- testes críticos passam;
- lint e checagem de tipos passam;
- contratos de API são respeitados;
- README e specs estão atualizados.

## 8. Como Usar Este Documento com IA

Prompt de execução:

```text
Compare a implementação atual com docs/sdd/acceptance-criteria.md. Liste o que está aceito, o que está parcial e o que ainda falta. Não implemente correções até apresentar o diagnóstico.
```

**Versão:** 1.1  
**Status:** Proposta  
**Owner:** Equipe do projeto  
**Última atualização:** 2026-06-09  
**Substitui:** N/A
