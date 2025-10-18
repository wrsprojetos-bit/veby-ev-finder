-- Adicionar campos de tags e engagement aos anúncios
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS engagement_score numeric DEFAULT 0;

-- Criar tabela de histórico de visualizações
CREATE TABLE IF NOT EXISTS public.view_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  viewed_at timestamp with time zone DEFAULT now(),
  watch_time_seconds integer DEFAULT 0,
  UNIQUE(user_id, listing_id, viewed_at)
);

-- Habilitar RLS
ALTER TABLE public.view_history ENABLE ROW LEVEL SECURITY;

-- Políticas para view_history
CREATE POLICY "Users can view their own history"
ON public.view_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own history"
ON public.view_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_view_history_user_id ON public.view_history(user_id);
CREATE INDEX IF NOT EXISTS idx_view_history_listing_id ON public.view_history(listing_id);
CREATE INDEX IF NOT EXISTS idx_view_history_viewed_at ON public.view_history(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_tags ON public.listings USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_listings_engagement_score ON public.listings(engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_listings_category_state ON public.listings(category, state);

-- Função para calcular engagement score automaticamente
CREATE OR REPLACE FUNCTION update_listing_engagement()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.listings
  SET engagement_score = (
    COALESCE(likes, 0) * 2 +
    COALESCE(views, 0) * 0.5 +
    (SELECT COUNT(*) FROM public.favorites WHERE listing_id = NEW.listing_id) * 3
  )
  WHERE id = NEW.listing_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Triggers para atualizar engagement score
CREATE TRIGGER update_engagement_on_like
AFTER INSERT OR DELETE ON public.likes
FOR EACH ROW
EXECUTE FUNCTION update_listing_engagement();

CREATE TRIGGER update_engagement_on_favorite
AFTER INSERT OR DELETE ON public.favorites
FOR EACH ROW
EXECUTE FUNCTION update_listing_engagement();