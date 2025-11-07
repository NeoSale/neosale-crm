# 🎯 Sistema de Convites com Supabase - Guia Completo

## ✅ O Que Foi Implementado

Sistema completo de convites de usuários usando **Supabase Auth**, substituindo o sistema antigo inseguro.

---

## 📁 Arquivos Criados

### **1. Serviço de Convites**
- `src/services/inviteService.ts` - Funções para enviar, listar e cancelar convites

### **2. API Routes (Server-Side)**
- `src/app/api/invite/send/route.ts` - Endpoint para enviar convites

### **3. Páginas**
- `src/app/convites/page.tsx` - Interface para admin enviar convites
- `src/app/auth/callback/page.tsx` - Página de aceite de convite e criação de senha

---

## 🔄 Fluxo Completo

### **1. Admin Envia Convite**
```
Admin acessa /convites
  ↓
Preenche email e dados opcionais
  ↓
Sistema chama API /api/invite/send
  ↓
Supabase envia email automaticamente
```

### **2. Usuário Recebe Email**
```
Email do Supabase com link mágico
  ↓
Link: https://seudominio.com/auth/callback#access_token=xxx&type=invite
  ↓
Usuário clica no link
```

### **3. Usuário Cria Conta**
```
Página /auth/callback valida token
  ↓
Exibe formulário: Nome + Senha + Confirmar Senha
  ↓
Usuário preenche e submete
  ↓
Supabase atualiza usuário com senha
  ↓
Login automático e redirecionamento
```

---

## ⚙️ Configuração Necessária

### **1. Variáveis de Ambiente**

Crie/atualize `.env.local`:

```env
# Supabase (já existentes)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key

# Supabase Service Role (NOVO - NUNCA EXPONHA NO FRONTEND)
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

# URL do App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Onde encontrar as keys:**
1. Acesse https://app.supabase.com
2. Selecione seu projeto
3. Vá em Settings → API
4. Copie:
   - `URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **NUNCA EXPONHA**

### **2. Configurar Email Templates no Supabase**

1. Acesse https://app.supabase.com
2. Vá em Authentication → Email Templates
3. Selecione "Invite user"
4. Customize o template:

```html
<h2>Você foi convidado para o NeoCRM!</h2>

<p>Olá{{ if .Data.nome }}, {{ .Data.nome }}{{ end }}!</p>

<p>Você recebeu um convite para se juntar ao NeoCRM.</p>

{{ if .Data.mensagem_personalizada }}
<div style="background: #f0f9ff; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0;">
  <p style="margin: 0;">{{ .Data.mensagem_personalizada }}</p>
</div>
{{ end }}

<p>Clique no botão abaixo para criar sua conta:</p>

<a href="{{ .ConfirmationURL }}" 
   style="background: #403CCF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
  Criar Minha Conta
</a>

<p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
  Este link expira em 24 horas.
</p>

<p style="color: #6b7280; font-size: 14px;">
  Se você não solicitou este convite, ignore este email.
</p>
```

5. Salve o template

### **3. Configurar Redirect URLs**

1. Vá em Authentication → URL Configuration
2. Adicione em "Redirect URLs":
   ```
   http://localhost:3000/auth/callback
   https://neosaleai.com/auth/callback
   ```

### **4. Criar Tabela de Convites (Opcional)**

Para tracking de convites, crie a tabela no Supabase:

