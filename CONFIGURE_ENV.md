# 🔧 Como Configurar as Variáveis de Ambiente

## ❌ Erro Atual
```
Error: Your project's URL and Key are required to create a Supabase client!
```

Este erro ocorre porque o arquivo `.env.local` não existe ou está sem as credenciais do Supabase.

---

## ✅ Solução Rápida

### Opção 1: Criar Projeto no Supabase (Recomendado)

1. **Acesse:** https://supabase.com
2. **Crie uma conta** (se não tiver)
3. **Crie um novo projeto:**
   - Nome: `neosale-crm` (ou qualquer nome)
   - Database Password: Escolha uma senha forte
   - Region: Escolha a mais próxima (ex: South America)
   - Aguarde ~2 minutos para o projeto ser criado

4. **Copie as credenciais:**
   - Vá em **Settings** > **API**
   - Copie:
     - **Project URL** (ex: `https://xxxxx.supabase.co`)
     - **anon/public key** (começa com `eyJ...`)
     - **service_role key** (começa com `eyJ...`)

5. **Crie o arquivo `.env.local`** na raiz do projeto:

```bash
# No terminal, na pasta do projeto:
# Windows (PowerShell):
New-Item .env.local

# Ou crie manualmente pelo VS Code
```

6. **Cole o conteúdo abaixo no `.env.local`** (substituindo pelos seus valores):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

7. **Reinicie o servidor:**
```bash
# Pare o servidor (Ctrl+C)
npm run dev
```

---

### Opção 2: Usar Valores Temporários (Apenas para Testar)

Se você só quer testar a aplicação sem autenticação funcional, crie `.env.local` com:

```env
# Valores temporários - NÃO FUNCIONARÃO para autenticação real
NEXT_PUBLIC_SUPABASE_URL=https://exemplo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.exemplo
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.exemplo

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

⚠️ **Atenção:** Com valores temporários, a autenticação NÃO funcionará!

---

## 📋 Checklist

- [ ] Criar projeto no Supabase
- [ ] Copiar URL e Keys
- [ ] Criar arquivo `.env.local` na raiz do projeto
- [ ] Colar as credenciais
- [ ] Reiniciar o servidor (`npm run dev`)
- [ ] Verificar se o erro sumiu

---

## 🔍 Como Verificar se Está Funcionando

Após configurar, você deve ver no console:
```
✓ Ready in XXXms
○ Compiling / ...
✓ Compiled / in XXXms
```

E **NÃO** deve ver mais o erro:
```
Error: Your project's URL and Key are required...
```

---

## 🚀 Próximos Passos (Após Configurar)

1. **Executar migrations no Supabase:**
   - Vá em **SQL Editor** no Supabase Dashboard
   - Execute `supabase/migrations/001_auth_schema.sql`
   - Execute `supabase/migrations/002_create_super_admin.sql`

2. **Criar usuário super admin:**
   - Vá em **Authentication** > **Users**
   - Crie usuário: `neosaleai@gmail.com` / `neosale*2028`
   - Execute SQL: `UPDATE profiles SET role = 'super_admin' WHERE email = 'neosaleai@gmail.com';`

3. **Testar login:**
   - Acesse: http://localhost:3000/login
   - Faça login com o super admin

---

## ❓ Problemas Comuns

### Erro persiste após criar .env.local
- ✅ Reinicie o servidor (Ctrl+C e `npm run dev`)
- ✅ Verifique se o arquivo está na raiz do projeto
- ✅ Verifique se não há espaços extras nas chaves

### Keys inválidas
- ✅ Verifique se copiou as keys completas (são longas!)
- ✅ Não adicione aspas ao redor das keys
- ✅ Verifique se não há quebras de linha

### Não consigo criar projeto no Supabase
- ✅ Verifique sua conexão com internet
- ✅ Tente outro navegador
- ✅ Limpe cache do navegador

---

## 📞 Ajuda

Se o erro persistir, verifique:
1. O arquivo `.env.local` existe na raiz do projeto?
2. As variáveis estão com os nomes corretos?
3. Você reiniciou o servidor?
4. As keys do Supabase estão corretas?

Para mais detalhes, veja: **QUICK_START.md**
