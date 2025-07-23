# 🔧 Correção: Variáveis de Ambiente EasyPanel

## ❌ Problemas Identificados
1. **Variáveis de ambiente** não eram aplicadas corretamente na aplicação Next.js
2. **Erro de permissão** ao tentar criar arquivo `.env.local` no container
3. **Build args** não eram passados durante o build da imagem

## ✅ Solução Implementada

### 1. **Dockerfile Atualizado**
- Adicionados `ARG` para variáveis de build
- Variáveis `NEXT_PUBLIC_*` agora são aplicadas durante o build
- Suporte a build args para configuração flexível

### 2. **Script Entrypoint Corrigido**
- **CORREÇÃO**: Removido criação de arquivo `.env.local` (problema de permissão)
- Usa `export` direto para definir variáveis de ambiente
- Aplica variáveis de ambiente do EasyPanel automaticamente
- Logs detalhados para debug e verificação

### 3. **Build Script Atualizado**
- Suporte a build args no script `build-and-push.sh`
- Otimizações específicas para EasyPanel

## 🚀 Como Usar no EasyPanel

### Opção 1: Variáveis de Runtime (Recomendado)
1. No EasyPanel, configure as variáveis de ambiente:
   ```
   NEXT_PUBLIC_API_URL=https://sua-api.easypanel.host/api
   NODE_ENV=production
   PORT=3000
   HOSTNAME=0.0.0.0
   NEXT_TELEMETRY_DISABLED=1
   ```

2. Use a imagem: `brunobspaiva/neosale-crm:latest`

3. O script `entrypoint.sh` criará automaticamente o arquivo `.env.local` com suas variáveis

### Opção 2: Build com Variáveis Específicas
1. Faça build da imagem com suas variáveis:
   ```bash
   docker build \
     --build-arg NEXT_PUBLIC_API_URL=https://sua-api.easypanel.host/api \
     --build-arg NODE_ENV=production \
     -t sua-imagem:latest .
   ```

2. Use sua imagem customizada no EasyPanel

## 🔍 Verificação

Após o deploy, verifique os logs do container:
```bash
docker logs <container-id>
```

Você deve ver:
```
Iniciando aplicação NeoSale CRM...
Configurando variáveis de ambiente dinâmicas...
Arquivo .env.local criado com as seguintes variáveis:
NEXT_PUBLIC_API_URL=https://sua-api.easypanel.host/api
✓ NEXT_PUBLIC_API_URL configurada: https://sua-api.easypanel.host/api
Iniciando servidor Next.js...
```

## 🐛 Troubleshooting

### ❌ Erro: "Permission denied" ao criar .env.local
**Solução**: Atualizado para usar `export` direto (versão corrigida)
```bash
# ANTES (com erro)
cat > .env.local << EOF

# DEPOIS (corrigido)
export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-default}"
```

### Problema: Variáveis ainda não funcionam
1. Verifique se as variáveis estão definidas no EasyPanel
2. Confirme que a imagem está atualizada
3. Verifique os logs do container
4. Use o script de teste:
   ```bash
   chmod +x test-env.sh && ./test-env.sh
   ```
5. Teste localmente com Docker:
   ```bash
   docker run -e NEXT_PUBLIC_API_URL=https://test.com/api -p 3000:3000 brunobspaiva/neosale-crm:latest
   ```

### Problema: Build falha
1. Certifique-se de que as build args estão corretas
2. Verifique se não há caracteres especiais nas variáveis
3. Use aspas duplas para valores com espaços

## 📝 Arquivos Modificados
- `Dockerfile` - Adicionados ARG e ENV para build
- `entrypoint.sh` - Script para criar .env.local dinâmico
- `build-and-push.sh` - Suporte a build args
- `EASYPANEL-DEPLOY.md` - Documentação atualizada

## ✨ Benefícios
1. **Flexibilidade**: Variáveis podem ser alteradas sem rebuild
2. **Compatibilidade**: Funciona com EasyPanel e outros providers
3. **Debug**: Logs claros para identificar problemas
4. **Fallback**: Valores padrão caso variáveis não sejam definidas