# 🗄️ Estrutura do Banco de Dados - NeoCRM

## 📋 Visão Geral

Sistema multi-tenant com:
- **Super Admin**: Acesso total a todos os clientes
- **Admin Cliente**: Acesso apenas ao(s) seu(s) cliente(s)
- **Usuários**: Vinculados a um ou mais clientes

---

## 🏗️ Estrutura de Tabelas

### **1. Clientes** (Tenants)

```sql
-- Tabela de Clientes (Multi-tenant)
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  razao_social TEXT,
  cnpj TEXT UNIQUE,
  email TEXT,
  telefone TEXT,
  endereco JSONB,
  logo_url TEXT,
  ativo BOOLEAN DEFAULT true,
  configuracoes JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_clientes_ativo ON clientes(ativo);
CREATE INDEX IF NOT EXISTS idx_clientes_cnpj ON clientes(cnpj);

-- RLS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Política: Super Admin vê todos
CREATE POLICY "Super Admin ve todos clientes" ON clientes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE auth_user_id = auth.uid()
      AND tipo_usuario = 'super_admin'
    )
  );

-- Política: Usuário vê apenas seus clientes
CREATE POLICY "Usuario ve seus clientes" ON clientes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuario_clientes uc
      JOIN usuarios u ON u.id = uc.usuario_id
      WHERE u.auth_user_id = auth.uid()
      AND uc.cliente_id = clientes.id
    )
  );
```

### **2. Perfis** (Roles)

```sql
-- Tabela de Perfis
CREATE TABLE IF NOT EXISTS perfis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  permissoes JSONB DEFAULT '{}'::jsonb,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  is_sistema BOOLEAN DEFAULT false, -- Perfis do sistema (não podem ser editados)
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(nome, cliente_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_perfis_cliente_id ON perfis(cliente_id);
CREATE INDEX IF NOT EXISTS idx_perfis_ativo ON perfis(ativo);

-- RLS
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;

-- Política: Super Admin vê todos
CREATE POLICY "Super Admin ve todos perfis" ON perfis
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE auth_user_id = auth.uid()
      AND tipo_usuario = 'super_admin'
    )
  );

-- Política: Usuário vê perfis de seus clientes
CREATE POLICY "Usuario ve perfis de seus clientes" ON perfis
  FOR SELECT
  USING (
    cliente_id IS NULL -- Perfis globais
    OR EXISTS (
      SELECT 1 FROM usuario_clientes uc
      JOIN usuarios u ON u.id = uc.usuario_id
      WHERE u.auth_user_id = auth.uid()
      AND uc.cliente_id = perfis.cliente_id
    )
  );
```

### **3. Usuários**

```sql
-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telefone TEXT,
  avatar_url TEXT,
  tipo_usuario TEXT NOT NULL DEFAULT 'usuario' CHECK (tipo_usuario IN ('super_admin', 'admin', 'usuario')),
  ativo BOOLEAN DEFAULT true,
  email_verificado BOOLEAN DEFAULT false,
  ultimo_acesso TIMESTAMP WITH TIME ZONE,
  configuracoes JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_usuarios_auth_user_id ON usuarios(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo ON usuarios(tipo_usuario);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo);

-- RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Política: Usuário vê seu próprio perfil
CREATE POLICY "Usuario ve seu perfil" ON usuarios
  FOR SELECT
  USING (auth_user_id = auth.uid());

-- Política: Super Admin vê todos
CREATE POLICY "Super Admin ve todos usuarios" ON usuarios
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.auth_user_id = auth.uid()
      AND u.tipo_usuario = 'super_admin'
    )
  );

-- Política: Admin vê usuários de seus clientes
CREATE POLICY "Admin ve usuarios de seus clientes" ON usuarios
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuario_clientes uc1
      WHERE uc1.usuario_id = usuarios.id
      AND uc1.cliente_id IN (
        SELECT uc2.cliente_id
        FROM usuario_clientes uc2
        JOIN usuarios u ON u.id = uc2.usuario_id
        WHERE u.auth_user_id = auth.uid()
      )
    )
  );
```

### **4. Usuário-Clientes** (Relacionamento N:N)

```sql
-- Tabela de relacionamento Usuário-Cliente
CREATE TABLE IF NOT EXISTS usuario_clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  perfil_id UUID REFERENCES perfis(id) ON DELETE SET NULL,
  is_principal BOOLEAN DEFAULT false, -- Cliente principal do usuário
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(usuario_id, cliente_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_usuario_clientes_usuario ON usuario_clientes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuario_clientes_cliente ON usuario_clientes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_usuario_clientes_perfil ON usuario_clientes(perfil_id);

-- RLS
ALTER TABLE usuario_clientes ENABLE ROW LEVEL SECURITY;

-- Política: Usuário vê seus próprios vínculos
CREATE POLICY "Usuario ve seus vinculos" ON usuario_clientes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = usuario_clientes.usuario_id
      AND auth_user_id = auth.uid()
    )
  );

-- Política: Super Admin vê todos
CREATE POLICY "Super Admin ve todos vinculos" ON usuario_clientes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE auth_user_id = auth.uid()
      AND tipo_usuario = 'super_admin'
    )
  );
```

