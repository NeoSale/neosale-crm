# Dockerfile para NeoSale CRM

# Etapa base com Node Alpine
FROM node:18-alpine AS base

# Etapa para instalar dependências
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Etapa de build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Garantir que o diretório public existe
RUN mkdir -p public

# Definir variáveis fixas para o build
ENV NEXT_TELEMETRY_DISABLED=1
ENV ESLINT_NO_DEV_ERRORS=true

# 🔥 Nesse ponto o EasyPanel já injetou ENV como NEXT_PUBLIC_API_URL, NODE_ENV, etc.
RUN npm run build

# Etapa final de produção
FROM base AS runner
WORKDIR /app

# Variáveis runtime (sobrescrevíveis pelo EasyPanel)
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Criar usuário e grupo para rodar a app com segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Permissões para cache de build
RUN mkdir .next && chown nextjs:nodejs .next

# Copiar arquivos necessários
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --chown=nextjs:nodejs generate-runtime-config.sh ./
COPY --chown=nextjs:nodejs test-easypanel-env.sh ./

# Garantir permissão de execução dos scripts
RUN chmod +x generate-runtime-config.sh test-easypanel-env.sh

USER nextjs
EXPOSE 3000

# Iniciar com script de runtime
CMD ["./generate-runtime-config.sh"]
