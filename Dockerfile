# Dockerfile para NeoSale CRM
FROM node:18-alpine AS base

# Instalar dependências apenas quando necessário
FROM base AS deps
# Verificar https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine para entender por que libc6-compat pode ser necessário.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Instalar dependências baseado no gerenciador de pacotes preferido
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild o código fonte apenas quando necessário
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Garantir que o diretório public existe
RUN mkdir -p public

# Build args para variáveis de ambiente
ARG NEXT_PUBLIC_API_URL
ARG NODE_ENV=$NODE_ENV
ARG NEXT_TELEMETRY_DISABLED=1

# Definir variáveis de ambiente para o build
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NODE_ENV=$NODE_ENV
ENV NEXT_TELEMETRY_DISABLED=$NEXT_TELEMETRY_DISABLED
ENV ESLINT_NO_DEV_ERRORS=true

RUN npm run build

# Imagem de produção, copiar todos os arquivos e executar next
FROM base AS runner
WORKDIR /app

# Variáveis de ambiente padrão (podem ser sobrescritas pelo EasyPanel)
ENV NODE_ENV=$NODE_ENV
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Criar usuário e grupo
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Definir as permissões corretas para prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copiar automaticamente os arquivos de saída com base no trace de saída
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copiar diretório public para permitir criação de arquivos runtime
COPY --from=builder --chown=nextjs:nodejs /app/public ./public



USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]