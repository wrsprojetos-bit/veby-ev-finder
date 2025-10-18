import { useState, useEffect } from "react";

// Lista simplificada de cidades principais por estado
const CITIES_BY_STATE: Record<string, string[]> = {
  "SP": ["São Paulo", "Campinas", "Santos", "Ribeirão Preto", "Sorocaba", "São José dos Campos"],
  "RJ": ["Rio de Janeiro", "Niterói", "Duque de Caxias", "Nova Iguaçu", "Petrópolis"],
  "MG": ["Belo Horizonte", "Uberlândia", "Contagem", "Juiz de Fora", "Betim"],
  "BA": ["Salvador", "Feira de Santana", "Vitória da Conquista", "Camaçari", "Itabuna"],
  "PR": ["Curitiba", "Londrina", "Maringá", "Ponta Grossa", "Cascavel"],
  "RS": ["Porto Alegre", "Caxias do Sul", "Pelotas", "Canoas", "Santa Maria"],
  "PE": ["Recife", "Jaboatão dos Guararapes", "Olinda", "Caruaru", "Petrolina"],
  "CE": ["Fortaleza", "Caucaia", "Juazeiro do Norte", "Maracanaú", "Sobral"],
  "PA": ["Belém", "Ananindeua", "Santarém", "Marabá", "Castanhal"],
  "SC": ["Florianópolis", "Joinville", "Blumenau", "São José", "Chapecó"],
  "GO": ["Goiânia", "Aparecida de Goiânia", "Anápolis", "Rio Verde", "Luziânia"],
  "MA": ["São Luís", "Imperatriz", "São José de Ribamar", "Timon", "Caxias"],
  "ES": ["Vitória", "Vila Velha", "Serra", "Cariacica", "Linhares"],
  "PB": ["João Pessoa", "Campina Grande", "Santa Rita", "Patos", "Bayeux"],
  "RN": ["Natal", "Mossoró", "Parnamirim", "São Gonçalo do Amarante", "Macaíba"],
  "MT": ["Cuiabá", "Várzea Grande", "Rondonópolis", "Sinop", "Tangará da Serra"],
  "AL": ["Maceió", "Arapiraca", "Palmeira dos Índios", "Rio Largo", "União dos Palmares"],
  "PI": ["Teresina", "Parnaíba", "Picos", "Piripiri", "Floriano"],
  "DF": ["Brasília", "Taguatinga", "Ceilândia", "Samambaia", "Planaltina"],
  "MS": ["Campo Grande", "Dourados", "Três Lagoas", "Corumbá", "Ponta Porã"],
  "SE": ["Aracaju", "Nossa Senhora do Socorro", "Lagarto", "Itabaiana", "Estância"],
  "RO": ["Porto Velho", "Ji-Paraná", "Ariquemes", "Vilhena", "Cacoal"],
  "TO": ["Palmas", "Araguaína", "Gurupi", "Porto Nacional", "Paraíso do Tocantins"],
  "AC": ["Rio Branco", "Cruzeiro do Sul", "Sena Madureira", "Tarauacá", "Feijó"],
  "AM": ["Manaus", "Parintins", "Itacoatiara", "Manacapuru", "Coari"],
  "RR": ["Boa Vista", "Rorainópolis", "Caracaraí", "Alto Alegre", "Mucajaí"],
  "AP": ["Macapá", "Santana", "Laranjal do Jari", "Oiapoque", "Mazagão"]
};

export const useCities = (state: string | null) => {
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    if (state && CITIES_BY_STATE[state]) {
      setCities(CITIES_BY_STATE[state]);
    } else {
      setCities([]);
    }
  }, [state]);

  return cities;
};
