#!/bin/sh

# Script de inicialização para substituir variáveis de ambiente em tempo de execução

echo "Iniciando aplicação NeoSale CRM..."

# Verificar se as variáveis de ambiente estão definidas
if [ -n "$NEXT_PUBLIC_API_URL" ]; then
    echo "Usando NEXT_PUBLIC_API_URL: $NEXT_PUBLIC_API_URL"
else
    echo "NEXT_PUBLIC_API_URL não definida, usando valor padrão"
fi

if [ -n "$NODE_ENV" ]; then
    echo "Usando NODE_ENV: $NODE_ENV"
else
    echo "NODE_ENV não definida, usando valor padrão"
fi

if [ -n "$PORT" ]; then
    echo "Usando PORT: $PORT"
else
    echo "PORT não definida, usando valor padrão"
fi

# Executar o servidor Next.js
exec "$@"