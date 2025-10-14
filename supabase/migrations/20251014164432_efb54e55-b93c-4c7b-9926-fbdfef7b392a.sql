-- Criar enum para tipo de conta
CREATE TYPE public.account_type AS ENUM ('pessoa_fisica', 'empresa');

-- Adicionar novos campos à tabela profiles
ALTER TABLE public.profiles
ADD COLUMN account_type public.account_type NOT NULL DEFAULT 'pessoa_fisica',
ADD COLUMN bio TEXT,
ADD COLUMN instagram_url TEXT,
ADD COLUMN whatsapp TEXT,
ADD COLUMN cnpj TEXT,
ADD COLUMN logo_url TEXT,
ADD COLUMN endereco TEXT,
ADD COLUMN site_url TEXT,
ADD COLUMN horario_funcionamento TEXT,
ADD COLUMN tempo_medio_resposta INTEGER,
ADD COLUMN empresa_verificada BOOLEAN DEFAULT false,
ADD COLUMN total_vendas INTEGER DEFAULT 0,
ADD COLUMN anuncios_ativos INTEGER DEFAULT 0;

-- Adicionar constraint para validar CNPJ apenas para empresas
ALTER TABLE public.profiles
ADD CONSTRAINT check_cnpj_for_empresa 
CHECK (
  (account_type = 'empresa' AND cnpj IS NOT NULL) OR 
  (account_type = 'pessoa_fisica')
);

-- Criar tabela para denúncias
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS na tabela reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Política para usuários criarem denúncias
CREATE POLICY "Usuários podem criar denúncias"
ON public.reports
FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

-- Política para usuários verem suas próprias denúncias
CREATE POLICY "Usuários veem suas denúncias"
ON public.reports
FOR SELECT
USING (auth.uid() = reporter_id);

-- Criar tabela para bloqueios
CREATE TABLE public.blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- Habilitar RLS na tabela blocks
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- Política para usuários criarem bloqueios
CREATE POLICY "Usuários podem bloquear outros"
ON public.blocks
FOR INSERT
WITH CHECK (auth.uid() = blocker_id);

-- Política para usuários verem seus bloqueios
CREATE POLICY "Usuários veem seus bloqueios"
ON public.blocks
FOR SELECT
USING (auth.uid() = blocker_id);

-- Política para usuários removerem bloqueios
CREATE POLICY "Usuários podem desbloquear"
ON public.blocks
FOR DELETE
USING (auth.uid() = blocker_id);

-- Criar índices para melhor performance
CREATE INDEX idx_profiles_account_type ON public.profiles(account_type);
CREATE INDEX idx_profiles_empresa_verificada ON public.profiles(empresa_verificada) WHERE account_type = 'empresa';
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_blocks_blocker ON public.blocks(blocker_id);
CREATE INDEX idx_blocks_blocked ON public.blocks(blocked_id);