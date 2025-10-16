# 📚 Documentação de APIs de Autenticação - NeoSale CRM

**Versão:** 1.0.0  
**Base URL:** `http://localhost:3000/api`  
**Ambiente de Produção:** `https://api.neosale.com/api`

---

## 📋 Índice

1. [Arquitetura e Tecnologias](#arquitetura-e-tecnologias)
2. [Fluxo de Autenticação](#fluxo-de-autenticação)
3. [Perfis](#perfis)
4. [Convites](#convites)
5. [Sessões](#sessões)
6. [Autenticação (A implementar)](#autenticação)

---

## 🏗️ Arquitetura e Tecnologias

### Stack Tecnológico

#### Backend
- **Node.js** (v18+) - Runtime JavaScript
- **TypeScript** - Tipagem estática
- **Express.js** - Framework web
- **Supabase** - Banco de dados PostgreSQL + Auth
- **JWT (JSON Web Tokens)** - Autenticação stateless
- **bcryptjs** - Hash de senhas
- **crypto** (nativo) - Geração de tokens UUID
- **Zod** - Validação de schemas
- **Swagger/OpenAPI** - Documentação automática

#### Banco de Dados (PostgreSQL via Supabase)
- **Tabelas principais:**
  - `usuarios` - Dados dos usuários
  - `perfis` - Perfis de acesso (RBAC)
  - `usuario_perfis` - Relacionamento N:N entre usuários e perfis
  - `convites` - Sistema de convites
  - `sessoes` - Gestão de sessões JWT
  - `logs_autenticacao` - Auditoria de acessos
  - `provedores` - Provedores OAuth (Google, Apple, Microsoft)
  - `tipos_acesso` - Tipos de acesso ao sistema

#### Segurança
- **Helmet.js** - Headers de segurança HTTP
- **CORS** - Controle de origem cruzada
- **Rate Limiting** - Proteção contra força bruta (a implementar)
- **JWT com Refresh Tokens** - Autenticação segura
- **Bcrypt** - Hash de senhas com salt

#### Ferramentas de Desenvolvimento
- **nodemon** - Hot reload em desenvolvimento
- **ts-node** - Execução TypeScript
- **morgan** - Logging de requisições HTTP
- **dotenv** - Gerenciamento de variáveis de ambiente

---

## 🔄 Fluxo de Autenticação

### 1️⃣ Fluxo de Registro via Convite

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DE REGISTRO VIA CONVITE                │
└─────────────────────────────────────────────────────────────────┘

[Admin/Gerente]
    │
    ├─► POST /convites
    │   └─► Cria convite com:
    │       • Email do convidado
    │       • Perfil (Gerente, Vendedor, etc.)
    │       • Cliente associado
    │       • Mensagem personalizada
    │       • Prazo de expiração (7 dias padrão)
    │
    ├─► Sistema gera:
    │   • Token UUID único
    │   • Link: http://frontend.com/convite/{token}
    │   • Salva no banco (status: pendente)
    │
    ├─► Envio (a implementar):
    │   • Email com link do convite
    │   • WhatsApp com link (opcional)
    │
    └─► Convite enviado ✅

[Usuário Convidado]
    │
    ├─► Recebe email/WhatsApp com link
    │
    ├─► Acessa link do convite
    │   └─► GET /convites/token/{token}
    │       • Valida se token existe
    │       • Verifica se não expirou
    │       • Retorna dados do convite
    │
    ├─► Frontend exibe formulário de registro:
    │   • Nome (pré-preenchido se houver)
    │   • Email (pré-preenchido e readonly)
    │   • Senha
    │   • Confirmar senha
    │   • Telefone (pré-preenchido se houver)
    │
    ├─► POST /auth/register
    │   └─► Backend:
    │       • Valida dados
    │       • Hash da senha (bcrypt)
    │       • Cria usuário no banco
    │       • Associa perfil ao usuário
    │       • Marca convite como "aceito"
    │       • Cria sessão JWT
    │       • Retorna token + dados do usuário
    │
    └─► Usuário logado automaticamente ✅
```

---

### 2️⃣ Fluxo de Login Email/Senha

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DE LOGIN EMAIL/SENHA                   │
└─────────────────────────────────────────────────────────────────┘

[Usuário]
    │
    ├─► Acessa tela de login
    │
    ├─► Preenche:
    │   • Email
    │   • Senha
    │
    ├─► POST /auth/login
    │   └─► Backend:
    │       • Busca usuário por email
    │       • Compara senha com hash (bcrypt.compare)
    │       • Verifica se usuário está ativo
    │       • Busca perfis do usuário
    │       • Gera JWT token (expira em 1h)
    │       • Gera Refresh token (expira em 7 dias)
    │       • Cria registro na tabela sessoes
    │       • Registra log de autenticação
    │       • Captura: IP, User-Agent, Dispositivo
    │
    ├─► Retorna:
    │   • Token JWT
    │   • Refresh token
    │   • Dados do usuário
    │   • Perfis e permissões
    │
    ├─► Frontend armazena:
    │   • Token no localStorage/sessionStorage
    │   • Refresh token (httpOnly cookie - recomendado)
    │
    └─► Usuário logado ✅
```

---

### 3️⃣ Fluxo de Login OAuth (Google/Apple/Microsoft)

```
┌─────────────────────────────────────────────────────────────────┐
│                      FLUXO DE LOGIN OAUTH                       │
└─────────────────────────────────────────────────────────────────┘

[Usuário]
    │
    ├─► Clica em "Entrar com Google"
    │
    ├─► Redirecionado para Google OAuth
    │   └─► Autoriza acesso
    │
    ├─► Google retorna token OAuth
    │
    ├─► POST /auth/google
    │   └─► Backend:
    │       • Valida token com Google API
    │       • Extrai dados: email, nome, foto
    │       • Verifica se usuário já existe (por email)
    │       │
    │       ├─► Se existe:
    │       │   • Atualiza dados (se necessário)
    │       │   • Gera JWT + Refresh token
    │       │   • Cria sessão
    │       │
    │       └─► Se não existe:
    │           • Verifica se tem convite pendente
    │           • Cria novo usuário
    │           • Associa provedor OAuth
    │           • Gera JWT + Refresh token
    │           • Cria sessão
    │
    └─► Usuário logado ✅
```

---

### 4️⃣ Fluxo de Refresh Token

```
┌─────────────────────────────────────────────────────────────────┐
│                     FLUXO DE REFRESH TOKEN                      │
└─────────────────────────────────────────────────────────────────┘

[Frontend detecta token expirado]
    │
    ├─► POST /auth/refresh
    │   └─► Envia refresh_token
    │
    ├─► Backend:
    │   • Busca sessão pelo refresh_token
    │   • Verifica se sessão está ativa
    │   • Verifica se refresh_token não expirou
    │   • Gera novo JWT token
    │   • Atualiza sessão no banco
    │   • Atualiza ultimo_acesso
    │
    ├─► Retorna:
    │   • Novo JWT token
    │   • Nova data de expiração
    │
    └─► Frontend atualiza token armazenado ✅
```

---

### 5️⃣ Fluxo de Verificação de Permissões

```
┌─────────────────────────────────────────────────────────────────┐
│                 FLUXO DE VERIFICAÇÃO DE PERMISSÕES              │
└─────────────────────────────────────────────────────────────────┘

[Usuário tenta acessar recurso]
    │
    ├─► Frontend verifica permissões localmente
    │   └─► Dados do perfil armazenados no login
    │
    ├─► Se permitido: exibe recurso
    │
    ├─► Se negado: oculta botão/menu
    │
    └─► Backend SEMPRE valida:
        │
        ├─► Middleware de autenticação:
        │   • Valida JWT token
        │   • Extrai usuario_id
        │   • Busca sessão ativa
        │
        ├─► Middleware de permissão:
        │   • Busca perfis do usuário
        │   • Verifica permissão específica
        │   • Função SQL: verificar_permissao_usuario()
        │
        └─► Se autorizado: processa requisição
            Se negado: retorna 403 Forbidden
```

---

### 6️⃣ Fluxo de Logout

```
┌─────────────────────────────────────────────────────────────────┐
│                         FLUXO DE LOGOUT                         │
└─────────────────────────────────────────────────────────────────┘

[Usuário]
    │
    ├─► Clica em "Sair"
    │
    ├─► POST /auth/logout
    │   └─► Backend:
    │       • Valida token JWT
    │       • Marca sessão como inativa
    │       • Registra log de logout
    │
    ├─► Frontend:
    │   • Remove token do storage
    │   • Remove refresh token
    │   • Limpa dados do usuário
    │   • Redireciona para login
    │
    └─► Usuário deslogado ✅
```

---

### 7️⃣ Fluxo de Reset de Senha

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DE RESET DE SENHA                      │
└─────────────────────────────────────────────────────────────────┘

[Usuário esqueceu senha]
    │
    ├─► POST /auth/forgot-password
    │   └─► Envia email
    │
    ├─► Backend:
    │   • Busca usuário por email
    │   • Gera token de reset (UUID)
    │   • Salva token no banco (expira em 1h)
    │   • Envia email com link
    │
    ├─► Usuário clica no link do email
    │   └─► http://frontend.com/reset-password/{token}
    │
    ├─► Frontend exibe formulário:
    │   • Nova senha
    │   • Confirmar senha
    │
    ├─► POST /auth/reset-password
    │   └─► Backend:
    │       • Valida token
    │       • Verifica se não expirou
    │       • Hash da nova senha
    │       • Atualiza senha no banco
    │       • Invalida token
    │       • Encerra todas as sessões do usuário
    │
    └─► Senha alterada ✅
        └─► Usuário deve fazer login novamente
```

---

### 🔒 Sistema de Permissões (RBAC)

#### Estrutura de Perfis Padrão

```json
{
  "Administrador": {
    "admin": true,  // Acesso total
    "usuarios": { "criar": true, "editar": true, "deletar": true, "visualizar": true, "convidar": true },
    "clientes": { "criar": true, "editar": true, "deletar": true, "visualizar": true },
    "leads": { "criar": true, "editar": true, "deletar": true, "visualizar": true, "atribuir": true },
    "relatorios": { "visualizar": true, "exportar": true },
    "configuracoes": { "editar": true },
    "perfis": { "criar": true, "editar": true, "deletar": true, "visualizar": true }
  },
  
  "Gerente": {
    "usuarios": { "criar": true, "editar": true, "deletar": false, "visualizar": true, "convidar": true },
    "clientes": { "criar": true, "editar": true, "deletar": false, "visualizar": true },
    "leads": { "criar": true, "editar": true, "deletar": true, "visualizar": true, "atribuir": true },
    "relatorios": { "visualizar": true, "exportar": true }
  },
  
  "Vendedor": {
    "clientes": { "criar": false, "editar": false, "deletar": false, "visualizar": true },
    "leads": { "criar": true, "editar": true, "deletar": false, "visualizar": true },
    "relatorios": { "visualizar": true, "exportar": false }
  },
  
  "Suporte": {
    "clientes": { "criar": false, "editar": true, "deletar": false, "visualizar": true },
    "leads": { "criar": false, "editar": true, "deletar": false, "visualizar": true }
  },
  
  "Visualizador": {
    "clientes": { "criar": false, "editar": false, "deletar": false, "visualizar": true },
    "leads": { "criar": false, "editar": false, "deletar": false, "visualizar": true },
    "relatorios": { "visualizar": true, "exportar": false }
  }
}
```

#### Como Verificar Permissões no Frontend

```typescript
// Exemplo de verificação de permissão
function temPermissao(usuario, recurso, acao) {
  return usuario.perfis.some(perfil => {
    // Admin tem todas as permissões
    if (perfil.permissoes.admin === true) return true;
    
    // Verifica permissão específica
    return perfil.permissoes[recurso]?.[acao] === true;
  });
}

// Uso
if (temPermissao(usuario, 'usuarios', 'criar')) {
  // Exibe botão "Criar Usuário"
}
```

---

### 📊 Diagrama de Banco de Dados

```
┌─────────────────┐
│    usuarios     │
├─────────────────┤
│ id (PK)         │
│ nome            │
│ email (unique)  │
│ senha_hash      │
│ telefone        │
│ ativo           │
│ email_verificado│
│ provedor_id (FK)│
└────────┬────────┘
         │
         │ N:N
         │
┌────────┴────────┐         ┌─────────────────┐
│ usuario_perfis  │────────►│     perfis      │
├─────────────────┤         ├─────────────────┤
│ id (PK)         │         │ id (PK)         │
│ usuario_id (FK) │         │ nome (unique)   │
│ perfil_id (FK)  │         │ descricao       │
│ cliente_id (FK) │         │ permissoes JSON │
│ ativo           │         │ ativo           │
└─────────────────┘         │ sistema         │
                            └─────────────────┘

┌─────────────────┐
│    convites     │
├─────────────────┤
│ id (PK)         │
│ email           │
│ token (unique)  │
│ perfil_id (FK)  │
│ convidado_por FK│
│ status          │
│ expira_em       │
│ aceito_em       │
└─────────────────┘

┌─────────────────┐
│    sessoes      │
├─────────────────┤
│ id (PK)         │
│ usuario_id (FK) │
│ token (unique)  │
│ refresh_token   │
│ ip_address      │
│ user_agent      │
│ expira_em       │
│ ativo           │
└─────────────────┘

┌─────────────────┐
│logs_autenticacao│
├─────────────────┤
│ id (PK)         │
│ usuario_id (FK) │
│ acao            │
│ sucesso         │
│ ip_address      │
│ created_at      │
└─────────────────┘
```

---

### 🛠️ Variáveis de Ambiente Necessárias

```env
# Servidor
NEXT_PUBLIC_PORT=3000
NEXT_PUBLIC_NODE_ENV=development
NEXT_PUBLIC_API_BASE_URL=http://localhost

# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-anonima

# JWT
JWT_SECRET=seu-secret-key-min-32-caracteres
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Frontend
FRONTEND_URL=http://localhost:3001

# Convites
CONVITE_EXPIRACAO_DIAS=7

# Email (a configurar)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app

# OAuth (a configurar)
GOOGLE_CLIENT_ID=seu-client-id
GOOGLE_CLIENT_SECRET=seu-client-secret
APPLE_CLIENT_ID=seu-client-id
APPLE_CLIENT_SECRET=seu-client-secret
MICROSOFT_CLIENT_ID=seu-client-id
MICROSOFT_CLIENT_SECRET=seu-client-secret
```

---

## 🔐 Perfis

### 1. Listar Todos os Perfis
**Endpoint:** `GET /perfis`

**Request:**
```json
// Sem body
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "nome": "Administrador",
      "descricao": "Acesso total ao sistema",
      "permissoes": {
        "admin": true,
        "usuarios": {
          "criar": true,
          "editar": true,
          "deletar": true,
          "visualizar": true,
          "convidar": true
        },
        "clientes": {
          "criar": true,
          "editar": true,
          "deletar": true,
          "visualizar": true
        }
      },
      "ativo": true,
      "sistema": true,
      "created_at": "2025-10-16T18:00:00.000Z",
      "updated_at": "2025-10-16T18:00:00.000Z"
    }
  ],
  "total": 5
}
```

---

### 2. Listar Perfis Ativos
**Endpoint:** `GET /perfis/ativos`

**Request:**
```json
// Sem body
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "nome": "Gerente",
      "descricao": "Gerenciamento de equipe e clientes",
      "permissoes": { /* ... */ },
      "ativo": true,
      "sistema": true,
      "created_at": "2025-10-16T18:00:00.000Z",
      "updated_at": "2025-10-16T18:00:00.000Z"
    }
  ],
  "total": 4
}
```

---

### 3. Buscar Perfil por ID
**Endpoint:** `GET /perfis/:id`

**Request:**
```json
// Sem body
// Parâmetro na URL: id (uuid)
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nome": "Vendedor",
    "descricao": "Acesso a vendas e leads",
    "permissoes": {
      "clientes": {
        "criar": false,
        "editar": false,
        "deletar": false,
        "visualizar": true
      },
      "leads": {
        "criar": true,
        "editar": true,
        "deletar": false,
        "visualizar": true
      }
    },
    "ativo": true,
    "sistema": true,
    "created_at": "2025-10-16T18:00:00.000Z",
    "updated_at": "2025-10-16T18:00:00.000Z"
  }
}
```

**Response 404:**
```json
{
  "success": false,
  "message": "Perfil não encontrado"
}
```

---

### 4. Criar Novo Perfil
**Endpoint:** `POST /perfis`

**Request:**
```json
{
  "nome": "Analista",
  "descricao": "Perfil para analistas de dados",
  "permissoes": {
    "relatorios": {
      "visualizar": true,
      "exportar": true
    },
    "leads": {
      "visualizar": true
    }
  },
  "ativo": true
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-gerado",
    "nome": "Analista",
    "descricao": "Perfil para analistas de dados",
    "permissoes": {
      "relatorios": {
        "visualizar": true,
        "exportar": true
      },
      "leads": {
        "visualizar": true
      }
    },
    "ativo": true,
    "sistema": false,
    "created_at": "2025-10-16T18:00:00.000Z",
    "updated_at": "2025-10-16T18:00:00.000Z"
  },
  "message": "Perfil criado com sucesso"
}
```

**Response 409:**
```json
{
  "success": false,
  "message": "Já existe um perfil com este nome"
}
```

---

### 5. Atualizar Perfil
**Endpoint:** `PUT /perfis/:id`

**Request:**
```json
{
  "descricao": "Nova descrição do perfil",
  "permissoes": {
    "relatorios": {
      "visualizar": true,
      "exportar": false
    }
  },
  "ativo": true
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nome": "Analista",
    "descricao": "Nova descrição do perfil",
    "permissoes": {
      "relatorios": {
        "visualizar": true,
        "exportar": false
      }
    },
    "ativo": true,
    "sistema": false,
    "created_at": "2025-10-16T18:00:00.000Z",
    "updated_at": "2025-10-16T18:30:00.000Z"
  },
  "message": "Perfil atualizado com sucesso"
}
```

---

### 6. Deletar Perfil
**Endpoint:** `DELETE /perfis/:id`

**Request:**
```json
// Sem body
// Parâmetro na URL: id (uuid)
```

**Response 200:**
```json
{
  "success": true,
  "message": "Perfil deletado com sucesso"
}
```

**Response 400:**
```json
{
  "success": false,
  "message": "Perfis do sistema não podem ser deletados. Desative-os em vez disso."
}
```

---

## 📧 Convites

### 1. Listar Todos os Convites
**Endpoint:** `GET /convites`

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
// Sem body
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "usuario@exemplo.com",
      "telefone": "+5511999999999",
      "nome": "João Silva",
      "token": "uuid-token",
      "perfil_id": "uuid",
      "cliente_id": "uuid",
      "revendedor_id": null,
      "convidado_por": "uuid",
      "status": "pendente",
      "expira_em": "2025-10-23T18:00:00.000Z",
      "aceito_em": null,
      "usuario_criado_id": null,
      "mensagem_personalizada": "Bem-vindo ao CRM!",
      "enviado_email": true,
      "enviado_whatsapp": false,
      "metadata": {},
      "created_at": "2025-10-16T18:00:00.000Z",
      "updated_at": "2025-10-16T18:00:00.000Z"
    }
  ],
  "total": 10
}
```

