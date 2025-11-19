# 🚨 CORREÇÃO RÁPIDA - Erro de Perfil

## Situação Atual

O erro persiste porque as políticas RLS não foram aplicadas no banco de dados.

## ✅ Solução Temporária Aplicada

O código foi atualizado para criar um **perfil temporário** no estado local se não conseguir criar no banco. Isso permite que você use o sistema AGORA, mas você DEVE aplicar a migration depois.

## 🔧 Como Aplicar a Migration (OBRIGATÓRIO)

### Passo 1: Acesse o Supabase Dashboard

1. Abra: https://supabase.com/dashboard
2. Selecione seu projeto
3. Clique em **SQL Editor** no menu lateral

### Passo 2: Execute este SQL

Copie e cole TODO o código abaixo no SQL Editor:

```sql
-- Drop políticas existentes se houver
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;

-- Permitir que usuários autenticados insiram seus próprios perfis
CREATE POLICY "Enable insert for authenticated users"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Permitir que super admins insiram perfis de outros usuários
CREATE POLICY "Super admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Garantir que o RLS está habilitado
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Verificar
SELECT COUNT(*) as insert_policies
FROM pg_policies
WHERE tablename = 'profiles' AND cmd = 'INSERT';
```

### Passo 3: Verificar Resultado

Após executar, você deve ver:
- **insert_policies: 2** (ou mais)

Se ver esse número, a migration foi aplicada com sucesso! ✅

### Passo 4: Testar

1. Faça logout da aplicação
2. Faça login novamente
3. Verifique o console (F12):
   - ✅ Deve aparecer: `✅ Perfil encontrado` ou `✅ Perfil criado via upsert`
   - ❌ NÃO deve aparecer: `⚠️ Usando perfil temporário`

## 🎯 Por Que Isso é Importante?

### Com Perfil Temporário (Situação Atual)
- ❌ Dados não são salvos no banco
- ❌ Ao recarregar a página, perde as configurações
- ❌ Não funciona em múltiplos dispositivos
- ⚠️ Funciona apenas na sessão atual

### Com Migration Aplicada
- ✅ Dados salvos permanentemente
- ✅ Sincronizado entre dispositivos
- ✅ Configurações persistem
- ✅ Sistema funciona corretamente

## 📸 Screenshots do Processo

### 1. Supabase Dashboard - SQL Editor
![SQL Editor](https://supabase.com/docs/img/sql-editor.png)

### 2. Onde Colar o SQL
- Clique em "New Query"
- Cole o código
- Clique em "Run" (ou Ctrl+Enter)

### 3. Resultado Esperado
```
insert_policies
2
```

## ❓ Troubleshooting

### "Permission denied for table profiles"
Você não tem permissões de admin. Peça para alguém com acesso de admin executar.

### "Policies already exist"
Tudo bem! Significa que já foram criadas. Execute a query de verificação:
```sql
SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles' AND cmd = 'INSERT';
```

### Ainda mostra "perfil temporário" após aplicar
1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Faça logout
3. Faça login novamente

## 🆘 Precisa de Ajuda?

Se ainda tiver problemas:

1. Tire um print do erro no console (F12)
2. Tire um print do resultado da query no Supabase
3. Verifique se está usando o projeto correto no Supabase

## ✅ Checklist

- [ ] Acessei o Supabase Dashboard
- [ ] Executei o SQL no SQL Editor
- [ ] Vi "insert_policies: 2" no resultado
- [ ] Fiz logout e login novamente
- [ ] Não vejo mais "perfil temporário" no console
- [ ] Sistema funciona normalmente

Quando todos os itens estiverem marcados, a correção está completa! 🎉
