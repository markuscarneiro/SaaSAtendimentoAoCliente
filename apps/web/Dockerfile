# ============================================================
# apps/web/Dockerfile — multi-stage (ADR-0005)
# Build context: raiz do projeto (docker compose build)
#
# Stage 1 deps    — instala dependências do workspace
# Stage 2 build   — compila a SPA com Vite
# Stage 3 runtime — servidor estático Node (serve)
#
# VITE_API_BASE_URL é injetada em build-time via ARG do Compose.
# Para ambientes onde a URL da API muda em runtime, substitua o
# stage 3 por um servidor que injete window.__CONFIG__ no index.html.
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

# URL da API exposta ao bundle via import.meta.env.VITE_API_BASE_URL
ARG VITE_API_BASE_URL=http://localhost:3000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY apps/web/index.html        ./apps/web/
COPY apps/web/vite.config.ts    ./apps/web/
COPY apps/web/tsconfig.json     ./apps/web/
COPY apps/web/tsconfig.node.json ./apps/web/
COPY apps/web/src               ./apps/web/src

RUN pnpm --filter @saas-atendimento/web run build

# ---- Stage 3: runtime ---------------------------------------
FROM node:22-alpine AS runtime

RUN npm install -g serve

WORKDIR /app

COPY --from=build /app/apps/web/dist ./dist

EXPOSE 5173

# -s: single-page app (redireciona 404 para index.html)
CMD ["serve", "-s", "dist", "-l", "5173"]
