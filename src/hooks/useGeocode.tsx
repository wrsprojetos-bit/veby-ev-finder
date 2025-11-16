import { useState } from "react";

interface GeocodeResult {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
}

export const useGeocode = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Geocodifica endereço usando Nominatim (OpenStreetMap) - API gratuita
  const geocodeAddress = async (city: string, state: string): Promise<GeocodeResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const query = `${city}, ${state}, Brasil`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
        {
          headers: {
            'User-Agent': 'VEBY-App/1.0' // Nominatim requer User-Agent
          }
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao buscar coordenadas");
      }

      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        return {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          city,
          state
        };
      }

      throw new Error("Localização não encontrada");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMessage);
      console.error("Erro no geocoding:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Pega coordenadas GPS do navegador
  const getCurrentPosition = (): Promise<GeocodeResult> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocalização não suportada"));
        return;
      }

      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLoading(false);
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (err) => {
          setLoading(false);
          setError("Permissão de localização negada");
          reject(err);
        },
        {
          timeout: 10000,
          maximumAge: 300000, // 5 minutos
          enableHighAccuracy: true
        }
      );
    });
  };

  return {
    geocodeAddress,
    getCurrentPosition,
    loading,
    error
  };
};
