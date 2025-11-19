# Correção: Erro ao Buscar Perfil (RLS Policies)

## Problema

Ao fazer login, o sistema tentava buscar o perfil do usuário mas falhava com erro de permissão:

```
GET https://zhdrrasclpnsuqxykcyp.supabase.co/rest/v1/profiles?select=*&id=eq.cd3357f3-1952-4d6c-8437-d2fd34b443cf
Status: 401/403 (Unauthorized/Forbidden)
```

## Causa Raiz

As políticas RLS (Row Level Security) da tabela `profiles` estavam configuradas para:
- ✅ SELECT (visualizar) - OK
- ✅ UPDATE (atualizar) - OK
- ❌ INSERT (inserir) - **FALTANDO**

Isso causava dois problemas:

1. **Trigger não funcionava**: O trigger `handle_new_user()` que cria automaticamente o perfil ao fazer signup não conseguia inserir na tabela `profiles`

2. **Criação manual falhava**: O código de fallback no `AuthContext.tsx` que tenta criar o perfil se ele não existir também falhava

## Solução Aplicada

### 1. Migration SQL

Criada a migration `004_fix_profiles_insert_policy.sql` que adiciona políticas de INSERT:

```sql
-- Permitir que usuários insiram seus próprios perfis
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Permitir que super admins insiram perfis
CREATE POLICY "Super admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );
```

### 2. Código de Fallback Melhorado

Atualizado `AuthContext.tsx` para:
- Detectar erro `PGRST116` (registro não encontrado)
- Criar perfil automaticamente se não existir
- Logs detalhados para debug

```tsx
if (profileError.code === 'PGRST116') {
  console.log('⚠️ Perfil não encontrado, criando perfil básico...')
  const { data: newProfile, error: createError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email: session?.user?.email || '',
      full_name: session?.user?.user_metadata?.full_name || '',
      role: 'viewer'
    })
    .select()
    .single()
  // ...
}
```

## Como Aplicar a Correção

### Opção 1: Via Script (Recomendado)

```bash
# Configurar URL do banco
export SUPABASE_DB_URL='postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres'

# Executar script
bash scripts/apply-profile-fix.sh
```

### Opção 2: Via Supabase Dashboard

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Cole o conteúdo de `supabase/migrations/004_fix_profiles_insert_policy.sql`
4. Execute

### Opção 3: Via Supabase CLI

```bash
supabase db push
```

## Verificação

Após aplicar a correção, teste:

1. **Criar novo usuário**:
   ```bash
   # O perfil deve ser criado automaticamente via trigger
   ```

2. **Login com usuário existente sem perfil**:
   ```bash
   # O perfil deve ser criado automaticamente via fallback
   ```

3. **Verificar logs do console**:
   ```
   ✅ Perfil encontrado: { id: '...', email: '...', role: '...' }
   ```

## Políticas RLS Completas

Após a correção, a tabela `profiles` terá:

### SELECT (Visualizar)
- ✅ Usuários podem ver seu próprio perfil
- ✅ Super admins podem ver todos os perfis
- ✅ Admins podem ver perfis de usuários nos seus clientes

### INSERT (Inserir)
- ✅ Usuários podem inserir seu próprio perfil
- ✅ Super admins podem inserir qualquer perfil

### UPDATE (Atualizar)
- ✅ Usuários podem atualizar seu próprio perfil

### DELETE (Deletar)
- ❌ Nenhuma política (apenas CASCADE do auth.users)

## Prevenção

Para evitar problemas similares no futuro:

1. **Sempre criar políticas para todas as operações** (SELECT, INSERT, UPDATE, DELETE)
2. **Testar triggers** em ambiente de desenvolvimento
3. **Adicionar logs detalhados** para debug
4. **Implementar fallbacks** para casos de erro

## Referências

- Migration: `supabase/migrations/004_fix_profiles_insert_policy.sql`
- Código: `src/contexts/AuthContext.tsx` (linha 27-77)
- Documentação Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security
