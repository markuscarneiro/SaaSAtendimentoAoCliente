<!-- Projeto Desenvolvido na Data Science Academy -->

# Product Brief - SaaS de Atendimento ao Cliente

## 1. Resumo do Produto

O produto é um SaaS de atendimento ao cliente para empresas que desejam centralizar conversas com clientes e registrar o histórico de atendimento.

O foco é backend: regras de negócio, autenticação, autorização por papéis, isolamento multi-tenant e um modelo de conversas/mensagens consistente. Há também uma API REST e um frontend administrativo simples para operar o fluxo ponta a ponta.

Não há IA, RAG ou geração automática de respostas. O atendimento é conduzido por pessoas.

## 2. Problema

Empresas pequenas e médias normalmente enfrentam problemas como:

- respostas inconsistentes entre atendentes;
- perda de histórico de atendimento;
- dificuldade de atribuir e acompanhar conversas;
- ausência de métricas simples sobre volume e tempo de resposta;
- controle frágil de acesso entre times e clientes.

## 3. Proposta de Valor

O produto entrega:

- centralização das conversas e do histórico;
- multi-tenant com papéis e permissões;
- atribuição e mudança de status de conversas;
- dashboard administrativo;
- métricas básicas de atendimento (volume, status, tempo de resposta).

## 4. Público-Alvo

O MVP é voltado para empresas B2B com equipes pequenas ou médias de atendimento, suporte, sucesso do cliente ou operação interna.

Personas principais:

- Administrador da organização;
- Atendente;
- Gestor de atendimento;
- Cliente final (sujeito do atendimento, não usuário do sistema no MVP).

## 5. Escopo do MVP

O MVP deve permitir:

- criar uma organização;
- cadastrar e autenticar usuários;
- controlar papéis e permissões;
- cadastrar/resolver clientes;
- criar, listar e consultar conversas;
- atribuir conversa e mudar status;
- registrar mensagens de atendente e cliente;
- persistir histórico paginado;
- visualizar métricas administrativas básicas.

## 6. Fora de Escopo Inicial

Não fazem parte do MVP:

- IA, RAG, sugestões automáticas ou streaming de respostas;
- base de conhecimento e upload de documentos;
- integração com WhatsApp, Instagram, Telegram ou e-mail real;
- cobrança financeira real e billing;
- SSO corporativo;
- marketplace de integrações;
- data warehouse dedicado.

## 7. Diferencial Didático do Projeto

Este projeto existe para orientar programação assistida por IA com Spec-Driven Development.

O produto é o contexto prático. O resultado esperado central é:

- transformar necessidade de negócio em specs;
- criar contratos técnicos antes do código;
- conduzir o Claude Code por leitura, plano, implementação e revisão;
- construir um backend realista com autenticação, autorização, dados e multi-tenancy.

## 8. Indicadores de Sucesso do MVP

O projeto será considerado bem-sucedido quando:

- o fluxo ponta a ponta funcionar em ambiente local 100% Docker;
- uma organização conseguir operar conversas e mensagens;
- o backend bloquear acesso cross-tenant;
- os módulos críticos (auth, autorização, conversas) tiverem testes automatizados;
- o dashboard demonstrar conversas e métricas básicas;
- o fluxo SDD estiver documentado e reproduzível pelos desenvolvedores.

## 9. Restrições

- O backend é a fonte de verdade das regras de negócio.
- Dados de uma organização nunca podem aparecer para outra.
- Entrada do usuário deve ser validada antes da regra de negócio.
- O projeto deve ser implementado em fatias pequenas e testáveis.
- A execução oficial é 100% Docker.

## 10. Como Usar Este Documento com IA

Use este documento no início do projeto para alinhar visão, escopo e limites.

Prompt de execução:

```text
Leia docs/sdd/product-brief.md e resuma o produto, o MVP, as restrições e os riscos técnicos. Não implemente nada ainda. Liste dúvidas que precisam ser respondidas antes da primeira implementação.
```

**Versão:** 1.0  
**Status:** Proposta  
**Owner:** Equipe do projeto  
**Última atualização:** 2026-06-03  
**Substitui:** N/A