---

### 2. Buscar Convite por ID
**Endpoint:** `GET /convites/:id`

**Request:**
```json
// Sem body
// Parâmetro na URL: id (uuid)
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "usuario@exemplo.com",
    "telefone": "+5511999999999",
    "nome": "João Silva",
    "token": "uuid-token",
    "perfil_id": "uuid",
    "cliente_id": "uuid",
    "status": "pendente",
    "expira_em": "2025-10-23T18:00:00.000Z",
    "mensagem_personalizada": "Bem-vindo!",
    "created_at": "2025-10-16T18:00:00.000Z"
  }
}
```

---

### 3. Validar Token de Convite
**Endpoint:** `GET /convites/token/:token`

**Request:**
```json
// Sem body
// Parâmetro na URL: token (string)
```

**Response 200 (Token Válido):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "usuario@exemplo.com",
    "nome": "João Silva",
    "perfil_id": "uuid",
    "cliente_id": "uuid",
    "status": "pendente",
    "expira_em": "2025-10-23T18:00:00.000Z",
    "mensagem_personalizada": "Bem-vindo!"
  },
  "message": "Convite válido"
}
```

**Response 400 (Token Inválido):**
```json
{
  "success": false,
  "message": "Convite expirado",
  "data": {
    "id": "uuid",
    "status": "expirado"
  }
}
```

---

### 4. Criar Novo Convite
**Endpoint:** `POST /convites`

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "email": "novousuario@exemplo.com",
  "telefone": "+5511988888888",
  "nome": "Maria Santos",
  "perfil_id": "uuid-do-perfil",
  "cliente_id": "uuid-do-cliente",
  "revendedor_id": "uuid-do-revendedor",
  "mensagem_personalizada": "Olá Maria! Você foi convidada para fazer parte do nosso CRM.",
  "dias_expiracao": 7
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-gerado",
    "email": "novousuario@exemplo.com",
    "telefone": "+5511988888888",
    "nome": "Maria Santos",
    "token": "uuid-token-gerado",
    "perfil_id": "uuid-do-perfil",
    "cliente_id": "uuid-do-cliente",
    "convidado_por": "uuid-usuario-logado",
    "status": "pendente",
    "expira_em": "2025-10-23T18:00:00.000Z",
    "mensagem_personalizada": "Olá Maria! Você foi convidada...",
    "enviado_email": false,
    "enviado_whatsapp": false,
    "created_at": "2025-10-16T18:00:00.000Z",
    "link": "http://localhost:3001/convite/uuid-token-gerado"
  },
  "message": "Convite criado com sucesso"
}
```

