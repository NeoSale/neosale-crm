# 🐳 Docker Auto-Start - NeoSale CRM

Este script automatiza a verificação e inicialização do Docker para o NeoSale CRM.

## 📋 Funcionalidades

- ✅ Verifica se o Docker está rodando
- 🚀 Inicia o Docker automaticamente se não estiver rodando
- 🔄 Aguarda o Docker ficar disponível
- 🖥️ Compatível com Windows, macOS e Linux
- 📝 Logs coloridos para melhor experiência

## 🚀 Como Usar

### Verificar/Iniciar Docker
```bash
# Verificar e iniciar Docker se necessário
npm run docker:check

# Ou diretamente
node scripts/start-docker.js
```

### Scripts Integrados
```bash
# Build com verificação automática do Docker
npm run docker:build

# Executar container com verificação automática
npm run docker:run

# Docker Compose com verificação automática
npm run docker:compose

# Deploy completo com verificação automática
npm run deploy
```

## 🔧 Como Funciona

### 1. Verificação
O script executa `docker info` para verificar se o Docker está disponível.

### 2. Inicialização Automática
Se o Docker não estiver rodando, o script tenta iniciá-lo baseado no sistema operacional:

#### Windows
```powershell
Start-Process "Docker Desktop" -WindowStyle Hidden
```

#### macOS
```bash
open -a Docker
```

#### Linux
```bash
sudo systemctl start docker
```

### 3. Aguardar Disponibilidade
O script aguarda até 60 segundos (12 tentativas de 5 segundos) para o Docker ficar disponível.

## 📊 Status e Logs

O script fornece feedback visual com cores:
- 🔴 **Vermelho**: Erros
- 🟡 **Amarelo**: Processamento/Avisos
- 🔵 **Azul**: Informações
- 🟢 **Verde**: Sucesso

### Exemplo de Output
```
🚀 NeoSale CRM - Verificador de Docker
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 Verificando status do Docker...
❌ Docker não está rodando
🐳 Tentando iniciar o Docker...
🔄 Comando de inicialização enviado...
⏳ Aguardando Docker ficar disponível...
🔍 Verificando Docker... (tentativa 1/12)
🔍 Verificando Docker... (tentativa 2/12)
✅ Docker iniciado com sucesso!
```

## 🚨 Troubleshooting

### Docker Desktop não encontrado (Windows)
- Certifique-se de que o Docker Desktop está instalado
- Verifique se está no PATH do sistema
- Execute manualmente: `Start-Process "Docker Desktop"`

### Permissões insuficientes (Linux)
- O script tenta usar `sudo` para iniciar o serviço
- Certifique-se de ter permissões sudo
- Ou execute manualmente: `sudo systemctl start docker`

### Docker não inicia
- Verifique se há recursos suficientes (RAM, CPU)
- Reinicie o sistema se necessário
- Verifique logs do Docker Desktop

### Timeout
- O script aguarda 60 segundos por padrão
- Se o Docker demorar mais, execute novamente
- Ou inicie manualmente e execute o comando desejado

## 🔧 Configuração Avançada

### Modificar Timeout
Edite o arquivo `scripts/start-docker.js`:
```javascript
// Alterar de 12 tentativas para 20 (100 segundos)
await waitForDocker(20, 5000);
```

### Usar como Módulo
```javascript
const { checkDockerStatus, startDocker, waitForDocker } = require('./scripts/start-docker.js');

// Verificar status
const isRunning = await checkDockerStatus();

// Iniciar Docker
if (!isRunning) {
  await startDocker();
  await waitForDocker();
}
```

## 📝 Integração com CI/CD

O script pode ser usado em pipelines de CI/CD:

```yaml
# GitHub Actions
- name: Start Docker
  run: node scripts/start-docker.js

- name: Build Docker Image
  run: npm run docker:build
```

## 🎯 Benefícios

- ✅ **Automação**: Não precisa lembrar de iniciar o Docker
- 🚀 **Produtividade**: Scripts funcionam independente do estado do Docker
- 🔄 **Confiabilidade**: Verificação robusta com retry automático
- 🖥️ **Compatibilidade**: Funciona em diferentes sistemas operacionais
- 📝 **Feedback**: Logs claros sobre o que está acontecendo

---

**Desenvolvido para o NeoSale CRM** 🚀