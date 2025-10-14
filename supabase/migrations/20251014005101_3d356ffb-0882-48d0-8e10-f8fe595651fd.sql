-- Tabela de curtidas (likes)
CREATE TABLE public.likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  listing_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

-- Tabela de favoritos
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  listing_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

-- Enable RLS
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies para likes
CREATE POLICY "Usuários podem ver todas as curtidas"
  ON public.likes FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem curtir anúncios"
  ON public.likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem remover suas curtidas"
  ON public.likes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies para favoritos
CREATE POLICY "Usuários podem ver todos os favoritos"
  ON public.favorites FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem favoritar anúncios"
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem remover seus favoritos"
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);