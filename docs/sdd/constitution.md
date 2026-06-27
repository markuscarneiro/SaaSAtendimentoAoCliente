<!-- Projeto Desenvolvido na Data Science Academy -->

# Constitution - Projeto 1

**Versão:** 1.1  
**Status:** Aceita  
**Owner:** Equipe do projeto  
**Última atualização:** 2026-06-09  
**Substitui:** N/A

## 1. Objetivo

Este documento define os princípios invariantes do Projeto 1.

Ele deve ser lido antes de qualquer spec, plan, task ou implementação. Enquanto specs específicas mudam com frequência, a constitution muda raramente e representa as regras estáveis do projeto.

## 2. Princípios de Engenharia

## 2.1 Spec Antes de Código

Toda funcionalidade relevante deve começar por uma spec em `docs/sdd` ou `docs/sdd/specs`.

Antes de implementar, o agente deve:

- ler as specs relevantes;
- resumir o entendimento;
- apontar ambiguidades;
- propor plano;
- aguardar aprovação ou continuidade explícita.

## 2.2 Backend Como Fonte de Verdade

O backend é responsável por regras de negócio, segurança, permissões, validações críticas, isolamento por tenant, custo e rastreabilidade.

O frontend pode melhorar a experiência, mas não decide autorização nem integridade de dados.

## 2.3 Multi-Tenancy Obrigatório

Toda entidade de domínio operacional deve pertencer a uma organização.

Regras:

- usar `organizationId` como filtro obrigatório;
- bloquear acesso cross-tenant;
- testar cenários cross-tenant em rotas sensíveis;
- nunca recuperar clientes, conversas ou mensagens de outra organização.

## 2.4 Testes Como Especificação Executável

Critérios de aceite devem virar testes sempre que possível.

Priorizar testes para:

- autenticação;
- autorização;
- tenant;
- conversas e mensagens;
- analytics.

## 2.5 Integrações Externas Por Interface

Integrações externas (ex.: storage, e-mail, filas, quando existirem) devem ficar atrás de interfaces/adapters, para permitir troca de fornecedor e testes.

Testes não devem depender de serviços externos reais quando houver alternativa controlada.

## 2.6 Contratos Antes de Integrações

API e schema de dados devem ser definidos antes da implementação.

Mudanças em contrato exigem atualização de:

- `api-contract.md`;
- `openapi.yaml`, quando aplicável;
- specs específicas;
- testes;
- frontend consumidor.

## 2.7 Segurança Por Padrão

Regras:

- segredos nunca entram no repositório;
- senha nunca é armazenada em texto puro;
- entrada do usuário deve ser validada antes de regra de negócio;
- logs não devem expor chaves, tokens ou dados sensíveis desnecessários.

## 2.8 Implementação Em Fatias Pequenas

Cada task deve ser pequena, verificável e revisável.

Referência:

- ideal: 1 a 3 arquivos alterados;
- deve ter teste ou validação clara;
- deve poder ser revisada isoladamente;
- deve respeitar uma spec específica.

## 3. Padrões de Documentação

Toda spec deve possuir cabeçalho:

```markdown
**Versão:** 1.0
**Status:** Proposta | Aceita | Deprecada | Substituída
**Owner:** Equipe do projeto
**Última atualização:** YYYY-MM-DD
**Substitui:** N/A | caminho da spec substituída
```

Specs específicas devem conter, sempre que possível (ver `spec-template.md`):

- contexto e motivação (o porquê);
- objetivos;
- non-goals;
- requisitos funcionais;
- cenários BDD (dado-quando-então) para fluxos críticos;
- critérios de aceite;
- casos de erro;
- casos de borda;
- riscos e questões abertas;
- prompt sugerido.

Versionamento de specs:

- mudança aditiva ou esclarecimento: incrementa versão minor (1.0 → 1.1) e registra na seção "Histórico de Mudanças";
- mudança breaking de contrato: versão major (2.0) ou spec nova com referência cruzada;
- spec aposentada: marcar `Status: Deprecada` no topo com aviso e ponteiro para a substituta; manter o arquivo como histórico.

## 3.1 Ciclo de Vida de ADRs

- Status possíveis: `Proposta`, `Aceito`, `Rejeitado`, `Substituído`.
- ADR **aceito é imutável**: a decisão não é editada depois.
- Para revisar uma decisão, cria-se um **novo ADR** que declara `Substitui: ADR-NNNN`; o antigo passa a `Substituído por ADR-NNNN` e permanece no repositório como histórico.
- ADRs vivem em `docs/sdd/adr/NNNN-titulo-curto.md`, numerados sequencialmente com zero à esquerda.

## 3.2 Convenções de Código, Commits e Testes

- Commits seguem **Conventional Commits** (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`), com escopo opcional (ex.: `feat(auth): login com rate limit`).
- Uma task pequena = uma branch (`feat/t2.2-auth`) e um commit (ou poucos relacionados) ao ficar verde, conforme `build-playbook.md` §8.
- Testes seguem padrão **AAA** (Arrange-Act-Assert), com nomes que descrevem comportamento e derivados de critérios de aceite (ver `.claude/rules/testing.md`).
- Lint, typecheck e testes rodam **em container** e devem passar antes de marcar uma task como concluída.
- Ferramentas de linguagem, lint e teste seguem os ADRs 0003–0005.

## 4. Padrões de Uso do Claude Code

Fluxo obrigatório:

1. Ler constitution e specs.
2. Resumir entendimento.
3. Apontar ambiguidades.
4. Criar plano.
5. Quebrar em tasks.
6. Implementar uma task por vez.
7. Rodar testes.
8. Revisar contra critérios de aceite.

## 5. Definição de Pronto

Uma mudança só está pronta quando:

- spec foi consultada;
- plano foi apresentado;
- task executada era pequena;
- testes relevantes foram criados ou atualizados;
- validações disponíveis foram executadas;
- critérios de aceite foram revisados;
- riscos remanescentes foram documentados;
- specs foram atualizadas se o comportamento mudou.

## 6. Mudanças Nesta Constitution

Mudanças nesta constitution exigem:

- motivo explícito;
- revisão humana;
- ADR, se a mudança afetar arquitetura ou processo;
- atualização do `CLAUDE.md`.

## 7. Histórico de Mudanças

- **1.1 (2026-06-09):** adicionados campo `Substitui:` no cabeçalho padrão, regras de versionamento de specs, ciclo de vida de ADRs (§3.1) e convenções de código, commits e testes (§3.2). Motivo: aderência às boas práticas do e-book de SDD (caps. 5, 13).
- **1.0 (2026-06-03):** versão inicial.
