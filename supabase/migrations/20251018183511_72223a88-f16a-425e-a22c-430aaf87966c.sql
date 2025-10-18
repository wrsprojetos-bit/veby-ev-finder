-- Remover triggers primeiro, depois a função, e recriar tudo corretamente
DROP TRIGGER IF EXISTS update_engagement_on_like ON public.likes;
DROP TRIGGER IF EXISTS update_engagement_on_favorite ON public.favorites;
DROP FUNCTION IF EXISTS update_listing_engagement() CASCADE;

-- Recriar a função com search_path correto
CREATE OR REPLACE FUNCTION update_listing_engagement()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
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
$$;

-- Recriar os triggers
CREATE TRIGGER update_engagement_on_like
AFTER INSERT OR DELETE ON public.likes
FOR EACH ROW
EXECUTE FUNCTION update_listing_engagement();

CREATE TRIGGER update_engagement_on_favorite
AFTER INSERT OR DELETE ON public.favorites
FOR EACH ROW
EXECUTE FUNCTION update_listing_engagement();