---

### 5. Aceitar Convite
**Endpoint:** `POST /convites/:id/aceitar`

**Request:**
```json
{
  "usuario_criado_id": "uuid-do-usuario-criado"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "usuario@exemplo.com",
    "status": "aceito",
    "aceito_em": "2025-10-16T19:00:00.000Z",
    "usuario_criado_id": "uuid-do-usuario-criado"
  },
  "message": "Convite aceito com sucesso"
}
```

---

### 6. Reenviar Convite
**Endpoint:** `POST /convites/:id/reenviar`

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
// Sem body
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "usuario@exemplo.com",
    "status": "pendente",
    "link": "http://localhost:3001/convite/uuid-token"
  },
  "message": "Convite reenviado com sucesso"
}
```

---

### 7. Cancelar Convite
**Endpoint:** `DELETE /convites/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
// Sem body
```

**Response 200:**
```json
{
  "success": true,
  "message": "Convite cancelado com sucesso"
}
```

---

## 🔑 Sessões

### 1. Listar Minhas Sessões
**Endpoint:** `GET /sessoes`

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
// Sem body
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "usuario_id": "uuid",
      "token": "jwt-token",
      "refresh_token": "refresh-token",
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0...",
      "dispositivo": "Desktop",
      "navegador": "Chrome",
      "sistema_operacional": "Windows 10",
      "expira_em": "2025-10-16T19:00:00.000Z",
      "refresh_expira_em": "2025-10-23T18:00:00.000Z",
      "ativo": true,
      "ultimo_acesso": "2025-10-16T18:30:00.000Z",
      "created_at": "2025-10-16T18:00:00.000Z",
      "updated_at": "2025-10-16T18:30:00.000Z"
    }
  ],
  "total": 3
}
```

