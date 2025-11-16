-- Remover constraint check antiga da coluna category
ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_category_check;

-- A coluna category agora será usada apenas como texto descritivo, não como filtro principal
-- O filtro principal será tipo_veiculo