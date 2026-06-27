# ============================================================
# apps/api/Dockerfile — multi-stage (ADR-0004)
# Build context: raiz do projeto (docker compose build)
#
# Stage 1 deps    — instala dependências do workspace
# Stage 2 build   — compila TypeScript e prepara deploy
# Stage 3 runtime — imagem mínima de produção
# ============================================================

# ---- Stage 1: deps ------------------------------------------
FROM node:22-alpine AS deps

RUN npm install -g pnpm

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

COPY apps/api/tsconfig.json ./apps/api/
COPY apps/api/src ./apps/api/src

# Compila TypeScript
RUN pnpm --filter @saas-atendimento/api run build

# Deployment self-contained: resolve symlinks do pnpm, inclui só prod deps
RUN pnpm deploy --filter @saas-atendimento/api --prod /deploy

# ---- Stage 3: runtime ---------------------------------------
FROM node:22-alpine AS runtime

# openssl: necessário para o Prisma em Alpine (ADR-0003)
RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production

# Dependências de produção (via pnpm deploy — sem symlinks)
COPY --from=build /deploy/node_modules ./node_modules
# Código compilado
COPY --from=build /app/apps/api/dist ./dist
# package.json necessário para resolução de módulos
COPY --from=build /deploy/package.json ./

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/v1/health || exit 1

CMD ["node", "dist/index.js"]
