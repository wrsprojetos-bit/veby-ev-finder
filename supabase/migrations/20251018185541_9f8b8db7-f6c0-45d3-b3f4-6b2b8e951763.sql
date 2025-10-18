-- Parte 4: Funções de ranking e feed personalizado
-- Função para recalcular ranking
CREATE OR REPLACE FUNCTION public.recalculate_listing_ranking()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.listings l
  SET ranking_score = (
    COALESCE(l.views, 0) * 0.2 +
    COALESCE(l.likes, 0) * 0.3 +
    COALESCE((
      SELECT COUNT(*)
      FROM public.interactions i
      WHERE i.listing_id = l.id
        AND i.type = 'view'
        AND i.created_at > now() - interval '24 hours'
    ), 0) * 0.3 +
    20 * 0.2
  )
  WHERE l.status = 'ativo';
END;
$$;

-- Função para obter feed personalizado
CREATE OR REPLACE FUNCTION public.get_personalized_feed(
  p_user_id uuid,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  listing_id uuid,
  title text,
  price numeric,
  thumbnail_url text,
  video_preview text,
  ranking_score numeric,
  relevance_score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_city text;
  user_state text;
BEGIN
  SELECT location_city, location_state INTO user_city, user_state
  FROM public.profiles
  WHERE id = p_user_id;

  RETURN QUERY
  SELECT 
    l.id as listing_id,
    l.brand_model as title,
    l.price,
    l.video_thumbnail as thumbnail_url,
    l.video_preview,
    l.ranking_score,
    (
      CASE WHEN l.city = user_city THEN 30 ELSE 0 END +
      CASE WHEN l.state = user_state AND l.city != user_city THEN 15 ELSE 0 END +
      (l.ranking_score * 0.15)
    ) as relevance_score
  FROM public.listings l
  WHERE l.status = 'ativo'
    AND l.approved = true
  ORDER BY relevance_score DESC, l.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;