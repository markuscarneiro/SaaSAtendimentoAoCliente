# ============================================================
# apps/api/Dockerfile — multi-stage (ADR-0004)
# Build context: raiz do projeto (docker compose build)
#
# Stage 1 deps    — instala dependências do workspace
# Stage 2 build   — gera Prisma Client, compila TypeScript e prepara deploy
# Stage 3 runtime — imagem mínima de produção
# ============================================================

# ---- Stage 1: deps ------------------------------------------
FROM node:22-alpine AS deps

RUN npm install -g pnpm@9

WORKDIR /app

# Manifests do workspace primeiro (camada de cache estável)
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Instala todas as deps (cria pnpm-lock.yaml se não existir)
RUN pnpm install

# ---- Stage 2: build -----------------------------------------
FROM deps AS build

WORKDIR /app

# Schema Prisma deve chegar antes do generate
COPY apps/api/prisma ./apps/api/prisma
COPY apps/api/tsconfig.json ./apps/api/
COPY apps/api/eslint.config.mjs ./apps/api/
COPY apps/api/src ./apps/api/src

# 1. Gera o Prisma Client tipado (deve rodar antes do tsc)
RUN pnpm --filter @saas-atendimento/api run db:generate

# 2. Compila TypeScript
RUN pnpm --filter @saas-atendimento/api run build

# 3. Deployment self-contained: resolve symlinks, inclui só prod deps
RUN pnpm deploy --filter @saas-atendimento/api --prod /deploy

# 4. `pnpm deploy` reinstala as deps de produção do zero e perde o Prisma
#    Client gerado no passo 1 (que ficou no node_modules do workspace, não
#    no /deploy). Regenera o client apontando para o schema copiado em
#    /deploy — o Prisma escreve o client resolvendo @prisma/client a partir
#    do schema informado, então o resultado cai no node_modules do /deploy.
COPY apps/api/prisma/schema.prisma /deploy/prisma/schema.prisma
RUN pnpm --filter @saas-atendimento/api exec prisma generate --schema=/deploy/prisma/schema.prisma

# ---- Stage 3: runtime (produção) ----------------------------
FROM node:22-alpine AS runtime

# openssl: necessário para o Prisma Query Engine em Alpine (ADR-0003)
RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production

# Dependências de produção (via pnpm deploy — sem symlinks do pnpm store)
COPY --from=build /deploy/node_modules ./node_modules
# Código compilado
COPY --from=build /app/apps/api/dist ./dist
# package.json necessário para resolução de módulos
COPY --from=build /deploy/package.json ./

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/v1/health || exit 1

CMD ["node", "dist/index.js"]

# ---- Stage 4: dev (desenvolvimento e testes) ----------------
# Parte do stage build: tem pnpm + devDeps + código compilado.
# openssl adicionado aqui porque o Prisma runtime precisa em Alpine.
FROM build AS dev

RUN apk add --no-cache openssl

WORKDIR /app/apps/api

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/v1/health || exit 1

CMD ["node", "dist/index.js"]
