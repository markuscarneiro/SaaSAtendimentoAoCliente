<!-- Projeto Desenvolvido na Data Science Academy -->

# Traceability Matrix - SaaS de Atendimento ao Cliente

## 1. Objetivo

Conectar requisitos (`requirements.md`), tasks (`tasks.md`), critérios de aceite (`acceptance-criteria.md`) e áreas de teste (`test-plan.md`).

Toda task deve rastrear pelo menos um requisito. Todo requisito funcional deve ter task, critério de aceite e cobertura de teste.

## 2. Requisitos Funcionais

| Requisito | Tasks | Critério de aceite | Áreas de teste |
|---|---|---|---|
| RF-001 Organização | T2.1, T2.2 | AC §3 | test 3.1 |
| RF-002 Autenticação | T2.2 | AC §3 | test 3.1 |
| RF-003 Papéis e Permissões | T2.3 | AC §3 | test 3.2 |
| RF-004 Conversas | T2.4 | AC §4 | test 3.3 |
| RF-005 Mensagens | T2.4 | AC §4 | test 3.3 |
| RF-006 Atribuição e Status | T2.5 | AC §4 | test 3.3 |
| RF-007 Analytics de Atendimento | T3.1 | AC §5 | test 3.4 |
| RF-008 Dashboard | T3.2 | AC §6 | test 3.4, E2E §4 |
| RF-009 Gestão de Usuários | T2.6 | AC §3 | test 3.5 |

## 3. Requisitos Não Funcionais

| Requisito | Tasks | Critério de aceite | Áreas de teste |
|---|---|---|---|
| RNF-001 Segurança | T2.2, T2.3 | AC §3 | test 3.1, 3.2 |
| RNF-002 Auditabilidade | T2.4, T2.5 | AC §4 | test 3.3 |
| RNF-003 Testabilidade | todas | AC §7 | test §7 |
| RNF-004 Observabilidade | transversal | AC §7 | logs (sem área dedicada) |
| RNF-005 Manutenibilidade | T1.1, T1.2 | AC §7 | test §5 |
| RNF-006 Performance | T2.4 | AC §4 | test 3.3 (paginação) |
| RNF-007 Execução em Container | T1.1, T1.2, T4.1, T4.2 | AC §2.1 | smoke |

## 4. Lacunas Conhecidas

- RNF-004 (Observabilidade) ainda não tem cenários de teste dedicados; é validado de forma transversal por logs nas demais áreas.
- RNF-005 (Manutenibilidade) só se materializa quando houver integração externa (ex.: e-mail); no MVP não há provider externo.
- A resolução de customer por `externalRef` fica pós-MVP; ver `specs/conversation-history-spec.md` §4.1.
- `priority` de conversa é campo reservado (sempre `normal` no MVP); ver `specs/conversation-history-spec.md` §4.0.2.
- Convite de usuário por e-mail, troca e recuperação de senha ficam pós-MVP; ver `specs/user-management-spec.md` §3.
- O seed de demonstração (T2.7, `specs/seed-spec.md`) é apoio de desenvolvimento e não rastreia requisito funcional próprio.

## 5. Como Manter

Ao criar ou alterar um requisito, atualize esta matriz e confirme que existe task, critério de aceite e área de teste correspondentes. Ao concluir uma task, verifique se os critérios de aceite vinculados foram cobertos por testes.

**Versão:** 1.1  
**Status:** Proposta  
**Owner:** Equipe do projeto  
**Última atualização:** 2026-06-09  
**Substitui:** N/A
