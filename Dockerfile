# Etapa 1: Build com variáveis de ambiente
FROM node:18-alpine AS builder

WORKDIR /app

# Build args para variáveis NEXT_PUBLIC_* (substituídas em build-time pelo Next.js)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL

COPY package.json ./

# Copiar tarballs dos pacotes locais do monorepo
COPY neosale-ui.tgz /tmp/neosale-ui.tgz
COPY neosale-auth.tgz /tmp/neosale-auth.tgz

# Substituir file: references pelos tarballs
RUN sed -i 's|"@neosale/auth": "file:../neosale-auth"|"@neosale/auth": "file:/tmp/neosale-auth.tgz"|g' package.json && \
    sed -i 's|"@neosale/core": "file:../neosale-core"|"@neosale/core": "file:/tmp/neosale-auth.tgz"|g' package.json && \
    sed -i 's|"@neosale/ui": "file:../neosale-ui"|"@neosale/ui": "file:/tmp/neosale-ui.tgz"|g' package.json

RUN npm install --legacy-peer-deps

COPY . .
RUN mkdir -p public

ENV NEXT_TELEMETRY_DISABLED=1
ENV ESLINT_NO_DEV_ERRORS=true
# Usar os build args como variáveis de ambiente durante o build
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

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
