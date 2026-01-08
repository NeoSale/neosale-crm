#!/usr/bin/env node

/**
 * Script para verificar e iniciar o Docker automaticamente
 * Compatível com Windows, macOS e Linux
 */

const { exec, spawn } = require('child_process');
const os = require('os');
const path = require('path');

// Cores para output no terminal
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Função para verificar se o Docker está rodando
function checkDockerStatus() {
  return new Promise((resolve) => {
    exec('docker info', { timeout: 5000 }, (error, stdout, stderr) => {
      if (error) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

// Função para iniciar o Docker baseado no sistema operacional
function startDocker() {
  return new Promise((resolve, reject) => {
    const platform = os.platform();
    let command;
    let args = [];
    
    log('🐳 Tentando iniciar o Docker...', 'yellow');
    
    switch (platform) {
      case 'win32':
        // Windows - tentar iniciar Docker Desktop
        command = 'powershell';
        args = [
          '-Command',
          'Start-Process "Docker Desktop" -WindowStyle Hidden; Start-Sleep 10'
        ];
        break;
        
      case 'darwin':
        // macOS - iniciar Docker Desktop
        command = 'open';
        args = ['-a', 'Docker'];
        break;
        
      case 'linux':
        // Linux - tentar iniciar o serviço Docker
        command = 'sudo';
        args = ['systemctl', 'start', 'docker'];
        break;
        
      default:
        reject(new Error(`Sistema operacional não suportado: ${platform}`));
        return;
    }
    
    const dockerProcess = spawn(command, args, { 
      stdio: 'pipe',
      shell: true 
    });
    
    let timeout = setTimeout(() => {
      dockerProcess.kill();
      reject(new Error('Timeout ao tentar iniciar o Docker'));
    }, 30000); // 30 segundos de timeout
    
    dockerProcess.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0 || platform === 'win32') {
        // No Windows, mesmo com sucesso pode retornar código diferente de 0
        resolve();
      } else {
        reject(new Error(`Falha ao iniciar Docker. Código de saída: ${code}`));
      }
    });
    
    dockerProcess.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

// Função para aguardar o Docker ficar disponível
function waitForDocker(maxAttempts = 12, interval = 5000) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const checkInterval = setInterval(async () => {
      attempts++;
      log(`🔍 Verificando Docker... (tentativa ${attempts}/${maxAttempts})`, 'blue');
      
      const isRunning = await checkDockerStatus();
      
      if (isRunning) {
        clearInterval(checkInterval);
        resolve();
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        reject(new Error('Docker não ficou disponível após múltiplas tentativas'));
      }
    }, interval);
  });
}

// Função principal
async function main() {
  try {
    log('🚀 NeoCRM - Verificador de Docker', 'blue');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
    
    // Verificar se o Docker já está rodando
    log('🔍 Verificando status do Docker...', 'yellow');
    const isDockerRunning = await checkDockerStatus();
    
    if (isDockerRunning) {
      log('✅ Docker já está rodando!', 'green');
      return;
    }
    
    log('❌ Docker não está rodando', 'red');
    
    // Tentar iniciar o Docker
    try {
      await startDocker();
      log('🔄 Comando de inicialização enviado...', 'yellow');
      
      // Aguardar o Docker ficar disponível
      log('⏳ Aguardando Docker ficar disponível...', 'yellow');
      await waitForDocker();
      
      log('✅ Docker iniciado com sucesso!', 'green');
      
    } catch (startError) {
      log('❌ Falha ao iniciar Docker automaticamente', 'red');
      log('💡 Instruções manuais:', 'yellow');
      
      const platform = os.platform();
      switch (platform) {
        case 'win32':
          log('   - Abra o Docker Desktop manualmente', 'yellow');
          log('   - Ou execute: Start-Process "Docker Desktop"', 'yellow');
          break;
        case 'darwin':
          log('   - Abra o Docker Desktop manualmente', 'yellow');
          log('   - Ou execute: open -a Docker', 'yellow');
          break;
        case 'linux':
          log('   - Execute: sudo systemctl start docker', 'yellow');
          log('   - Ou: sudo service docker start', 'yellow');
          break;
      }
      
      throw startError;
    }
    
  } catch (error) {
    log(`❌ Erro: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = {
  checkDockerStatus,
  startDocker,
  waitForDocker
};