#!/bin/sh

# Script de inicialização para aplicar variáveis de ambiente do EasyPanel

echo "Iniciando aplicação NeoSale CRM..."
echo "Configurando variáveis de ambiente dinâmicas..."

# Criar arquivo .env.local dinâmico com variáveis do EasyPanel
cat > .env.local << EOF
# Variáveis de ambiente geradas dinamicamente pelo EasyPanel
NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-https://evolution-api-neosale-api.mrzt3w.easypanel.host/api}
NODE_ENV=${NODE_ENV:-production}
PORT=${PORT:-3000}
HOSTNAME=${HOSTNAME:-0.0.0.0}
NEXT_TELEMETRY_DISABLED=${NEXT_TELEMETRY_DISABLED:-1}
EOF

echo "Arquivo .env.local criado com as seguintes variáveis:"
cat .env.local

# Verificar variáveis críticas
if [ -n "$NEXT_PUBLIC_API_URL" ]; then
    echo "✓ NEXT_PUBLIC_API_URL configurada: $NEXT_PUBLIC_API_URL"
else
    echo "⚠ NEXT_PUBLIC_API_URL não definida, usando valor padrão"
fi

echo "Iniciando servidor Next.js..."
# Executar o servidor Next.js
exec "$@"