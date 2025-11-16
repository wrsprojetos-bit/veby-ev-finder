-- Criar constraint para type com os valores corretos
ALTER TABLE public.listings 
ADD CONSTRAINT listings_type_check 
CHECK (type = ANY (ARRAY['vendo'::text, 'troco'::text, 'procuro'::text]));