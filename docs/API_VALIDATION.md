# Validação da API - Guia de Implementação

## Visão Geral

Este documento descreve a implementação de validação adequada da variável de ambiente `NEXT_PUBLIC_API_URL` para evitar chamadas incorretas para o próprio frontend.

## Problema Identificado

Anteriormente, quando a variável `NEXT_PUBLIC_API_URL` não estava configurada ou estava vazia, as requisições eram feitas para URLs relativas, resultando em chamadas para o próprio frontend Next.js em vez da API externa.

## Solução Implementada

### 1. Utilitário de Validação (`src/utils/api-config.ts`)

Criamos um utilitário centralizado que:
- Valida se `NEXT_PUBLIC_API_URL` está definida
- Verifica se não é uma string vazia
- Valida se é uma URL válida
- Emite avisos para configurações localhost
- Fornece funções auxiliares para verificação

### 2. Atualização dos Serviços

Todos os serviços foram atualizados para usar a validação:
- `src/services/configuracoesApi.ts`
- `src/services/mensagensApi.ts`
- `src/services/leadsApi.ts`

### 3. Atualização das Rotas de API

Todas as rotas de API foram atualizadas:
- `src/app/api/configuracoes/route.ts`
- `src/app/api/configuracoes/[id]/route.ts`
- `src/app/api/configuracoes/chave/[chave]/route.ts`
- `src/app/api/controle-envios/limite-diario/route.ts`

### 4. Componente de Verificação

Criamos `ApiConfigChecker` que:
- Verifica a configuração no startup
- Exibe avisos visuais se necessário
- Registra logs de configuração

## Como Usar

### Em Novos Serviços

```typescript
import { getValidatedApiUrl } from '../utils/api-config';

// Validar e obter URL da API de forma segura
let API_BASE_URL: string;
try {
  API_BASE_URL = getValidatedApiUrl();
} catch (error) {
  console.error('Erro na configuração da API:', error);
  API_BASE_URL = '';
}

// No método de requisição
if (!API_BASE_URL) {
  const errorMessage = 'API não configurada. Verifique a variável NEXT_PUBLIC_API_URL.';
  console.error(errorMessage);
  throw new Error(errorMessage);
}
```

### Em Novas Rotas de API

```typescript
import { getValidatedApiUrl } from '../../../utils/api-config';

// Validar e obter URL da API de forma segura
let API_BASE_URL: string;
try {
  API_BASE_URL = getValidatedApiUrl();
} catch (error) {
  console.error('Erro na configuração da API:', error);
  API_BASE_URL = '';
}

export async function GET() {
  try {
    // Validar se a API está configurada
    if (!API_BASE_URL) {
      return NextResponse.json(
        {
          success: false,
          message: 'API não configurada. Verifique a variável NEXT_PUBLIC_API_URL.',
          error: 'Configuração inválida'
        },
        { status: 500 }
      );
    }

    const fullUrl = `${API_BASE_URL}/api/endpoint`;
    console.log(`🌐 API Route fazendo requisição para: ${fullUrl}`);
    
    const response = await fetch(fullUrl, {
      // ... configurações
    });
  }
}
```

## Funções Utilitárias Disponíveis

### `getValidatedApiUrl()`
Retorna a URL validada ou lança erro se inválida.

### `getApiUrlWithFallback(fallbackUrl?)`
Retorna a URL validada ou uma URL de fallback.

### `isApiConfigured()`
Retorna `true` se a API está configurada corretamente.

### `logApiConfig()`
Registra informações sobre a configuração da API.

### `API_FALLBACKS`
Constantes com URLs de fallback comuns para diferentes ambientes.

## Configuração de Ambiente

### Desenvolvimento
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### Produção
```env
NEXT_PUBLIC_API_URL=https://api.exemplo.com/api
```

### Staging
```env
NEXT_PUBLIC_API_URL=https://api-staging.exemplo.com/api
```

## Logs e Debugging

A implementação inclui logs detalhados:
- ✅ Configuração válida
- ❌ Erros de configuração
- ⚠️ Avisos para localhost
- 🌐 URLs de requisição

## Benefícios

1. **Prevenção de Erros**: Evita chamadas incorretas para o frontend
2. **Debugging Melhorado**: Logs claros sobre configuração e requisições
3. **Validação Centralizada**: Um local para toda lógica de validação
4. **Feedback Visual**: Avisos na interface quando mal configurado
5. **Desenvolvimento Mais Seguro**: Falha rápida com mensagens claras

## Manutenção

- Sempre use as funções do `api-config.ts` em novos serviços
- Mantenha os logs de debugging para facilitar troubleshooting
- Atualize a documentação quando adicionar novas funcionalidades
- Teste a configuração em todos os ambientes