```sql
-- Tabela de convites (opcional, para histórico)
CREATE TABLE IF NOT EXISTS convites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  nome TEXT,
  perfil_id TEXT,
  cliente_id TEXT,
  revendedor_id TEXT,
  tipo_acesso_id TEXT,
  mensagem_personalizada TEXT,
  convidado_por UUID REFERENCES auth.users(id),
  auth_user_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aceito', 'cancelado', 'expirado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  aceito_em TIMESTAMP WITH TIME ZONE,
  expira_em TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_convites_email ON convites(email);
CREATE INDEX IF NOT EXISTS idx_convites_status ON convites(status);
CREATE INDEX IF NOT EXISTS idx_convites_convidado_por ON convites(convidado_por);
CREATE INDEX IF NOT EXISTS idx_convites_auth_user_id ON convites(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_convites_expira_em ON convites(expira_em);

-- RLS (Row Level Security)
ALTER TABLE convites ENABLE ROW LEVEL SECURITY;

-- Política: Usuários autenticados podem ver seus próprios convites
CREATE POLICY "Usuarios podem ver seus convites" ON convites
  FOR SELECT
  USING (
    auth.uid() = convidado_por
    OR auth.uid() = auth_user_id
  );

-- Política: Apenas usuários autenticados podem criar convites
-- Nota: A verificação de admin deve ser feita na API, não no RLS
CREATE POLICY "Usuarios autenticados podem criar convites" ON convites
  FOR INSERT
  WITH CHECK (
    auth.uid() = convidado_por
  );

-- Política: Apenas quem criou pode atualizar
CREATE POLICY "Usuarios podem atualizar seus convites" ON convites
  FOR UPDATE
  USING (auth.uid() = convidado_por)
  WITH CHECK (auth.uid() = convidado_por);

-- Política: Apenas quem criou pode deletar
CREATE POLICY "Usuarios podem deletar seus convites" ON convites
  FOR DELETE
  USING (auth.uid() = convidado_por);

-- Função para marcar convites expirados automaticamente
CREATE OR REPLACE FUNCTION marcar_convites_expirados()
RETURNS void AS $$
BEGIN
  UPDATE convites
  SET status = 'expirado'
  WHERE status = 'pendente'
    AND expira_em < NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger para executar a função periodicamente (opcional)
-- Você pode configurar um cron job no Supabase para executar isso
```

**Como configurar o Cron Job (opcional):**

1. Instale a extensão `pg_cron` no Supabase:
```sql
-- No SQL Editor do Supabase
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

2. Configure o cron para rodar a cada hora:
```sql
SELECT cron.schedule(
  'marcar-convites-expirados',
  '0 * * * *', -- A cada hora
  $$SELECT marcar_convites_expirados()$$
);
```

3. Ou simplesmente chame a função manualmente quando necessário:
```sql
SELECT marcar_convites_expirados();
```

---

## 🎨 Recursos Implementados

### **Página de Envio de Convites** (`/convites`)
- ✅ Formulário limpo e intuitivo
- ✅ Validação em tempo real
- ✅ Campo de mensagem personalizada
- ✅ Feedback visual de sucesso
- ✅ Dark mode completo
- ✅ Apenas admin pode acessar
- ✅ Loading states

### **Página de Aceite** (`/auth/callback`)
- ✅ Validação automática do token
- ✅ Formulário de nome e senha
- ✅ Indicador de força de senha
- ✅ Toggle mostrar/ocultar senha
- ✅ Mensagem personalizada do convite
- ✅ Dark mode completo
- ✅ Validações robustas
- ✅ Feedback de erro/sucesso

---

## 🔒 Segurança

### **Melhorias vs Sistema Antigo:**

| Aspecto | Sistema Antigo | Sistema Novo (Supabase) |
|---------|---------------|------------------------|
| Hash de senha | ❌ Cliente (inseguro) | ✅ Supabase (seguro) |
| Validação de token | ⚠️ Backend custom | ✅ Supabase Auth |
| Expiração | ⚠️ Manual | ✅ Automático (24h) |
| Email | ⚠️ SMTP manual | ✅ Supabase gerenciado |
| Armazenamento | ❌ localStorage | ✅ Supabase session |
| Refresh token | ⚠️ Manual | ✅ Automático |

### **Boas Práticas Aplicadas:**
- ✅ Service Role Key apenas no servidor
- ✅ Senha nunca hasheada no cliente
- ✅ Tokens com expiração automática
- ✅ HTTPS obrigatório em produção
- ✅ RLS (Row Level Security) no banco
- ✅ Validação de permissões

---

## 🧪 Como Testar

### **1. Teste Local**

```bash
# 1. Configurar variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas keys do Supabase

# 2. Instalar dependências (se necessário)
npm install

# 3. Rodar aplicação
npm run dev

