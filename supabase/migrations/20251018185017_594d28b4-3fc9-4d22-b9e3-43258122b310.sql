-- Parte 1: Criar tabela interactions
CREATE TABLE IF NOT EXISTS public.interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('view', 'like', 'comment', 'share')),
  duration integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON public.interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_listing_id ON public.interactions(listing_id);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON public.interactions(type);

ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own interactions"
ON public.interactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own interactions"
ON public.interactions FOR INSERT
WITH CHECK (auth.uid() = user_id);