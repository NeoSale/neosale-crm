#!/bin/sh

# Script de inicialização para aplicar variáveis de ambiente do EasyPanel

echo "Iniciando aplicação NeoSale CRM..."
echo "Configurando variáveis de ambiente dinâmicas..."

# Definir variáveis de ambiente com valores padrão
export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-https://evolution-api-neosale-api.mrzt3w.easypanel.host/api}"
export NODE_ENV="${NODE_ENV:-production}"
export PORT="${PORT:-3000}"
export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export NEXT_TELEMETRY_DISABLED="${NEXT_TELEMETRY_DISABLED:-1}"

echo "Variáveis de ambiente configuradas:"
echo "NEXT_PUBLIC_API_URL: $NEXT_PUBLIC_API_URL"
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "HOSTNAME: $HOSTNAME"
echo "NEXT_TELEMETRY_DISABLED: $NEXT_TELEMETRY_DISABLED"

# Criar arquivo de configuração runtime para Next.js
echo "Criando configuração runtime..."
cat > public/runtime-config.js << 'EOF'
// Configuração de runtime para variáveis de ambiente
window.__RUNTIME_CONFIG__ = {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://evolution-api-neosale-api.mrzt3w.easypanel.host/api'
};
EOF

# Substituir variáveis no arquivo de configuração
sed -i "s|process.env.NEXT_PUBLIC_API_URL|'$NEXT_PUBLIC_API_URL'|g" public/runtime-config.js

echo "Arquivo de configuração runtime criado:"
cat public/runtime-config.js

# Verificar variáveis críticas
if [ -n "$NEXT_PUBLIC_API_URL" ]; then
    echo "✓ NEXT_PUBLIC_API_URL configurada: $NEXT_PUBLIC_API_URL"
else
    echo "⚠ NEXT_PUBLIC_API_URL não definida, usando valor padrão"
fi

echo "Iniciando servidor Next.js..."
# Executar o servidor Next.js
exec "$@"