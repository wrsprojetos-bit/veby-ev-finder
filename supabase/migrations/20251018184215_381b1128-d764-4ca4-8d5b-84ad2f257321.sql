-- Adicionar campos de thumbnail e preview na tabela listings
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS video_thumbnail text,
ADD COLUMN IF NOT EXISTS video_preview text;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_listings_video_thumbnail ON public.listings(video_thumbnail) WHERE video_thumbnail IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listings_video_preview ON public.listings(video_preview) WHERE video_preview IS NOT NULL;