---

### 2. Buscar Sessão por ID
**Endpoint:** `GET /sessoes/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
// Sem body
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "usuario_id": "uuid",
    "token": "jwt-token",
    "ip_address": "192.168.1.100",
    "dispositivo": "Desktop",
    "navegador": "Chrome",
    "expira_em": "2025-10-16T19:00:00.000Z",
    "ativo": true,
    "ultimo_acesso": "2025-10-16T18:30:00.000Z"
  }
}
```

---

### 3. Encerrar Sessão Específica
**Endpoint:** `DELETE /sessoes/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
// Sem body
```

**Response 200:**
```json
{
  "success": true,
  "message": "Sessão encerrada com sucesso"
}
```

---

### 4. Encerrar Todas as Sessões
**Endpoint:** `DELETE /sessoes`

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
// Sem body
```

**Response 200:**
```json
{
  "success": true,
  "message": "Todas as sessões foram encerradas com sucesso"
}
```

---

## 🔐 Autenticação (A Implementar)

### 1. Login com Email/Senha
**Endpoint:** `POST /auth/login`

**Request:**
```json
{
  "email": "usuario@exemplo.com",
  "senha": "senha123"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "usuario": {
      "id": "uuid",
      "nome": "João Silva",
      "email": "usuario@exemplo.com",
      "ativo": true,
      "perfis": [
        {
          "perfil_id": "uuid",
          "perfil_nome": "Gerente",
          "permissoes": { /* ... */ },
          "cliente_id": "uuid"
        }
      ]
    },
    "sessao": {
      "token": "jwt-token",
      "refresh_token": "refresh-token",
      "expira_em": "2025-10-16T19:00:00.000Z",
      "refresh_expira_em": "2025-10-23T18:00:00.000Z"
    }
  },
  "message": "Login realizado com sucesso"
}
```

**Response 401:**
```json
{
  "success": false,
  "message": "Email ou senha inválidos"
}
```

---

### 2. Registro de Novo Usuário
**Endpoint:** `POST /auth/register`

**Request:**
```json
{
  "nome": "João Silva",
  "email": "joao@exemplo.com",
  "senha": "senha123",
  "telefone": "+5511999999999",
  "token_convite": "uuid-token-convite"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "usuario": {
      "id": "uuid-gerado",
      "nome": "João Silva",
      "email": "joao@exemplo.com",
      "ativo": true,
      "email_verificado": false
    },
    "sessao": {
      "token": "jwt-token",
      "refresh_token": "refresh-token",
      "expira_em": "2025-10-16T19:00:00.000Z"
    }
  },
  "message": "Usuário criado com sucesso"
}
```

---

### 3. Logout
**Endpoint:** `POST /auth/logout`

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
// Sem body
```

