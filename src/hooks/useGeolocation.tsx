import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface LocationData {
  state: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
}

export const useGeolocation = () => {
  const [location, setLocation] = useState<LocationData>({
    state: null,
    city: null,
    lat: null,
    lng: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Converter coordenadas em cidade/estado usando API do IBGE
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      // Usar API do IBGE para converter coordenadas
      const response = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/municipios`
      );
      const municipios = await response.json();
      
      // Encontrar município mais próximo (simplificado - em produção usar serviço de geocoding)
      // Por enquanto, vamos usar localStorage para simular
      const storedLocation = localStorage.getItem('userLocation');
      if (storedLocation) {
        return JSON.parse(storedLocation);
      }
      
      // Fallback: São Paulo como padrão
      return { state: 'SP', city: 'São Paulo' };
    } catch (err) {
      console.error('Erro ao converter coordenadas:', err);
      return { state: 'SP', city: 'São Paulo' };
    }
  };

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      setError("Geolocalização não suportada pelo navegador");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const { state, city } = await reverseGeocode(latitude, longitude);

        const locationData = {
          state,
          city,
          lat: latitude,
          lng: longitude,
        };

        setLocation(locationData);
        
        // Salvar no perfil do usuário se estiver logado
        if (user) {
          await supabase
            .from('profiles')
            .update({
              location_state: state,
              location_city: city,
              location_lat: latitude,
              location_lng: longitude,
            })
            .eq('id', user.id);
        }
        
        // Salvar no localStorage
        localStorage.setItem('userLocation', JSON.stringify({ state, city }));
        setLoading(false);
      },
      (err) => {
        setError("Permissão de localização negada");
        setLoading(false);
        console.error(err);
      }
    );
  };

  const updateLocation = async (state: string, city: string) => {
    setLocation({ state, city, lat: null, lng: null });
    
    if (user) {
      await supabase
        .from('profiles')
        .update({
          location_state: state,
          location_city: city,
        })
        .eq('id', user.id);
    }
    
    localStorage.setItem('userLocation', JSON.stringify({ state, city }));
  };

  // Carregar localização salva
  useEffect(() => {
    const loadSavedLocation = async () => {
      // Tentar carregar do perfil
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('location_state, location_city, location_lat, location_lng')
          .eq('id', user.id)
          .maybeSingle();
        
        if (data?.location_state && data?.location_city) {
          setLocation({
            state: data.location_state,
            city: data.location_city,
            lat: data.location_lat,
            lng: data.location_lng,
          });
          return;
        }
      }
      
      // Tentar carregar do localStorage
      const stored = localStorage.getItem('userLocation');
      if (stored) {
        const { state, city } = JSON.parse(stored);
        setLocation({ state, city, lat: null, lng: null });
      }
    };

    loadSavedLocation();
  }, [user]);

  return {
    location,
    loading,
    error,
    requestLocation,
    updateLocation,
  };
};
