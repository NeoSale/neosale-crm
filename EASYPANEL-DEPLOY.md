# Deploy no EasyPanel - NeoSale CRM

Este guia explica como fazer o deploy da aplicação NeoSale CRM no EasyPanel usando Docker.

## 🐳 Configuração do Docker

O projeto está configurado para funcionar com variáveis de ambiente dinâmicas no EasyPanel.

### Arquivos Importantes

- `Dockerfile` - Configuração otimizada para EasyPanel
- `entrypoint.sh` - Script de inicialização que lê variáveis de ambiente
- `next.config.ts` - Configuração do Next.js com output standalone

## 🔧 Variáveis de Ambiente no EasyPanel

Configure as seguintes variáveis de ambiente no painel do EasyPanel:

### Obrigatórias

```bash
# URL da API (substitua pela sua URL da API)
NEXT_PUBLIC_API_URL=https://sua-api.easypanel.host/api

# Ambiente de execução
NODE_ENV=production

# Porta da aplicação (geralmente 3000)
PORT=3000
```

### Opcionais

```bash
# Desabilitar telemetria do Next.js
NEXT_TELEMETRY_DISABLED=1

# Hostname (padrão: 0.0.0.0)
HOSTNAME=0.0.0.0
```

## 📋 Passos para Deploy

### 1. Preparar a Imagem Docker

```bash
# Build da imagem
docker build -t neosale-crm .

# Ou usar o script de build
./build-and-push.sh
```

## 🔧 Configuração no EasyPanel

### 1. Criar Nova Aplicação
1. Acesse seu painel do EasyPanel
2. Clique em "Create" > "App"
3. Escolha "Docker Image"
4. Configure:
   - **Name**: `neosale-crm`
   - **Image**: `brunobspaiva/neosale-crm:latest`
   - **Port**: `3000`

### 1.1. Build Args (Opcional)
Se você quiser fazer build da imagem com variáveis específicas:
```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://sua-api.easypanel.host/api \
  --build-arg NODE_ENV=production \
  -t brunobspaiva/neosale-crm:latest .
```

### 2. Configurar no EasyPanel

1. **Criar novo serviço**:
   - Tipo: Docker
   - Nome: `neosale-crm`

2. **Configurar a imagem**:
   - Registry: Docker Hub ou seu registry privado
   - Imagem: `seu-usuario/neosale-crm:latest`

3. **Configurar variáveis de ambiente**:
   ```
   NEXT_PUBLIC_API_URL=https://evolution-api-neosale-api.mrzt3w.easypanel.host/api
   NODE_ENV=production
   PORT=3000
   NEXT_TELEMETRY_DISABLED=1
   ```

4. **Configurar rede**:
   - Porta interna: 3000
   - Porta externa: 80 ou 443 (HTTPS)
   - Domínio: seu-dominio.easypanel.host

5. **Deploy**:
   - Clique em "Deploy" para iniciar o serviço

### 3. Verificar o Deploy

Após o deploy, verifique:

1. **Logs do container**:
   ```
   Iniciando aplicação NeoSale CRM...
   Usando NEXT_PUBLIC_API_URL: https://sua-api.easypanel.host/api
   Usando NODE_ENV: production
   Usando PORT: 3000
   ```

2. **Acesso à aplicação**:
   - Abra o domínio configurado
   - Verifique se a aplicação carrega corretamente
   - Teste a conexão com a API

## 🔍 Troubleshooting

### Problema: Variáveis de ambiente não são aplicadas

**Solução**: Verifique se:
- As variáveis estão configuradas corretamente no EasyPanel
- O container foi reiniciado após a alteração das variáveis
- O script `entrypoint.sh` tem permissões de execução

### Problema: Aplicação não conecta com a API

**Solução**: Verifique se:
- `NEXT_PUBLIC_API_URL` está configurada corretamente
- A API está acessível publicamente
- Não há problemas de CORS

### Problema: Erro de build

**Solução**: Verifique se:
- Todas as dependências estão no `package.json`
- O `next.config.ts` está configurado com `output: 'standalone'`
- Não há erros de TypeScript ou ESLint críticos

## 📝 Logs e Monitoramento

Para monitorar a aplicação:

1. **Logs do EasyPanel**:
   - Acesse o painel do serviço
   - Vá para a aba "Logs"
   - Monitore erros e avisos

2. **Métricas**:
   - CPU e memória
   - Requisições por minuto
   - Tempo de resposta

## 🔄 Atualizações

Para atualizar a aplicação:

1. Faça o build de uma nova imagem
2. Faça push para o registry
3. No EasyPanel, vá para o serviço
4. Clique em "Redeploy" ou "Update"
5. Aguarde o deploy completar

## 🛡️ Segurança

- Nunca exponha variáveis sensíveis nos logs
- Use HTTPS sempre que possível
- Configure adequadamente as variáveis de ambiente
- Mantenha as dependências atualizadas

## 📞 Suporte

Em caso de problemas:

1. Verifique os logs do container
2. Confirme as configurações de rede
3. Teste a conectividade com a API
4. Consulte a documentação do EasyPanel

---

**Nota**: Este guia assume que você já tem uma conta no EasyPanel e conhecimentos básicos de Docker.