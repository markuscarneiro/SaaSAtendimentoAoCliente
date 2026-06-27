<!-- Projeto Desenvolvido na Data Science Academy -->

# Seed Spec - Dados de Demonstração

## 1. Objetivo

Definir o seed de dados de demonstração para desenvolvimento e validação do dashboard e do analytics.

Sem dados, as telas de conversas e métricas (T3.1, T3.2) não podem ser validadas de forma realista.

## 1.1 Non-Goals

- dados de produção ou anonimização de dados reais;
- massa de dados para teste de carga/performance;
- seed configurável por parâmetros (um cenário fixo basta no MVP).

## 2. Regras Gerais

- O seed roda **dentro de container**, conforme `docker-execution-spec.md` §7:

```bash
docker compose exec api <comando-de-seed>
```

- O seed é **idempotente**: rodar duas vezes não duplica dados (usar identificadores fixos, ex.: slug da organização).
- O seed é exclusivo de desenvolvimento/demonstração; nunca roda automaticamente em produção.
- Senhas de demonstração são fixas e documentadas aqui; não são segredos.

## 3. Dados Mínimos

Organização:

- 1 organização demo (`slug: demo`).

Usuários (um por papel, senha `demo-password-123`):

| Nome | Email | Papel |
|---|---|---|
| Demo Owner | owner@demo.test | owner |
| Demo Admin | admin@demo.test | admin |
| Demo Manager | manager@demo.test | manager |
| Demo Agent | agent@demo.test | agent |
| Demo Viewer | viewer@demo.test | viewer |

Domínio:

- ao menos 5 customers (alguns com email, ao menos um sem);
- ao menos 10 conversas distribuídas entre os status (`open`, `waiting_agent`, `waiting_customer`, `resolved`, `closed`), algumas atribuídas ao agent;
- mensagens de `customer` e `agent` em cada conversa não vazia, com `createdAt` variados (para o cálculo de tempo de primeira resposta);
- `lastMessageAt` coerente com a última mensagem.

## 4. Critérios de Aceite

- seed executa em container com um único comando documentado no README;
- rodar o seed duas vezes não duplica registros;
- após o seed, login funciona com cada usuário demo;
- `GET /conversations` e `GET /analytics/overview` retornam dados não vazios para a organização demo;
- nenhum dado de seed vaza para outra organização.

## 4.1 Casos de Borda

- seed executado com migrations pendentes: deve falhar com mensagem clara pedindo migration, não corromper estado;
- seed re-executado após alteração manual dos dados demo: idempotência é por chave natural (slug da organização, emails); registros alterados não são "consertados";
- banco não vazio com outra organização real: o seed só toca a organização `demo`, nunca dados de terceiros.

## 4.2 Riscos e Questões Abertas

Riscos:

- execução acidental em produção: o seed deve recusar execução quando o ambiente for de produção (checagem explícita de variável de ambiente);
- credenciais demo conhecidas: aceitável apenas em ambiente local/didático; jamais criar os usuários demo fora dele.

Questões abertas:

- cenários de seed adicionais (volume maior para demonstrar paginação longa) ficam a critério da T2.7.

## 5. Testes Recomendados

- teste de idempotência do seed;
- smoke test pós-seed: login + listagem de conversas + overview.

## 6. Prompt Para Claude Code

```text
Leia seed-spec.md, docker-execution-spec.md e database-schema.md. Implemente o seed de demonstração idempotente executável via docker compose. Apresente plano antes de codar.
```

## 7. Histórico de Mudanças

- **1.1 (2026-06-09):** adicionados non-goals, casos de borda (migrations pendentes, banco compartilhado) e riscos (guard de produção), conforme `spec-template.md`.
- **1.0 (2026-06-09):** versão inicial.

**Versão:** 1.1  
**Status:** Proposta  
**Owner:** Equipe do projeto  
**Última atualização:** 2026-06-09  
**Substitui:** N/A
