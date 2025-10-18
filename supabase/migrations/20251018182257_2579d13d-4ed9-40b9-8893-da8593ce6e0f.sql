-- Adicionar campos de localização nos perfis
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS location_state TEXT,
ADD COLUMN IF NOT EXISTS location_city TEXT,
ADD COLUMN IF NOT EXISTS location_lat NUMERIC,
ADD COLUMN IF NOT EXISTS location_lng NUMERIC;

-- Criar tabela de preferências do usuário
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  favorite_categories TEXT[] DEFAULT '{}',
  recent_searches TEXT[] DEFAULT '{}',
  liked_listings UUID[] DEFAULT '{}',
  view_count_per_category JSONB DEFAULT '{}',
  last_filter JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies para user_preferences
CREATE POLICY "Users can view their own preferences"
ON public.user_preferences
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
ON public.user_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
ON public.user_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_listings_location_city ON public.listings(city);
CREATE INDEX IF NOT EXISTS idx_listings_location_state ON public.listings(state);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(location_state, location_city);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION update_user_preferences_updated_at();

-- Comentários para documentação
COMMENT ON TABLE public.user_preferences IS 'Armazena preferências e histórico de comportamento do usuário';
COMMENT ON COLUMN public.profiles.location_state IS 'Estado do usuário para personalização do feed';
COMMENT ON COLUMN public.profiles.location_city IS 'Cidade do usuário para personalização do feed';
COMMENT ON COLUMN public.profiles.location_lat IS 'Latitude para geolocalização';
COMMENT ON COLUMN public.profiles.location_lng IS 'Longitude para geolocalização';