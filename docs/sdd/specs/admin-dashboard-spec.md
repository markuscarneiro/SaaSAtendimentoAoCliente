<!-- Projeto Desenvolvido na Data Science Academy -->

# Admin Dashboard Spec

## 1. Objetivo

Criar dashboard administrativo simples para demonstrar o produto e validar o backend.

O frontend deve consumir contratos reais da API e não duplicar regras de negócio.

## 1.1 Contexto e Motivação

O foco operacional do projeto é o backend; o dashboard existe para provar o fluxo ponta a ponta com contratos reais (`product-brief.md` §7) e dar aos papéis de gestão uma visão operável de conversas e métricas. Por isso a spec privilegia simplicidade: telas finas, estados explícitos e zero regra de negócio no cliente.

## 1.2 Non-Goals

- aplicativo mobile ou layout mobile-first (desktop-first simples);
- atualização em tempo real (WebSocket/polling agressivo);
- internacionalização (apenas pt-BR no MVP);
- temas/white-label;
- gráficos avançados (números e listas bastam no MVP);
- cadastro self-service além do fluxo de registro de organização já previsto.

## 2. Escopo do MVP

Telas:

- login;
- conversas;
- detalhe da conversa;
- analytics;
- configurações básicas.

## 3. Fluxos

## 3.1 Login

Usuário informa email e senha, recebe token e acessa dashboard.

Estados:

- loading;
- erro de credenciais;
- sucesso.

## 3.2 Conversas

Lista:

- status;
- cliente;
- assunto;
- última mensagem;
- responsável.

Detalhe:

- histórico paginado;
- campo de mensagem;
- atribuir responsável;
- mudar status.

## 3.3 Analytics

Exibe:

- conversas totais;
- abertas / resolvidas / fechadas;
- tempo de primeira resposta;
- volume por atendente.

## 4. Regras

- Frontend consome `api-contract.md`.
- Backend decide permissões.
- Estados de loading, erro e vazio devem existir.
- Frontend não decide autorização final.

## 4.1 Casos de Borda

- token expirado durante o uso (`401` em qualquer chamada): limpar sessão local e redirecionar ao login;
- usuário sem permissão para uma ação (`403` ou ausência em `permissions` do `/me`): ação fica oculta/desabilitada, mas a decisão final é sempre do backend;
- listas vazias (organização nova, sem conversas): estado vazio com orientação, não tela quebrada;
- conversa com histórico longo: paginação do histórico via `GET /conversations/:id/messages`;
- falha de rede/API fora do ar: estado de erro com ação de tentar novamente;
- conteúdo de mensagem com unicode/emoji e quebras de linha: renderizado como texto (escapado, nunca HTML).

## 5. Critérios de Aceite

- usuário faz login;
- lista conversas;
- abre conversa;
- envia mensagem;
- atribui responsável;
- muda status;
- vê métricas.

## 6. Testes Recomendados

- testes de componentes críticos;
- testes de integração com a API;
- teste e2e do fluxo principal, se houver tempo.

## 6.1 Riscos e Questões Abertas

Riscos:

- duplicação de regra de negócio no cliente: mitigada usando `permissions` do `/me` apenas para esconder ações (a decisão é do backend);
- deriva entre frontend e contrato: mitigada consumindo `api-contract.md`/`openapi.yaml` como fonte de verdade e revisando com a skill `api-contract-review`;
- token JWT em `localStorage` é vulnerável a XSS: aceito no MVP (ADR-0005); mitigação principal é nunca renderizar conteúdo como HTML.

Questões abertas:

- tela de "configurações básicas" (escopo mínimo): exibir organização e membros (`GET /users`); edição além de papel/status fica pós-MVP;
- atualização automática da lista de conversas (polling leve): decidir durante T3.2 conforme tempo disponível.

## 7. Prompt Para Claude Code

```text
Leia admin-dashboard-spec.md e api-contract.md. Implemente o dashboard consumindo a API real. Não coloque regras de autorização finais no frontend.
```

## 8. Histórico de Mudanças

- **1.1 (2026-06-09):** adicionados contexto/motivação, non-goals, casos de borda (token expirado, estados vazios, escape de conteúdo) e riscos/questões abertas, conforme `spec-template.md`.
- **1.0 (2026-06-03):** versão inicial.

**Versão:** 1.1  
**Status:** Proposta  
**Owner:** Equipe do projeto  
**Última atualização:** 2026-06-09  
**Substitui:** N/A