**Response 200:**
```json
{
  "success": true,
  "message": "Logout realizado com sucesso"
}
```

---

### 4. Renovar Token (Refresh)
**Endpoint:** `POST /auth/refresh`

**Request:**
```json
{
  "refresh_token": "refresh-token"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "token": "novo-jwt-token",
    "expira_em": "2025-10-16T20:00:00.000Z"
  },
  "message": "Token renovado com sucesso"
}
```

---

### 5. Verificar Email
**Endpoint:** `POST /auth/verify-email`

**Request:**
```json
{
  "token": "token-verificacao-email"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Email verificado com sucesso"
}
```

---

### 6. Solicitar Reset de Senha
**Endpoint:** `POST /auth/forgot-password`

**Request:**
```json
{
  "email": "usuario@exemplo.com"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Email de recuperação enviado com sucesso"
}
```

---

### 7. Resetar Senha
**Endpoint:** `POST /auth/reset-password`

**Request:**
```json
{
  "token": "token-reset-senha",
  "nova_senha": "novaSenha123"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Senha alterada com sucesso"
}
```

---

### 8. Login com Google OAuth
**Endpoint:** `POST /auth/google`

**Request:**
```json
{
  "google_token": "google-oauth-token"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "usuario": {
      "id": "uuid",
      "nome": "João Silva",
      "email": "joao@gmail.com",
      "provedor": "google"
    },
    "sessao": {
      "token": "jwt-token",
      "refresh_token": "refresh-token"
    }
  },
  "message": "Login com Google realizado com sucesso"
}
```

