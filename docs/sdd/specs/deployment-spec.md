<!-- Projeto Desenvolvido na Data Science Academy -->

# Deployment Spec

## 1. Objetivo

Definir como executar e publicar o MVP em ambiente realista usando containers.

## 2. Escopo

Inclui:

- variáveis de ambiente;
- Docker obrigatório;
- Docker Compose;
- banco;
- migrations;
- backend;
- frontend;
- health check;
- smoke tests;
- CI/CD básico.

## 2.1 Política de Execução 100% Docker

A aplicação deve rodar 100% em Docker em desenvolvimento, CI e deploy.

Não deve haver instrução obrigatória que exija instalar Node.js, package manager, PostgreSQL, Redis ou ferramentas de migration diretamente no host.

Todo comando oficial deve usar `docker compose`, `docker build` ou comandos executados dentro de containers.

## 3. Serviços

Serviços necessários:

- container da API backend;
- container do frontend web;
- container PostgreSQL;
- container Redis.

## 4. Variáveis de Ambiente

Exemplos:

```text
DATABASE_URL=
REDIS_URL=
JWT_SECRET=
APP_BASE_URL=
API_BASE_URL=
```

Nunca commitar valores reais.

## 5. Health Check

Endpoint:

```text
GET /api/v1/health
```

Resposta:

```json
{
  "status": "ok",
  "services": {
    "database": "ok",
    "redis": "ok"
  }
}
```

Não expor segredos ou detalhes sensíveis.

## 6. Ordem de Deploy

1. provisionar banco;
2. provisionar Redis;
3. configurar variáveis;
4. buildar imagens;
5. subir backend;
6. executar migrations em container;
7. subir frontend;
8. executar smoke tests em container.

## 7. Smoke Tests

Testes mínimos:

- health check da API;
- frontend carrega;
- login funciona;
- banco responde;
- criação de conversa funciona.

## 8. CI/CD

Pipeline mínimo:

1. instalar dependências dentro da imagem ou container;
2. lint;
3. typecheck;
4. testes;
5. build;
6. build das imagens Docker;
7. smoke tests com containers.

## 8.1 Non-Goals

- alta disponibilidade multi-região e autoscaling;
- estratégias blue-green/canary (deploy simples com janela curta);
- observabilidade avançada (APM/tracing distribuído) — apenas logs e health check no MVP.

## 8.2 Casos de Borda

- variável de ambiente obrigatória ausente: a aplicação deve **falhar no boot** com mensagem clara (fail fast), nunca subir com default inseguro;
- migration falha no meio do deploy: a ordem do §6 (migrations antes de subir a nova API) limita o dano; não prosseguir com a subida e acionar o rollback do §9;
- health check `503` após deploy: considerar o deploy falho e reverter, mesmo que o processo esteja de pé.

## 9. Rollback Básico

Em caso de falha:

- reverter versão da API;
- não reverter migration destrutiva sem plano;
- preservar logs;
- registrar incidente.

## 9.1 Riscos e Questões Abertas

Riscos:

- migration irreversível aplicada antes de detectar falha: mitigar preferindo migrations aditivas e compatíveis com a versão anterior;
- segredos vazando em logs de deploy: proibido logar variáveis de ambiente (security-spec §7).

Questões abertas:

- ambiente alvo de produção (VPS, PaaS ou cloud gerenciada) é decisão da T4.2, a registrar via ADR.

## 10. Critérios de Aceite

- aplicação sobe em ambiente alvo;
- aplicação roda sem runtime instalado no host;
- Dockerfiles existem para API e web;
- Docker Compose sobe API, web, PostgreSQL e Redis;
- health check responde;
- migrations executam em container;
- frontend aponta para API correta;
- segredos não aparecem no repositório;
- smoke tests passam em container.

## 11. Prompt Para Claude Code

```text
Leia deployment-spec.md e docker-execution-spec.md. Crie os arquivos de Docker, Compose, deploy e documentação necessários. Não inclua segredos reais. Adicione health check e smoke tests básicos executados em containers.
```

## 12. Histórico de Mudanças

- **1.1 (2026-06-09):** adicionados non-goals, casos de borda (fail fast, migration no meio do deploy) e riscos/questões abertas, conforme `spec-template.md`.
- **1.0 (2026-06-03):** versão inicial.

**Versão:** 1.1  
**Status:** Proposta  
**Owner:** Equipe do projeto  
**Última atualização:** 2026-06-09  
**Substitui:** N/A
