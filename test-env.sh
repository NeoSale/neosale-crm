#!/bin/bash

# Script para testar variáveis de ambiente localmente

echo "🧪 Testando configuração de variáveis de ambiente..."

# Definir variáveis de teste
export NEXT_PUBLIC_API_URL="https://evolution-api-neosale-api-hml.mrzt3w.easypanel.host/api"
export NODE_ENV="production"
export PORT="3000"
export HOSTNAME="0.0.0.0"
export NEXT_TELEMETRY_DISABLED="1"

echo "Variáveis definidas:"
echo "NEXT_PUBLIC_API_URL: $NEXT_PUBLIC_API_URL"
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "HOSTNAME: $HOSTNAME"
echo "NEXT_TELEMETRY_DISABLED: $NEXT_TELEMETRY_DISABLED"

echo ""
echo "🐳 Testando com Docker..."
echo "Comando para testar:"
echo "docker run -e NEXT_PUBLIC_API_URL='$NEXT_PUBLIC_API_URL' -e NODE_ENV='$NODE_ENV' -e PORT='$PORT' -p 3000:3000 brunobspaiva/neosale-crm:latest"

echo ""
echo "📋 Para EasyPanel, configure estas variáveis:"
echo "NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL"
echo "NODE_ENV=$NODE_ENV"
echo "PORT=$PORT"
echo "HOSTNAME=$HOSTNAME"
echo "NEXT_TELEMETRY_DISABLED=$NEXT_TELEMETRY_DISABLED"