### **5. Tipos de Acesso**

```sql
-- Tabela de Tipos de Acesso
CREATE TABLE IF NOT EXISTS tipos_acesso (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  nivel INTEGER NOT NULL, -- 1=Básico, 2=Intermediário, 3=Avançado, 999=Super Admin
  recursos JSONB DEFAULT '[]'::jsonb,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_tipos_acesso_nivel ON tipos_acesso(nivel);

-- RLS
ALTER TABLE tipos_acesso ENABLE ROW LEVEL SECURITY;

-- Política: Todos autenticados podem ver
CREATE POLICY "Usuarios autenticados veem tipos acesso" ON tipos_acesso
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
```

---

## 🌱 Dados Iniciais (Seeds)

### **1. Criar Perfis do Sistema**

```sql
-- Perfis globais do sistema
INSERT INTO perfis (id, nome, descricao, permissoes, is_sistema, cliente_id) VALUES
  (
    'a0000000-0000-0000-0000-000000000001',
    'Super Admin',
    'Acesso total ao sistema',
    '{"admin": true, "super_admin": true}'::jsonb,
    true,
    NULL
  ),
  (
    'a0000000-0000-0000-0000-000000000002',
    'Admin Cliente',
    'Administrador do cliente',
    '{"admin": true, "usuarios": {"criar": true, "editar": true, "deletar": true, "visualizar": true}}'::jsonb,
    true,
    NULL
  ),
  (
    'a0000000-0000-0000-0000-000000000003',
    'Usuário Padrão',
    'Usuário comum do sistema',
    '{"usuarios": {"visualizar": true}}'::jsonb,
    true,
    NULL
  )
ON CONFLICT (id) DO NOTHING;
```

### **2. Criar Tipos de Acesso**

```sql
INSERT INTO tipos_acesso (id, nome, descricao, nivel, recursos) VALUES
  (
    'b0000000-0000-0000-0000-000000000001',
    'Super Admin',
    'Acesso total ao sistema',
    999,
    '["all"]'::jsonb
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    'Admin',
    'Administrador do cliente',
    3,
    '["usuarios", "configuracoes", "relatorios"]'::jsonb
  ),
  (
    'b0000000-0000-0000-0000-000000000003',
    'Usuário',
    'Usuário padrão',
    1,
    '["dashboard", "contatos"]'::jsonb
  )
ON CONFLICT (id) DO NOTHING;
```

---

## 👤 Criar Primeiro Super Admin

### **Opção 1: Via Supabase Dashboard**

1. Acesse https://app.supabase.com
2. Vá em **Authentication → Users**
3. Clique em **Add User**
4. Preencha:
   - Email: `admin@neosaleai.com`
   - Password: `Admin@123456` (troque depois!)
   - Auto Confirm User: ✅ Sim

5. Copie o `id` do usuário criado

6. Execute no **SQL Editor**:

```sql
-- Inserir Super Admin na tabela usuarios
INSERT INTO usuarios (
  auth_user_id,
  nome,
  email,
  tipo_usuario,
  ativo,
  email_verificado
) VALUES (
  'COLE_O_ID_DO_AUTH_USER_AQUI', -- UUID do auth.users
  'Super Admin',
  'admin@neosaleai.com',
  'super_admin',
  true,
  true
);
```

### **Opção 2: Via SQL (Recomendado)**

```sql
-- Criar usuário no Supabase Auth e na tabela usuarios em uma transação
DO $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Nota: Isso requer que você use a API Admin do Supabase
  -- Por enquanto, crie manualmente via Dashboard e depois execute:
  
  -- Buscar o auth_user_id do email
  SELECT id INTO new_user_id
  FROM auth.users
  WHERE email = 'admin@neosaleai.com'
  LIMIT 1;
  
  -- Se encontrou, criar registro em usuarios
  IF new_user_id IS NOT NULL THEN
    INSERT INTO usuarios (
      auth_user_id,
      nome,
      email,
      tipo_usuario,
      ativo,
      email_verificado
    ) VALUES (
      new_user_id,
      'Super Admin',
      'admin@neosaleai.com',
      'super_admin',
      true,
      true
    )
    ON CONFLICT (auth_user_id) DO NOTHING;
    
    RAISE NOTICE 'Super Admin criado com sucesso!';
  ELSE
    RAISE NOTICE 'Usuário não encontrado no auth.users. Crie primeiro via Dashboard.';
  END IF;
END $$;
```

---

## 🔄 Triggers e Funções

### **1. Atualizar updated_at automaticamente**