---

## 📝 Notas Importantes

### Estrutura de Permissões
As permissões seguem o formato:
```json
{
  "recurso": {
    "acao": boolean
  }
}
```

Exemplo:
```json
{
  "usuarios": {
    "criar": true,
    "editar": true,
    "deletar": false,
    "visualizar": true,
    "convidar": true
  },
  "clientes": {
    "criar": true,
    "editar": true,
    "deletar": false,
    "visualizar": true
  }
}
```

### Status de Convite
- `pendente` - Convite enviado, aguardando aceitação
- `aceito` - Convite aceito e usuário criado
- `expirado` - Convite passou da data de expiração
- `cancelado` - Convite cancelado pelo administrador

### Autenticação JWT
- Token JWT expira em **1 hora** (padrão)
- Refresh token expira em **7 dias** (padrão)
- Incluir o token no header: `Authorization: Bearer {token}`

### Códigos de Status HTTP
- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Requisição inválida
- `401` - Não autenticado
- `403` - Sem permissão
- `404` - Não encontrado
- `409` - Conflito (ex: email já existe)
- `500` - Erro interno do servidor

---

## 🚀 Fluxo de Implementação Sugerido

### 1. Tela de Login
```
POST /auth/login
- Email + Senha
- Botões de OAuth (Google, Apple, Microsoft)
```

### 2. Tela de Registro (Via Convite)
```
GET /convites/token/:token (validar convite)
POST /auth/register (criar usuário)
```

### 3. Dashboard
```
GET /perfis (listar perfis do usuário)
GET /sessoes (listar sessões ativas)
```

### 4. Gerenciamento de Convites
```
GET /convites (listar convites)
POST /convites (criar novo convite)
POST /convites/:id/reenviar (reenviar)
DELETE /convites/:id (cancelar)
```

### 5. Gerenciamento de Sessões
```
GET /sessoes (ver sessões ativas)
DELETE /sessoes/:id (encerrar sessão específica)
DELETE /sessoes (encerrar todas)
```

---

## 📞 Suporte

Para dúvidas ou problemas, entre em contato com a equipe de backend.

**Documentação Swagger:** `http://localhost:3000/api-docs`
