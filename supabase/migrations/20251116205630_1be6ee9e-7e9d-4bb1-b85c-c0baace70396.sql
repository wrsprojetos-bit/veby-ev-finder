-- PASSO 1: Adicionar latitude/longitude na tabela listings
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision;

-- Criar índice para otimizar buscas geográficas
CREATE INDEX IF NOT EXISTS idx_listings_lat_lng ON public.listings(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- PASSO 3: Criar função RPC para cálculo de distância com Haversine
CREATE OR REPLACE FUNCTION public.get_listings_by_distance(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision DEFAULT 50,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  type text,
  category text,
  brand_model text,
  marca text,
  modelo text,
  ano integer,
  price numeric,
  description text,
  video_url text,
  video_thumbnail text,
  video_preview text,
  thumbnail_url text,
  images text[],
  location text,
  state text,
  city text,
  bairro text,
  accepts_trade boolean,
  views integer,
  likes integer,
  status text,
  created_at timestamp with time zone,
  approved boolean,
  tipo_veiculo vehicle_type,
  quilometragem_km integer,
  capacidade_bateria text,
  autonomia_km integer,
  potencia_motor text,
  tempo_carga_horas text,
  estado_conservacao conservation_state,
  documentacao_em_dia boolean,
  licenciado boolean,
  unico_dono boolean,
  inclui_carregador boolean,
  inclui_segunda_bateria boolean,
  tags text[],
  latitude double precision,
  longitude double precision,
  distance_km double precision,
  engagement_score numeric,
  ranking_score numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.user_id,
    l.type,
    l.category,
    l.brand_model,
    l.marca,
    l.modelo,
    l.ano,
    l.price,
    l.description,
    l.video_url,
    l.video_thumbnail,
    l.video_preview,
    l.thumbnail_url,
    l.images,
    l.location,
    l.state,
    l.city,
    l.bairro,
    l.accepts_trade,
    l.views,
    l.likes,
    l.status,
    l.created_at,
    l.approved,
    l.tipo_veiculo,
    l.quilometragem_km,
    l.capacidade_bateria,
    l.autonomia_km,
    l.potencia_motor,
    l.tempo_carga_horas,
    l.estado_conservacao,
    l.documentacao_em_dia,
    l.licenciado,
    l.unico_dono,
    l.inclui_carregador,
    l.inclui_segunda_bateria,
    l.tags,
    l.latitude,
    l.longitude,
    -- Cálculo de distância Haversine em km
    (6371 * acos(
      cos(radians(user_lat)) * cos(radians(l.latitude)) *
      cos(radians(l.longitude) - radians(user_lng)) +
      sin(radians(user_lat)) * sin(radians(l.latitude))
    ))::double precision AS distance_km,
    l.engagement_score,
    l.ranking_score
  FROM public.listings l
  WHERE l.status = 'ativo'
    AND l.approved = true
    AND l.latitude IS NOT NULL
    AND l.longitude IS NOT NULL
    -- Filtro de raio usando Haversine
    AND (6371 * acos(
      cos(radians(user_lat)) * cos(radians(l.latitude)) *
      cos(radians(l.longitude) - radians(user_lng)) +
      sin(radians(user_lat)) * sin(radians(l.latitude))
    )) <= radius_km
  ORDER BY distance_km ASC, l.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;