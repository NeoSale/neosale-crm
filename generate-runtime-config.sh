#!/bin/sh

echo "🔧 Gerando arquivo de config runtime..."

# Define o caminho completo da pasta pública
RUNTIME_DIR="./public"
RUNTIME_FILE="$RUNTIME_DIR/runtime-config.js"

# Garante que a pasta existe
mkdir -p "$RUNTIME_DIR"

# Cria o arquivo runtime-config.js
cat <<EOF > "$RUNTIME_FILE"
window.__RUNTIME_CONFIG__ = {
  NEXT_PUBLIC_API_URL: "${NEXT_PUBLIC_API_URL}",
  NEXT_PUBLIC_SUPABASE_URL: "${NEXT_PUBLIC_SUPABASE_URL}",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "${NEXT_PUBLIC_SUPABASE_ANON_KEY}"
};
EOF

echo "✅ Arquivo gerado: $RUNTIME_FILE"
ls -la "$RUNTIME_FILE"
cat "$RUNTIME_FILE"

echo "🚀 Iniciando servidor Next.js..."
exec node server.js
