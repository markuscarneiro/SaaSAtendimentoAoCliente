-- Migration inicial — SaaS de Atendimento ao Cliente
-- Spec: docs/sdd/database-schema.md
-- Gerada manualmente seguindo convenções Prisma 6.x (ADR-0003).
-- O índice único parcial de customers (§3.4) foi adicionado via raw DDL
-- pois não é expressável no schema Prisma declarativo.

-- ---- organizations ------------------------------------------
CREATE TABLE "organizations" (
    "id"         TEXT        NOT NULL,
    "name"       TEXT        NOT NULL,
    "slug"       TEXT        NOT NULL,
    "status"     TEXT        NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");
CREATE INDEX "organizations_status_idx" ON "organizations"("status");

-- ---- users --------------------------------------------------
CREATE TABLE "users" (
    "id"            TEXT        NOT NULL,
    "name"          TEXT        NOT NULL,
    "email"         TEXT        NOT NULL,
    "password_hash" TEXT        NOT NULL,
    "status"        TEXT        NOT NULL DEFAULT 'active',
    "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- ---- organization_members -----------------------------------
CREATE TABLE "organization_members" (
    "id"              TEXT        NOT NULL,
    "organization_id" TEXT        NOT NULL,
    "user_id"         TEXT        NOT NULL,
    "role"            TEXT        NOT NULL,
    "status"          TEXT        NOT NULL DEFAULT 'active',
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "organization_members_organization_id_user_id_key"
    ON "organization_members"("organization_id", "user_id");
CREATE INDEX "organization_members_user_id_idx"
    ON "organization_members"("user_id");
CREATE INDEX "organization_members_organization_id_role_idx"
    ON "organization_members"("organization_id", "role");

ALTER TABLE "organization_members"
    ADD CONSTRAINT "organization_members_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "organization_members"
    ADD CONSTRAINT "organization_members_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---- customers ----------------------------------------------
CREATE TABLE "customers" (
    "id"              TEXT        NOT NULL,
    "organization_id" TEXT        NOT NULL,
    "name"            TEXT        NOT NULL,
    "email"           TEXT,
    "external_ref"    TEXT,
    "metadata"        JSONB,
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "customers_organization_id_idx"
    ON "customers"("organization_id");
CREATE INDEX "customers_organization_id_email_idx"
    ON "customers"("organization_id", "email");

-- Unique parcial: mesma organização não pode ter dois customers com o mesmo
-- external_ref, mas pode ter múltiplos com external_ref NULL (database-schema §3.4).
CREATE UNIQUE INDEX "customers_organization_id_external_ref_key"
    ON "customers"("organization_id", "external_ref")
    WHERE "external_ref" IS NOT NULL;

ALTER TABLE "customers"
    ADD CONSTRAINT "customers_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---- conversations ------------------------------------------
CREATE TABLE "conversations" (
    "id"               TEXT        NOT NULL,
    "organization_id"  TEXT        NOT NULL,
    "customer_id"      TEXT        NOT NULL,
    "assigned_user_id" TEXT,
    "status"           TEXT        NOT NULL DEFAULT 'open',
    "priority"         TEXT        NOT NULL DEFAULT 'normal',
    "channel"          TEXT        NOT NULL DEFAULT 'manual',
    "subject"          TEXT,
    "last_message_at"  TIMESTAMP(3),
    "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"       TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "conversations_organization_id_status_idx"
    ON "conversations"("organization_id", "status");
CREATE INDEX "conversations_organization_id_assigned_user_id_idx"
    ON "conversations"("organization_id", "assigned_user_id");
CREATE INDEX "conversations_organization_id_last_message_at_idx"
    ON "conversations"("organization_id", "last_message_at");

ALTER TABLE "conversations"
    ADD CONSTRAINT "conversations_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "conversations"
    ADD CONSTRAINT "conversations_customer_id_fkey"
    FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "conversations"
    ADD CONSTRAINT "conversations_assigned_user_id_fkey"
    FOREIGN KEY ("assigned_user_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ---- messages -----------------------------------------------
CREATE TABLE "messages" (
    "id"              TEXT        NOT NULL,
    "organization_id" TEXT        NOT NULL,
    "conversation_id" TEXT        NOT NULL,
    "author_type"     TEXT        NOT NULL,
    "author_id"       TEXT,
    "content"         TEXT        NOT NULL,
    "metadata"        JSONB,
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "messages_organization_id_conversation_id_created_at_idx"
    ON "messages"("organization_id", "conversation_id", "created_at");

ALTER TABLE "messages"
    ADD CONSTRAINT "messages_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "messages"
    ADD CONSTRAINT "messages_conversation_id_fkey"
    FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
