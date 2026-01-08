#!/bin/bash

# Script para aplicar a correção de políticas RLS para profiles
# Este script aplica a migration 004_fix_profiles_insert_policy.sql

echo "🔧 Aplicando correção de políticas RLS para profiles..."

# Verificar se as variáveis de ambiente estão configuradas
if [ -z "$SUPABASE_DB_URL" ]; then
  echo "❌ Erro: SUPABASE_DB_URL não está configurada"
  echo "Configure com: export SUPABASE_DB_URL='postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres'"
  exit 1
fi

# Aplicar a migration
echo "📝 Executando migration 004_fix_profiles_insert_policy.sql..."
psql "$SUPABASE_DB_URL" -f supabase/migrations/004_fix_profiles_insert_policy.sql

if [ $? -eq 0 ]; then
  echo "✅ Migration aplicada com sucesso!"
else
  echo "❌ Erro ao aplicar migration"
  exit 1
fi

echo ""
echo "🎉 Correção aplicada! Agora os usuários podem criar seus perfis automaticamente."
