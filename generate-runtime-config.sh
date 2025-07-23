#!/bin/sh

echo "🔧 Gerando arquivo de config runtime..."

cat <<EOF > ./public/env.js
window.env = {
  NEXT_PUBLIC_API_URL: "${NEXT_PUBLIC_API_URL}"
};
EOF

echo "✅ Configuração gerada: ./public/env.js"

# Inicia o Next.js
echo "🚀 Iniciando aplicação..."
node server.js
