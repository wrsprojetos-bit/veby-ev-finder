import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGeocode } from "./useGeocode";

interface Listing {
  id: string;
  distance_km?: number;
  [key: string]: any;
}

interface UseProximityFeedProps {
  userId?: string;
  userCity?: string;
  userState?: string;
  enabled?: boolean;
}

export const useProximityFeed = ({ 
  userId, 
  userCity, 
  userState,
  enabled = true 
}: UseProximityFeedProps) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [feedMode, setFeedMode] = useState<"local" | "regional" | "national" | "global">("local");
  
  const { getCurrentPosition, geocodeAddress } = useGeocode();
  const PAGE_SIZE = 20;

  // PASSO 5: Obter localização do usuário ao abrir o feed
  useEffect(() => {
    if (!enabled) return;

    const getLocationAtFeedStart = async () => {
      try {
        // Tentar GPS primeiro
        const position = await getCurrentPosition();
        setUserLocation({ lat: position.latitude, lng: position.longitude });
        console.log("📍 Feed: GPS do usuário capturado", position);
      } catch (gpsError) {
        console.warn("⚠️ GPS negado no feed, tentando geocoding do perfil");
        
        // Se GPS falhar, usar cidade/estado do perfil
        if (userCity && userState) {
          try {
            const geocoded = await geocodeAddress(userCity, userState);
            if (geocoded) {
              setUserLocation({ lat: geocoded.latitude, lng: geocoded.longitude });
              console.log("📍 Feed: Geocoding aproximado do perfil", geocoded);
            } else {
              console.log("⚠️ Geocoding falhou, usando feed global");
              setUserLocation(null);
            }
          } catch (geocodeError) {
            console.error("❌ Erro no geocoding:", geocodeError);
            setUserLocation(null);
          }
        } else {
          console.log("ℹ️ Sem localização de perfil, usando feed global");
          setUserLocation(null);
        }
      }
    };

    getLocationAtFeedStart();
  }, [enabled, userCity, userState, getCurrentPosition, geocodeAddress]);

  // PASSO 4: Buscar anúncios com expansão progressiva de raio
  const fetchWithProgressiveRadius = useCallback(async (pageNum: number, isReset: boolean = false) => {
    if (!userLocation) {
      // Sem localização: feed global (sem filtro de distância)
      console.log("🌍 Modo: Feed Global (sem localização do usuário)");
      setFeedMode("global");
      return await fetchGlobalFeed(pageNum, isReset);
    }

    const offset = pageNum * PAGE_SIZE;
    
    // PASSO 4: Lógica de raio progressivo
    // 1. Tentar 20 km
    let { data, count } = await fetchByDistance(20, PAGE_SIZE, offset);
    
    if (count !== null && count < 30 && offset === 0) {
      console.log(`⚠️ Apenas ${count} anúncios em 20km, expandindo para 50km`);
      setFeedMode("local");
      const result50 = await fetchByDistance(50, PAGE_SIZE, offset);
      data = result50.data;
      count = result50.count;
    }
    
    if (count !== null && count < 30 && offset === 0) {
      console.log(`⚠️ Apenas ${count} anúncios em 50km, expandindo para 200km`);
      setFeedMode("regional");
      const result200 = await fetchByDistance(200, PAGE_SIZE, offset);
      data = result200.data;
      count = result200.count;
    }
    
    if (count !== null && count < 30 && offset === 0) {
      console.log(`⚠️ Apenas ${count} anúncios em 200km, usando feed global`);
      setFeedMode("national");
      return await fetchGlobalFeed(pageNum, isReset);
    }

    // Retornar resultados
    if (isReset) {
      setListings(data || []);
    } else {
      setListings(prev => [...prev, ...(data || [])]);
    }
    
    setHasMore((count ?? 0) > (offset + PAGE_SIZE));
    return { data, count };
  }, [userLocation]);

  // Buscar usando função RPC de distância
  const fetchByDistance = async (radiusKm: number, limit: number, offset: number) => {
    if (!userLocation) return { data: [], count: 0 };

    const { data, error } = await supabase
      .rpc('get_listings_by_distance', {
        user_lat: userLocation.lat,
        user_lng: userLocation.lng,
        radius_km: radiusKm,
        p_limit: limit,
        p_offset: offset
      });

    if (error) {
      console.error("Erro ao buscar por distância:", error);
      return { data: [], count: 0 };
    }

    // Buscar perfis separadamente
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((l: any) => l.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id,name,photo_url,location,verified")
        .in("id", userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      const listingsWithProfiles = data.map((listing: any) => ({
        ...listing,
        profiles: profilesMap.get(listing.user_id) || null
      }));

      console.log(`✅ Encontrados ${listingsWithProfiles.length} anúncios dentro de ${radiusKm}km`);
      return { data: listingsWithProfiles, count: listingsWithProfiles.length };
    }

    console.log(`✅ Nenhum anúncio encontrado dentro de ${radiusKm}km`);
    return { data: [], count: 0 };
  };

  // Buscar feed global (sem filtro de distância)
  const fetchGlobalFeed = async (pageNum: number, isReset: boolean) => {
    const offset = pageNum * PAGE_SIZE;

    const query = supabase
      .from("listings")
      .select("*", { count: "exact" })
      .eq("status", "ativo")
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Erro no feed global:", error);
      return { data: [], count: 0 };
    }

    // Buscar perfis separadamente
    let finalData = data || [];
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((l: any) => l.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id,name,photo_url,location,verified")
        .in("id", userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      finalData = data.map((listing: any) => ({
        ...listing,
        profiles: profilesMap.get(listing.user_id) || null
      }));
    }

    if (isReset) {
      setListings(finalData);
    } else {
      setListings(prev => [...prev, ...finalData]);
    }

    setHasMore((count ?? 0) > (offset + PAGE_SIZE));
    return { data: finalData, count };
  };

  // Carregar dados
  useEffect(() => {
    if (!enabled || userLocation === undefined) return;

    const loadInitial = async () => {
      setLoading(true);
      setCurrentPage(0);
      await fetchWithProgressiveRadius(0, true);
      setLoading(false);
    };

    loadInitial();
  }, [enabled, userLocation, fetchWithProgressiveRadius]);

  // Carregar mais
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    await fetchWithProgressiveRadius(nextPage, false);
    setCurrentPage(nextPage);
    setIsLoadingMore(false);
  }, [hasMore, isLoadingMore, currentPage, fetchWithProgressiveRadius]);

  return {
    listings,
    loading,
    isLoadingMore,
    hasMore,
    loadMore,
    feedMode,
    userLocation,
    refetch: () => fetchWithProgressiveRadius(0, true)
  };
};