```sql
-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_perfis_updated_at
  BEFORE UPDATE ON perfis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### **2. Criar usuário automaticamente após signup**

```sql
-- Função para criar registro em usuarios após signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO usuarios (
    auth_user_id,
    nome,
    email,
    tipo_usuario,
    email_verificado
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    'usuario', -- Tipo padrão
    NEW.email_confirmed_at IS NOT NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

### **3. Atualizar último acesso**

```sql
-- Função para atualizar último acesso
CREATE OR REPLACE FUNCTION update_ultimo_acesso()
RETURNS void AS $$
BEGIN
  UPDATE usuarios
  SET ultimo_acesso = NOW()
  WHERE auth_user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🔐 Permissões e Segurança

### **Estrutura de Permissões (JSON)**

```json
{
  "admin": true,
  "super_admin": true,
  "usuarios": {
    "criar": true,
    "editar": true,
    "deletar": true,
    "visualizar": true
  },
  "clientes": {
    "criar": true,
    "editar": true,
    "deletar": false,
    "visualizar": true
  },
  "relatorios": {
    "visualizar": true,
    "exportar": true
  }
}
```

### **Verificação de Permissões**

```sql
-- Função para verificar se usuário tem permissão
CREATE OR REPLACE FUNCTION user_has_permission(
  recurso TEXT,
  acao TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  user_permissions JSONB;
  is_super_admin BOOLEAN;
BEGIN
  -- Verificar se é Super Admin
  SELECT tipo_usuario = 'super_admin' INTO is_super_admin
  FROM usuarios
  WHERE auth_user_id = auth.uid();
  
  IF is_super_admin THEN
    RETURN true;
  END IF;
  
  -- Buscar permissões do usuário
  SELECT p.permissoes INTO user_permissions
  FROM usuarios u
  JOIN usuario_clientes uc ON uc.usuario_id = u.id
  JOIN perfis p ON p.id = uc.perfil_id
  WHERE u.auth_user_id = auth.uid()
  LIMIT 1;
  
  -- Verificar permissão específica
  RETURN (
    user_permissions->'admin' = 'true'::jsonb
    OR user_permissions->recurso->acao = 'true'::jsonb
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 📊 Views Úteis

### **1. View de Usuários Completos**

```sql
CREATE OR REPLACE VIEW vw_usuarios_completos AS
SELECT
  u.id,
  u.auth_user_id,
  u.nome,
  u.email,
  u.telefone,
  u.avatar_url,
  u.tipo_usuario,
  u.ativo,
  u.email_verificado,
  u.ultimo_acesso,
  u.created_at,
  COALESCE(
    json_agg(
      json_build_object(
        'cliente_id', c.id,
        'cliente_nome', c.nome,
        'perfil_id', p.id,
        'perfil_nome', p.nome,
        'permissoes', p.permissoes,
        'is_principal', uc.is_principal
      )
    ) FILTER (WHERE c.id IS NOT NULL),
    '[]'::json
  ) AS clientes
FROM usuarios u
LEFT JOIN usuario_clientes uc ON uc.usuario_id = u.id AND uc.ativo = true
LEFT JOIN clientes c ON c.id = uc.cliente_id AND c.ativo = true
LEFT JOIN perfis p ON p.id = uc.perfil_id
GROUP BY u.id;
```

---

## 🚀 Script Completo de Setup

Execute este script no **SQL Editor** do Supabase:

```sql
-- ============================================
-- NEOSALE CRM - DATABASE SETUP COMPLETO
-- ============================================

BEGIN;

-- 1. CRIAR TABELAS
-- (Cole todos os CREATE TABLE acima)

-- 2. CRIAR ÍNDICES
-- (Já incluídos nos CREATE TABLE)

-- 3. HABILITAR RLS
-- (Já incluído nos CREATE TABLE)

-- 4. CRIAR POLÍTICAS RLS
-- (Já incluídas nos CREATE TABLE)

-- 5. CRIAR TRIGGERS E FUNÇÕES
-- (Cole todas as funções e triggers acima)

-- 6. INSERIR DADOS INICIAIS
-- (Cole os INSERTs de perfis e tipos_acesso)

-- 7. CRIAR VIEWS
-- (Cole a view vw_usuarios_completos)

COMMIT;

-- Verificar criação
SELECT 'Tabelas criadas:' as status;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

SELECT 'Setup concluído com sucesso!' as status;
```

---

## ✅ Checklist de Setup

- [ ] Executar SQL de criação de tabelas
- [ ] Executar SQL de perfis e tipos de acesso
- [ ] Criar primeiro usuário no Supabase Auth
- [ ] Vincular usuário como Super Admin
- [ ] Testar login
- [ ] Criar primeiro cliente
- [ ] Criar usuário vinculado ao cliente
- [ ] Testar permissões

---

## 📝 Próximos Passos

1. **Criar API Route** para buscar dados do usuário (`/api/auth/me`)
2. **Atualizar AuthContext** para usar nova estrutura
3. **Criar página de setup inicial** (primeiro acesso)
4. **Implementar seletor de cliente** (para usuários multi-cliente)
5. **Criar CRUD de clientes**
6. **Criar CRUD de usuários**

---

**Data:** 07/11/2025  
**Versão:** 1.0.0  
**Status:** ✅ Pronto para implementação
