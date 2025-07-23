# Etapa 1: Build com variáveis de ambiente do EasyPanel
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN mkdir -p public

ENV NEXT_TELEMETRY_DISABLED=1
ENV ESLINT_NO_DEV_ERRORS=true

RUN npm run build

# Etapa 2: Imagem de produção
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

# Copia apenas os arquivos necessários
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nextjs /app/public ./public
COPY --chown=nextjs:nextjs generate-runtime-config.sh ./

# ✅ Garante que a public exista de fato e com permissão
RUN mkdir -p /app/public && chown -R nextjs:nextjs /app/public

RUN chmod +x generate-runtime-config.sh

USER nextjs

EXPOSE 3000

CMD ["./generate-runtime-config.sh"]
