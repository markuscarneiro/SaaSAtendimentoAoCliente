<!-- Projeto Desenvolvido na Data Science Academy -->

# Requirements - SaaS de Atendimento ao Cliente

## 1. Objetivo

Este documento descreve os requisitos funcionais, não funcionais e regras de negócio do MVP.

Ele deve ser usado como fonte de verdade para planejamento, implementação e revisão com assistentes de IA.

## 2. Personas

## 2.1 Owner

Dono da organização dentro do SaaS.

Responsabilidades:

- criar a organização;
- gerenciar administradores;
- acessar métricas e custos;
- alterar configurações críticas.

## 2.2 Admin

Usuário responsável por configuração operacional.

Responsabilidades:

- gerenciar usuários;
- acompanhar conversas;
- consultar analytics.

## 2.3 Manager

Gestor de atendimento.

Responsabilidades:

- acompanhar conversas;
- revisar métricas;
- avaliar qualidade do atendimento;
- identificar gargalos.

## 2.4 Agent

Atendente humano responsável por conduzir conversas com clientes.

Responsabilidades:

- visualizar conversas atribuídas;
- enviar mensagens;
- mudar status da conversa.

## 2.5 Viewer

Usuário de leitura.

Responsabilidades:

- consultar dados permitidos;
- não alterar configurações ou conversas.

## 3. Requisitos Funcionais

## RF-001 - Organização

O sistema deve permitir criar uma organização cliente.

Critérios:

- a organização deve ter nome;
- a organização deve ter status ativo;
- o primeiro usuário deve ser criado como owner.

## RF-002 - Autenticação

O sistema deve permitir login com email e senha.

Critérios:

- senha deve ser armazenada com hash seguro;
- credenciais inválidas devem retornar erro genérico;
- rotas protegidas devem exigir usuário autenticado.

## RF-003 - Papéis e Permissões

O sistema deve controlar acesso por papéis e permissões.

Critérios:

- permissões devem ser validadas no backend;
- dados devem ser filtrados por organização;
- tentativas cross-tenant devem ser negadas.

## RF-004 - Conversas

O sistema deve permitir criar, listar e consultar conversas.

Critérios:

- conversa pertence a uma organização;
- conversa possui status (`open`, `waiting_customer`, `waiting_agent`, `resolved`, `closed`; ver `domain-model.md`);
- conversa pode ter mensagens;
- histórico deve ser paginado.

## RF-005 - Mensagens

O sistema deve permitir registrar mensagens de cliente e atendente.

Critérios:

- mensagem deve ter autor;
- mensagem deve manter data de criação;
- mensagens não devem ser alteradas silenciosamente.

## RF-006 - Atribuição e Status de Conversa

O sistema deve permitir atribuir conversas a usuários e controlar seu status.

Critérios:

- conversa pode ser atribuída a um usuário da organização;
- status segue os estados definidos (`open`, `waiting_customer`, `waiting_agent`, `resolved`, `closed`);
- transições inválidas devem ser rejeitadas;
- conversa fechada não recebe mensagem sem reabertura.

## RF-007 - Analytics de Atendimento

O sistema deve expor métricas administrativas de atendimento.

Critérios:

- métricas devem filtrar por organização e período;
- métricas do MVP: total de conversas, abertas/fechadas, tempo de primeira resposta e volume por atendente;
- fórmulas devem estar documentadas (ver `docs/sdd/specs/analytics-spec.md`);
- endpoints devem respeitar permissões.

## RF-008 - Dashboard

O sistema deve ter frontend administrativo simples.

Critérios:

- consumir contratos reais da API;
- permitir executar fluxo ponta a ponta (login, conversas, mensagens, métricas);
- não duplicar regras de negócio do backend.

## RF-009 - Gestão de Usuários

O sistema deve permitir cadastrar e gerenciar os usuários internos da organização.

Critérios:

- usuário com `users.manage` cria usuários com papel (`admin`, `manager`, `agent`, `viewer`);
- membros são listados por organização (paginado);
- papel e status do vínculo podem ser alterados;
- o vínculo do owner não é alterável via API;
- usuário não altera o próprio vínculo;
- detalhado em `docs/sdd/specs/user-management-spec.md`.

## 4. Requisitos Não Funcionais

## RNF-001 - Segurança

O sistema deve proteger dados por organização, autenticação, autorização e validação de entrada.

## RNF-002 - Auditabilidade

O histórico de atendimento deve ser auditável:

- mensagens preservam autoria e data de criação;
- mensagens não são alteradas silenciosamente;
- ações sensíveis (login, mudança de papel, atribuição, mudança de status) devem ser registráveis em log.

## RNF-003 - Testabilidade

Módulos críticos devem ter testes automatizados, especialmente:

- autenticação;
- autorização;
- isolamento por tenant;
- conversas e mensagens;
- analytics.

## RNF-004 - Observabilidade

O sistema deve registrar logs suficientes para investigar erros de permissão, falhas de autenticação e erros de aplicação.

## RNF-005 - Manutenibilidade

Integrações externas (ex.: storage e e-mail, quando existirem) devem ser encapsuladas por interfaces para permitir testes e troca de fornecedores.

## RNF-006 - Performance

Listagens devem ser paginadas e limitar o tamanho do payload; consultas de domínio devem usar índices por `organizationId`.

## RNF-007 - Execução em Container

O sistema deve executar 100% em Docker, em desenvolvimento, CI e deploy.

Critérios:

- a máquina host só precisa de Docker, Docker Compose, Git e editor;
- backend, frontend, PostgreSQL, Redis, migrations, testes e smoke tests rodam em containers;
- nenhum comando obrigatório do projeto depende de Node.js, banco, Redis ou ferramentas instaladas no host.

Detalhado em `docs/sdd/specs/docker-execution-spec.md` e ADR-0006.

## 5. Regras de Negócio Globais

- Todo dado de domínio deve pertencer a uma organização.
- Usuário só opera dentro das organizações às quais pertence.
- Mensagens preservam autoria e data e não são alteradas silenciosamente.
- Conversa fechada não recebe novas mensagens sem reabertura.
- Acesso a dados é sempre filtrado por organização.

## 6. Como Usar Este Documento com IA

Prompt de execução:

```text
Leia docs/sdd/requirements.md. Transforme os requisitos em uma lista priorizada de casos de uso do MVP. Aponte ambiguidades e dependências técnicas. Não implemente código.
```

## 7. Histórico de Mudanças

- **1.1 (2026-06-09):** adicionado RF-009 (Gestão de Usuários).
- **1.0 (2026-06-03):** versão inicial.

**Versão:** 1.1  
**Status:** Proposta  
**Owner:** Equipe do projeto  
**Última atualização:** 2026-06-09  
**Substitui:** N/A
