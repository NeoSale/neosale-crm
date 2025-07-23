# Etapa 1: Build com variáveis de ambiente do EasyPanel
FROM node:18-alpine AS builder

WORKDIR /app

# Instala dependências
COPY package.json package-lock.json* ./
RUN npm ci

# Copia o restante do projeto
COPY . .

# Variáveis padrão para build (EasyPanel injeta o resto)
ENV NEXT_TELEMETRY_DISABLED=1
ENV ESLINT_NO_DEV_ERRORS=true

# Gera build do Next.js
RUN npm run build

# Etapa 2: Imagem de produção
FROM node:18-alpine AS runner

WORKDIR /app

# Variáveis runtime (sobrescrevíveis pelo EasyPanel)
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Cria usuário para segurança
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

# Copia os arquivos de produção
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nextjs /app/public ./public
COPY --chown=nextjs:nextjs generate-runtime-config.sh ./

# Permissão para o script
RUN chmod +x generate-runtime-config.sh

USER nextjs

EXPOSE 3000

# Inicia com script que injeta config runtime e roda o servidor
CMD ["./generate-runtime-config.sh"]