# 4. Acessar
http://localhost:3000/convites
```

### **2. Fluxo de Teste**

1. **Login como Admin**
   - Acesse `/login`
   - Faça login com usuário admin

2. **Enviar Convite**
   - Acesse `/convites`
   - Preencha email (use email real para teste)
   - Adicione nome (opcional)
   - Adicione mensagem personalizada (opcional)
   - Clique em "Enviar Convite"

3. **Verificar Email**
   - Abra o email recebido
   - Clique no link "Criar Minha Conta"

4. **Criar Conta**
   - Preencha nome
   - Defina senha (min 6 caracteres)
   - Confirme senha
   - Clique em "Criar Conta"

5. **Verificar Login**
   - Deve ser redirecionado para home
   - Usuário deve estar autenticado

---

## 📊 Endpoints da API

### **POST /api/invite/send**
Envia convite para novo usuário.

**Headers:**
```json
{
  "Authorization": "Bearer {access_token}",
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "email": "usuario@exemplo.com",
  "nome": "João Silva",
  "perfil_id": "uuid",
  "cliente_id": "uuid",
  "mensagem_personalizada": "Bem-vindo ao time!"
}
```

**Response (Sucesso):**
```json
{
  "success": true,
  "message": "Convite enviado com sucesso!",
  "data": {
    "email": "usuario@exemplo.com",
    "user_id": "uuid"
  }
}
```

**Response (Erro):**
```json
{
  "success": false,
  "message": "Usuário com este email já existe"
}
```

---

## 🚀 Deploy em Produção

### **1. Variáveis de Ambiente**
Configure no Vercel/Netlify:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
NEXT_PUBLIC_APP_URL=https://seudominio.com
```

### **2. Redirect URLs**
Adicione no Supabase:
```
https://seudominio.com/auth/callback
```

### **3. Email Template**
- Atualize links no template para produção
- Teste envio de email

### **4. DNS e SSL**
- Configure domínio
- Certifique-se de ter HTTPS ativo

---

## 🔧 Troubleshooting

### **Erro: "Supabase URL ou Anon Key não configurados"**
- Verifique `.env.local`
- Reinicie servidor: `npm run dev`

### **Erro: "Token inválido"**
- Verifique se `SUPABASE_SERVICE_ROLE_KEY` está configurada
- Confirme que a key está correta no Supabase

### **Email não chega**
- Verifique spam/lixo eletrônico
- Confirme template de email no Supabase
- Verifique logs no Supabase Dashboard

### **Link do email não funciona**
- Confirme redirect URL no Supabase
- Verifique se `NEXT_PUBLIC_APP_URL` está correto
- Teste em navegador anônimo

### **Erro: "Apenas administradores podem enviar convites"**
- Verifique se usuário tem permissão de admin
- Confirme lógica de `isAdmin()` no `SupabaseAuthContext`

---

## 📝 Próximos Passos

### **Funcionalidades Adicionais:**
- [ ] Listar convites pendentes
- [ ] Reenviar convite
- [ ] Cancelar convite
- [ ] Histórico de convites
- [ ] Notificações de convite aceito
- [ ] Convite em massa (CSV)
- [ ] Personalizar permissões por convite

### **Melhorias de UX:**
- [ ] Preview do email antes de enviar
- [ ] Copiar link de convite
- [ ] QR Code para convite
- [ ] Estatísticas de convites

---

## 📚 Documentação Relacionada

- [Supabase Auth - Invite Users](https://supabase.com/docs/guides/auth/auth-invite)
- [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

---

## ✅ Checklist de Implementação

- [x] Criar serviço de convites
- [x] Criar API route de envio
- [x] Criar página de envio de convites
- [x] Criar página de aceite de convite
- [x] Adicionar dark mode
- [x] Adicionar validações
- [x] Adicionar indicador de força de senha
- [x] Documentar configuração
- [ ] Configurar variáveis de ambiente
- [ ] Configurar email template no Supabase
- [ ] Configurar redirect URLs
- [ ] Testar fluxo completo
- [ ] Deploy em produção

---

**Data:** 07/11/2025  
**Versão:** 1.0.0  
**Status:** ✅ Implementado e pronto para configuração
