#!/usr/bin/env node

/**
 * Script para criar arquivo .env.local
 * Execute: node create-env.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🔧 Configuração do Supabase - NeoCRM\n');
console.log('Este script irá criar o arquivo .env.local com suas credenciais.\n');
console.log('📋 Você precisará das seguintes informações do Supabase:');
console.log('   1. Project URL (https://xxxxx.supabase.co)');
console.log('   2. Anon/Public Key (começa com eyJ...)');
console.log('   3. Service Role Key (começa com eyJ...)\n');
console.log('💡 Encontre em: https://supabase.com/dashboard/project/_/settings/api\n');

const questions = [
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    question: '1️⃣  Digite a URL do projeto Supabase: ',
    default: 'https://seu-projeto.supabase.co'
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    question: '2️⃣  Digite a Anon/Public Key: ',
    default: 'sua-anon-key-aqui'
  },
  {
    key: 'SUPABASE_SERVICE_ROLE_KEY',
    question: '3️⃣  Digite a Service Role Key: ',
    default: 'sua-service-role-key-aqui'
  }
];

const answers = {};

function askQuestion(index) {
  if (index >= questions.length) {
    createEnvFile();
    return;
  }

  const q = questions[index];
  rl.question(q.question, (answer) => {
    answers[q.key] = answer.trim() || q.default;
    askQuestion(index + 1);
  });
}

function createEnvFile() {
  const envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${answers.NEXT_PUBLIC_SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${answers.NEXT_PUBLIC_SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${answers.SUPABASE_SERVICE_ROLE_KEY}

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
`;

  const envPath = path.join(__dirname, '.env.local');

  try {
    // Verificar se já existe
    if (fs.existsSync(envPath)) {
      rl.question('\n⚠️  Arquivo .env.local já existe. Sobrescrever? (s/N): ', (answer) => {
        if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'sim') {
          writeFile(envPath, envContent);
        } else {
          console.log('\n❌ Operação cancelada. Arquivo não foi modificado.');
          rl.close();
        }
      });
    } else {
      writeFile(envPath, envContent);
    }
  } catch (error) {
    console.error('\n❌ Erro ao criar arquivo:', error.message);
    rl.close();
  }
}

function writeFile(envPath, content) {
  fs.writeFileSync(envPath, content, 'utf8');
  console.log('\n✅ Arquivo .env.local criado com sucesso!');
  console.log('\n📋 Conteúdo:');
  console.log('─'.repeat(50));
  console.log(content);
  console.log('─'.repeat(50));
  console.log('\n🚀 Próximos passos:');
  console.log('   1. Verifique se as credenciais estão corretas');
  console.log('   2. Reinicie o servidor: npm run dev');
  console.log('   3. Execute as migrations no Supabase Dashboard');
  console.log('   4. Crie o usuário super admin');
  console.log('\n📚 Veja CONFIGURE_ENV.md para mais detalhes.\n');
  rl.close();
}

// Iniciar perguntas
askQuestion(0);
