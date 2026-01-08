#!/usr/bin/env node

/**
 * Script para remover páginas antigas de autenticação
 * Execute: node remove-old-auth-pages.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n🗑️  Removendo páginas antigas de autenticação...\n');

const foldersToRemove = [
  'src/app/login',
  'src/app/signup',
  'src/app/reset-password'
];

let removed = 0;
let errors = 0;

foldersToRemove.forEach(folder => {
  const fullPath = path.join(__dirname, folder);
  
  try {
    if (fs.existsSync(fullPath)) {
      // Remover recursivamente
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`✅ Removido: ${folder}`);
      removed++;
    } else {
      console.log(`⚠️  Não encontrado: ${folder}`);
    }
  } catch (error) {
    console.error(`❌ Erro ao remover ${folder}:`, error.message);
    errors++;
  }
});

console.log('\n' + '─'.repeat(50));
console.log(`\n📊 Resumo:`);
console.log(`   ✅ Removidos: ${removed}`);
console.log(`   ❌ Erros: ${errors}`);
console.log(`\n✨ As novas páginas em (auth)/ estão ativas!`);
console.log(`   - /login → src/app/(auth)/login/page.tsx`);
console.log(`   - /signup → src/app/(auth)/signup/page.tsx`);
console.log(`   - /reset-password → src/app/(auth)/reset-password/page.tsx`);
console.log('\n🚀 Reinicie o servidor: npm run dev\n');
