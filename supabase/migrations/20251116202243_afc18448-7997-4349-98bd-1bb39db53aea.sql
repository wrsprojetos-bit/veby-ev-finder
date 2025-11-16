-- Remover constraints check antigas que conflitam com o novo modelo
ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_type_check;