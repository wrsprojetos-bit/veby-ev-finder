-- Parte 2: Criar tabela video_features e adicionar campos em listings
CREATE TABLE IF NOT EXISTS public.video_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL UNIQUE REFERENCES public.listings(id) ON DELETE CASCADE,
  tags text[] DEFAULT '{}',
  ai_description text,
  objects_detected jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_video_features_listing_id ON public.video_features(listing_id);
CREATE INDEX IF NOT EXISTS idx_video_features_tags ON public.video_features USING GIN(tags);

ALTER TABLE public.video_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Video features are viewable by everyone"
ON public.video_features FOR SELECT
USING (true);

-- Adicionar campos faltantes em listings
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS comments_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ranking_score numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS approved boolean DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_listings_ranking_score ON public.listings(ranking_score DESC) WHERE status = 'ativo';
CREATE INDEX IF NOT EXISTS idx_listings_approved ON public.listings(approved) WHERE status = 'ativo';