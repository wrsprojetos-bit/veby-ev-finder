// Tipos de veículos elétricos permitidos no VEBY
export const VEHICLE_TYPES = {
  bike_eletrica: "Bike elétrica",
  patinete_eletrico: "Patinete elétrico",
  scooter_eletrica: "Scooter elétrica",
  moto_eletrica: "Moto elétrica",
  carro_eletrico_ou_hibrido_plug_in: "Carro elétrico / híbrido plug-in",
  hoverboard_skate_eletrico: "Hoverboard / Skate elétrico",
  monociclo_eletrico: "Monociclo elétrico",
  quadriciclo_kart_eletrico: "Quadriciclo / Kart elétrico",
  outro_eletrico_pessoal: "Outros elétricos"
} as const;

export type VehicleType = keyof typeof VEHICLE_TYPES;

// Estados de conservação
export const CONSERVATION_STATES = {
  novo: "Novo",
  seminovo: "Seminovo",
  usado: "Usado"
} as const;

export type ConservationState = keyof typeof CONSERVATION_STATES;

// Mapeamento legado (para compatibilidade com código antigo)
export const CATEGORIES = {
  "Veículos Elétricos": Object.values(VEHICLE_TYPES)
};

export const BRAZILIAN_STATES = [
  { uf: "AC", name: "Acre" },
  { uf: "AL", name: "Alagoas" },
  { uf: "AP", name: "Amapá" },
  { uf: "AM", name: "Amazonas" },
  { uf: "BA", name: "Bahia" },
  { uf: "CE", name: "Ceará" },
  { uf: "DF", name: "Distrito Federal" },
  { uf: "ES", name: "Espírito Santo" },
  { uf: "GO", name: "Goiás" },
  { uf: "MA", name: "Maranhão" },
  { uf: "MT", name: "Mato Grosso" },
  { uf: "MS", name: "Mato Grosso do Sul" },
  { uf: "MG", name: "Minas Gerais" },
  { uf: "PA", name: "Pará" },
  { uf: "PB", name: "Paraíba" },
  { uf: "PR", name: "Paraná" },
  { uf: "PE", name: "Pernambuco" },
  { uf: "PI", name: "Piauí" },
  { uf: "RJ", name: "Rio de Janeiro" },
  { uf: "RN", name: "Rio Grande do Norte" },
  { uf: "RS", name: "Rio Grande do Sul" },
  { uf: "RO", name: "Rondônia" },
  { uf: "RR", name: "Roraima" },
  { uf: "SC", name: "Santa Catarina" },
  { uf: "SP", name: "São Paulo" },
  { uf: "SE", name: "Sergipe" },
  { uf: "TO", name: "Tocantins" }
];
