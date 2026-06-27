---
name: database-migration
description: Use para criar ou revisar schema, migrations, índices e relacionamentos do banco de dados seguindo domain-model.md e database-schema.md.
disable-model-invocation: true
---

<!-- Projeto Desenvolvido na Data Science Academy -->

# Database Migration

## Quando Usar

Use ao criar tabelas, alterar schema, adicionar índices ou revisar modelagem.

## Leia Primeiro

- `docs/sdd/domain-model.md`
- `docs/sdd/database-schema.md`
- `docs/sdd/security-spec.md`
- spec específica da funcionalidade
- migrations existentes em `apps/api/prisma/migrations/` ou equivalente

## Workflow

1. Compare domínio e schema.
2. Liste tabelas e campos afetados.
3. Verifique `organizationId` em entidades de domínio.
4. Defina FKs, índices e constraints.
5. Crie migration.
6. Atualize modelos ORM.
7. Crie testes ou validação de integração quando necessário.

## Regras

- Não criar tabela de domínio sem `organizationId`, salvo justificativa explícita.
- Evitar exclusões destrutivas.
- Preferir status `archived` ou `inactive` para dados auditáveis.
- Índices devem apoiar consultas por organização.

## Saída Esperada

Informe:

- tabelas alteradas;
- novos índices;
- restrições;
- impacto em dados existentes;
- comandos de migration/teste.
