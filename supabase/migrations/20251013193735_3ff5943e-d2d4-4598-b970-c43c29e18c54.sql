-- Atualizar políticas RLS para permitir visualização pública

-- Listings: permitir SELECT público para anúncios ativos
DROP POLICY IF EXISTS "Anúncios ativos são visíveis por todos" ON public.listings;
CREATE POLICY "Anúncios ativos são visíveis por todos" 
ON public.listings 
FOR SELECT 
USING (status = 'ativo');

-- Profiles: permitir SELECT público (modo limitado)
DROP POLICY IF EXISTS "Perfis são visíveis por todos" ON public.profiles;
CREATE POLICY "Perfis são visíveis por todos" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Featured listings: já está público
-- Ratings: já está público