#!/bin/bash

# Script para testar e depurar variáveis de ambiente no EasyPanel
# Este script ajuda a diagnosticar problemas de configuração

echo "=== TESTE DE VARIÁVEIS DE AMBIENTE - EASYPANEL ==="
echo "Data/Hora: $(date)"
echo "Diretório atual: $(pwd)"
echo "Usuário: $(whoami)"
echo ""

# Verificar variáveis principais
echo "=== VARIÁVEIS DE AMBIENTE PRINCIPAIS ==="
echo "NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-'NÃO DEFINIDA'}"
echo "API_URL: ${API_URL:-'NÃO DEFINIDA'}"
echo "BACKEND_URL: ${BACKEND_URL:-'NÃO DEFINIDA'}"
echo "NODE_ENV: ${NODE_ENV:-'NÃO DEFINIDA'}"
echo "PORT: ${PORT:-'NÃO DEFINIDA'}"
echo "HOSTNAME: ${HOSTNAME:-'NÃO DEFINIDA'}"
echo ""

# Listar todas as variáveis relacionadas
echo "=== TODAS AS VARIÁVEIS NEXT_ ==="
env | grep -i "NEXT_" || echo "Nenhuma variável NEXT_ encontrada"
echo ""

echo "=== TODAS AS VARIÁVEIS RELACIONADAS A URL/API ==="
env | grep -iE "(URL|API|BACKEND|FRONTEND)" || echo "Nenhuma variável URL/API encontrada"
echo ""

# Verificar arquivos no diretório
echo "=== ARQUIVOS NO DIRETÓRIO /app ==="
ls -la /app/ 2>/dev/null || ls -la . || echo "Erro ao listar arquivos"
echo ""

# Testar criação do runtime-config.js
echo "=== TESTE DE CRIAÇÃO DO RUNTIME-CONFIG.JS ==="
if [ -f "./generate-runtime-config.sh" ]; then
    echo "Script generate-runtime-config.sh encontrado"
    echo "Executando script..."
    bash ./generate-runtime-config.sh
    echo "Status do script: $?"
    
    if [ -f "./public/runtime-config.js" ]; then
        echo "Arquivo runtime-config.js criado com sucesso:"
        cat ./public/runtime-config.js
    else
        echo "❌ Arquivo runtime-config.js NÃO foi criado"
    fi
else
    echo "❌ Script generate-runtime-config.sh NÃO encontrado"
fi
echo ""

# Verificar conectividade de rede (se possível)
echo "=== TESTE DE CONECTIVIDADE ==="
if command -v curl >/dev/null 2>&1; then
    if [ -n "$NEXT_PUBLIC_API_URL" ]; then
        echo "Testando conectividade com: $NEXT_PUBLIC_API_URL"
        curl -s -o /dev/null -w "Status HTTP: %{http_code}\nTempo: %{time_total}s\n" "$NEXT_PUBLIC_API_URL" || echo "Erro na conexão"
    else
        echo "NEXT_PUBLIC_API_URL não definida, pulando teste de conectividade"
    fi
else
    echo "curl não disponível, pulando teste de conectividade"
fi
echo ""

echo "=== FIM DO TESTE ==="
echo "Para mais informações, verifique os logs do container e o console do navegador."