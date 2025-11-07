-- ============================================
-- NEOSALE CRM - ATUALIZAÇÃO INCREMENTAL
-- ============================================
-- Este script adiciona apenas as tabelas NOVAS
-- sem recriar clientes e perfis que já existem
-- ============================================

BEGIN;

-- ============================================
-- 1. ADICIONAR COLUNAS EM TABELAS EXISTENTES
-- ============================================

-- Verificar e adicionar coluna tipo_usuario em usuarios (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usuarios' AND column_name = 'tipo_usuario'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN tipo_usuario TEXT NOT NULL DEFAULT 'usuario' 
      CHECK (tipo_usuario IN ('super_admin', 'admin', 'usuario'));
  END IF;
END $$;

-- Verificar e adicionar coluna auth_user_id em usuarios (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usuarios' AND column_name = 'auth_user_id'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE;
  END IF;
END $$;

-- Verificar e adicionar coluna avatar_url em usuarios (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usuarios' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

-- Verificar e adicionar coluna ultimo_acesso em usuarios (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usuarios' AND column_name = 'ultimo_acesso'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN ultimo_acesso TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Verificar e adicionar coluna configuracoes em usuarios (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usuarios' AND column_name = 'configuracoes'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN configuracoes JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Adicionar colunas em clientes (se não existirem)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clientes' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE clientes ADD COLUMN logo_url TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clientes' AND column_name = 'configuracoes'
  ) THEN
    ALTER TABLE clientes ADD COLUMN configuracoes JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Adicionar coluna is_sistema em perfis (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'perfis' AND column_name = 'is_sistema'
  ) THEN
    ALTER TABLE perfis ADD COLUMN is_sistema BOOLEAN DEFAULT false;
  END IF;
END $$;

-- ============================================
-- 2. CRIAR NOVAS TABELAS
-- ============================================

-- Tabela de relacionamento Usuário-Cliente (N:N)
CREATE TABLE IF NOT EXISTS usuario_clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  perfil_id UUID REFERENCES perfis(id) ON DELETE SET NULL,
  is_principal BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(usuario_id, cliente_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_usuario_clientes_usuario ON usuario_clientes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuario_clientes_cliente ON usuario_clientes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_usuario_clientes_perfil ON usuario_clientes(perfil_id);

-- Tabela de Tipos de Acesso
CREATE TABLE IF NOT EXISTS tipos_acesso (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  nivel INTEGER NOT NULL,
  recursos JSONB DEFAULT '[]'::jsonb,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_tipos_acesso_nivel ON tipos_acesso(nivel);

-- ============================================
-- 3. CRIAR ÍNDICES ADICIONAIS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_usuarios_auth_user_id ON usuarios(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo ON usuarios(tipo_usuario);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo);

CREATE INDEX IF NOT EXISTS idx_clientes_ativo ON clientes(ativo);
CREATE INDEX IF NOT EXISTS idx_clientes_cnpj ON clientes(cnpj);

CREATE INDEX IF NOT EXISTS idx_perfis_cliente_id ON perfis(cliente_id);
CREATE INDEX IF NOT EXISTS idx_perfis_ativo ON perfis(ativo);

-- ============================================
-- 4. HABILITAR RLS
-- ============================================

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_acesso ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. CRIAR POLÍTICAS RLS
-- ============================================

-- Políticas para USUARIOS
DROP POLICY IF EXISTS "Usuario ve seu perfil" ON usuarios;
CREATE POLICY "Usuario ve seu perfil" ON usuarios
  FOR SELECT
  USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Super Admin ve todos usuarios" ON usuarios;
CREATE POLICY "Super Admin ve todos usuarios" ON usuarios
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.auth_user_id = auth.uid()
      AND u.tipo_usuario = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Admin ve usuarios de seus clientes" ON usuarios;
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

-- Políticas para CLIENTES
DROP POLICY IF EXISTS "Super Admin ve todos clientes" ON clientes;
CREATE POLICY "Super Admin ve todos clientes" ON clientes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE auth_user_id = auth.uid()
      AND tipo_usuario = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Usuario ve seus clientes" ON clientes;
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

-- Políticas para PERFIS
DROP POLICY IF EXISTS "Super Admin ve todos perfis" ON perfis;
CREATE POLICY "Super Admin ve todos perfis" ON perfis
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE auth_user_id = auth.uid()
      AND tipo_usuario = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Usuario ve perfis de seus clientes" ON perfis;
CREATE POLICY "Usuario ve perfis de seus clientes" ON perfis
  FOR SELECT
  USING (
    cliente_id IS NULL
    OR EXISTS (
      SELECT 1 FROM usuario_clientes uc
      JOIN usuarios u ON u.id = uc.usuario_id
      WHERE u.auth_user_id = auth.uid()
      AND uc.cliente_id = perfis.cliente_id
    )
  );

-- Políticas para USUARIO_CLIENTES
DROP POLICY IF EXISTS "Usuario ve seus vinculos" ON usuario_clientes;
CREATE POLICY "Usuario ve seus vinculos" ON usuario_clientes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = usuario_clientes.usuario_id
      AND auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Super Admin ve todos vinculos" ON usuario_clientes;
CREATE POLICY "Super Admin ve todos vinculos" ON usuario_clientes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE auth_user_id = auth.uid()
      AND tipo_usuario = 'super_admin'
    )
  );

-- Políticas para TIPOS_ACESSO
DROP POLICY IF EXISTS "Usuarios autenticados veem tipos acesso" ON tipos_acesso;
CREATE POLICY "Usuarios autenticados veem tipos acesso" ON tipos_acesso
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- 6. CRIAR TRIGGERS E FUNÇÕES
-- ============================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_clientes_updated_at ON clientes;
CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;
CREATE TRIGGER update_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_perfis_updated_at ON perfis;
CREATE TRIGGER update_perfis_updated_at
  BEFORE UPDATE ON perfis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

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
    COALESCE(NEW.raw_user_meta_data->>'tipo_usuario', 'usuario'),
    NEW.email_confirmed_at IS NOT NULL
  )
  ON CONFLICT (auth_user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar usuário após signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 7. INSERIR DADOS INICIAIS
-- ============================================

-- Perfis do sistema (se não existirem)
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

-- Tipos de acesso
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

-- ============================================
-- 8. CRIAR VIEW
-- ============================================

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

COMMIT;

-- ============================================
-- VERIFICAÇÃO
-- ============================================

SELECT 'Setup incremental concluído com sucesso!' as status;

-- Verificar tabelas criadas
SELECT 'Tabelas:' as info;
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('usuarios', 'clientes', 'perfis', 'usuario_clientes', 'tipos_acesso')
ORDER BY tablename;

-- Verificar colunas adicionadas em usuarios
SELECT 'Colunas de usuarios:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
AND column_name IN ('tipo_usuario', 'auth_user_id', 'avatar_url', 'ultimo_acesso', 'configuracoes')
ORDER BY column_name;
