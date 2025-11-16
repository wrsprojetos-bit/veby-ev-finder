-- Criar enum para tipos de veículos elétricos
CREATE TYPE vehicle_type AS ENUM (
  'bike_eletrica',
  'patinete_eletrico',
  'scooter_eletrica',
  'moto_eletrica',
  'carro_eletrico_ou_hibrido_plug_in',
  'hoverboard_skate_eletrico',
  'monociclo_eletrico',
  'quadriciclo_kart_eletrico',
  'outro_eletrico_pessoal'
);

-- Criar enum para estado de conservação
CREATE TYPE conservation_state AS ENUM (
  'novo',
  'seminovo',
  'usado'
);

-- Adicionar novas colunas na tabela listings para veículos elétricos
ALTER TABLE public.listings
ADD COLUMN tipo_veiculo vehicle_type,
ADD COLUMN marca text,
ADD COLUMN modelo text,
ADD COLUMN ano integer,
ADD COLUMN quilometragem_km integer,
ADD COLUMN capacidade_bateria text,
ADD COLUMN autonomia_km integer,
ADD COLUMN potencia_motor text,
ADD COLUMN tempo_carga_horas text,
ADD COLUMN estado_conservacao conservation_state,
ADD COLUMN documentacao_em_dia boolean,
ADD COLUMN licenciado boolean,
ADD COLUMN unico_dono boolean,
ADD COLUMN bairro text,
ADD COLUMN inclui_carregador boolean DEFAULT false,
ADD COLUMN inclui_segunda_bateria boolean DEFAULT false;

-- Adicionar índices para melhorar performance nas buscas
CREATE INDEX idx_listings_tipo_veiculo ON public.listings(tipo_veiculo);
CREATE INDEX idx_listings_ano ON public.listings(ano);
CREATE INDEX idx_listings_autonomia_km ON public.listings(autonomia_km);
CREATE INDEX idx_listings_estado_conservacao ON public.listings(estado_conservacao);

-- Comentários para documentação
COMMENT ON COLUMN public.listings.tipo_veiculo IS 'Tipo de veículo elétrico';
COMMENT ON COLUMN public.listings.marca IS 'Marca do veículo';
COMMENT ON COLUMN public.listings.modelo IS 'Modelo do veículo';
COMMENT ON COLUMN public.listings.ano IS 'Ano de fabricação';
COMMENT ON COLUMN public.listings.quilometragem_km IS 'Quilometragem em km';
COMMENT ON COLUMN public.listings.capacidade_bateria IS 'Capacidade da bateria (ex: 48V 20Ah)';
COMMENT ON COLUMN public.listings.autonomia_km IS 'Autonomia estimada em km';
COMMENT ON COLUMN public.listings.potencia_motor IS 'Potência do motor (ex: 350W)';
COMMENT ON COLUMN public.listings.tempo_carga_horas IS 'Tempo de carga em horas';
COMMENT ON COLUMN public.listings.estado_conservacao IS 'Estado de conservação do veículo';
COMMENT ON COLUMN public.listings.documentacao_em_dia IS 'Documentação em dia (true/false)';
COMMENT ON COLUMN public.listings.licenciado IS 'Veículo licenciado (true/false)';
COMMENT ON COLUMN public.listings.unico_dono IS 'Único dono (true/false)';
COMMENT ON COLUMN public.listings.bairro IS 'Bairro do veículo';
COMMENT ON COLUMN public.listings.inclui_carregador IS 'Inclui carregador';
COMMENT ON COLUMN public.listings.inclui_segunda_bateria IS 'Inclui segunda bateria';