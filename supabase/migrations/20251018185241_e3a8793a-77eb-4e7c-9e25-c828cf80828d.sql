-- Parte 3: Funções principais do backend
-- Função para atualizar preferências automaticamente
CREATE OR REPLACE FUNCTION public.update_user_preferences_on_interaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  listing_category text;
BEGIN
  SELECT category INTO listing_category
  FROM public.listings
  WHERE id = NEW.listing_id;

  IF NEW.type = 'view' THEN
    UPDATE public.user_preferences
    SET 
      view_count_per_category = jsonb_set(
        COALESCE(view_count_per_category, '{}'::jsonb),
        ARRAY[listing_category],
        to_jsonb(COALESCE((view_count_per_category->listing_category)::int, 0) + 1)
      ),
      updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;

  IF NEW.type = 'like' THEN
    UPDATE public.user_preferences
    SET 
      liked_listings = array_append(
        COALESCE(liked_listings, ARRAY[]::uuid[]),
        NEW.listing_id
      ),
      updated_at = now()
    WHERE user_id = NEW.user_id
      AND NOT (NEW.listing_id = ANY(COALESCE(liked_listings, ARRAY[]::uuid[])));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_preferences ON public.interactions;
CREATE TRIGGER trigger_update_preferences
AFTER INSERT ON public.interactions
FOR EACH ROW
EXECUTE FUNCTION public.update_user_preferences_on_interaction();

-- Função para atualizar contadores em listings
CREATE OR REPLACE FUNCTION public.update_listing_counters()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.type = 'view' THEN
    UPDATE public.listings
    SET views = COALESCE(views, 0) + 1
    WHERE id = NEW.listing_id;
  END IF;

  IF NEW.type = 'like' THEN
    UPDATE public.listings
    SET likes = COALESCE(likes, 0) + 1
    WHERE id = NEW.listing_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_counters ON public.interactions;
CREATE TRIGGER trigger_update_counters
AFTER INSERT ON public.interactions
FOR EACH ROW
EXECUTE FUNCTION public.update_listing_counters();