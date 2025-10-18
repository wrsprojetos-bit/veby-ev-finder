-- Adicionar subcategoria e campos de localização estruturados à tabela listings
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS subcategory TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS preview_url TEXT;

-- Atualizar listings existentes para manter compatibilidade
UPDATE public.listings 
SET state = 'SP', city = 'São Paulo' 
WHERE state IS NULL;

-- Criar índices para melhor performance nas buscas
CREATE INDEX IF NOT EXISTS idx_listings_category ON public.listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_subcategory ON public.listings(subcategory);
CREATE INDEX IF NOT EXISTS idx_listings_state ON public.listings(state);
CREATE INDEX IF NOT EXISTS idx_listings_city ON public.listings(city);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON public.listings(created_at DESC);

-- Garantir que o usuário wrs.182@gmail.com seja super_admin
-- Primeiro, buscar o user_id do email wrs.182@gmail.com
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Buscar o ID do usuário com email wrs.182@gmail.com
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'wrs.182@gmail.com'
  LIMIT 1;
  
  -- Se o usuário existir, adicionar role de super_admin
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role, created_by)
    VALUES (admin_user_id, 'super_admin', admin_user_id)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.listings.subcategory IS 'Subcategoria do anúncio dentro da categoria principal';
COMMENT ON COLUMN public.listings.state IS 'Estado (UF) do anúncio';
COMMENT ON COLUMN public.listings.city IS 'Cidade do anúncio';
COMMENT ON COLUMN public.listings.preview_url IS 'URL de preview/thumbnail do vídeo';