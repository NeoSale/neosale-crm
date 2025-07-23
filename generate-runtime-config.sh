#!/bin/sh

# Script para configuração de runtime com variáveis de ambiente para Next.js standalone
echo "🚀 Configurando ambiente para Next.js..."

echo "📝 Configuração: NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}"

# Criar o arquivo runtime-config.js para o cliente
cat > /app/public/runtime-config.js << EOF
// Configuração de runtime para variáveis de ambiente
// Gerado automaticamente em: $(date)
window.__RUNTIME_CONFIG__ = {
  NEXT_PUBLIC_API_URL: '${NEXT_PUBLIC_API_URL}'
};
console.log('✅ Runtime config carregado:', window.__RUNTIME_CONFIG__);
EOF

echo "✅ Arquivo de configuração do cliente gerado"

# Criar um wrapper para o servidor Node.js que define as variáveis de ambiente
cat > /tmp/server-wrapper.js << 'EOF'
// Wrapper para definir variáveis de ambiente antes de iniciar o servidor
const { spawn } = require('child_process');
const path = require('path');

// Definir variáveis de ambiente a partir das variáveis do sistema
if (process.env.NEXT_PUBLIC_API_URL) {
  console.log('🔧 Definindo NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
  // Definir a variável para o processo atual e subprocessos
  process.env.NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL;
}

// Iniciar o servidor Next.js
const serverPath = '/app/server.js';
console.log('🚀 Iniciando servidor Next.js...');

const server = spawn('node', [serverPath], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL
  }
});

server.on('error', (err) => {
  console.error('❌ Erro ao iniciar servidor:', err);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log('🛑 Servidor encerrado com código:', code);
  process.exit(code);
});

// Lidar com sinais de encerramento
process.on('SIGTERM', () => {
  console.log('📡 Recebido SIGTERM, encerrando servidor...');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('📡 Recebido SIGINT, encerrando servidor...');
  server.kill('SIGINT');
});
EOF

echo "✅ Wrapper do servidor criado"

# Exportar variáveis para o processo atual
export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL}"

echo "🔍 Variável exportada: NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}"
echo "🚀 Iniciando wrapper do servidor..."

# Executar o wrapper em vez do servidor diretamente
exec node /tmp/server-wrapper.js