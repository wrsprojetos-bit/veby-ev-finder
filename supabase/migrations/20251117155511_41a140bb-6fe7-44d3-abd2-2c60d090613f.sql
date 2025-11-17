-- Corrigir a constraint do campo type na tabela listings
-- O app envia 'vendo', 'troco', 'procuro' mas a constraint antiga pode estar bloqueando

ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_type_check;

ALTER TABLE public.listings ADD CONSTRAINT listings_type_check 
  CHECK (type IN ('vendo', 'troco', 'procuro'));