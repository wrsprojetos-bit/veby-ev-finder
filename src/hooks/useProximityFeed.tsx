import { useState, useEffect, useCallback, useRef } from "react";
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
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null | undefined>(undefined);
  const [feedMode, setFeedMode] = useState<"local" | "regional" | "national" | "global">("local");
  
  const { getCurrentPosition, geocodeAddress } = useGeocode();
  const PAGE_SIZE = 20;
  const isFetchingRef = useRef(false);

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
          console.log("🌍 Sem localização de perfil, ativando feed global");
          setUserLocation(null);
        }
      }
    };

    getLocationAtFeedStart();
  }, [enabled, userCity, userState]);

  // Helper: Buscar por distância
  const fetchByDistance = useCallback(async (radiusKm: number, limit: number, offset: number) => {
    if (!userLocation) return { data: [], count: 0 };

    try {
      const { data, error } = await supabase
        .rpc("get_listings_by_distance", {
          user_lat: userLocation.lat,
          user_lng: userLocation.lng,
          radius_km: radiusKm,
          p_limit: limit,
          p_offset: offset
        });

      if (error) throw error;

      // Buscar perfis separadamente
      const baseListings = data || [];
      let finalData = baseListings;
      
      if (baseListings.length > 0) {
        const userIds = [...new Set(baseListings.map((l: any) => l.user_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id,name,photo_url,location,verified")
          .in("id", userIds);
        
        const profilesMap = new Map((profilesData || []).map((p: any) => [p.id, p]));
        finalData = baseListings.map((l: any) => ({
          ...l,
          profiles: profilesMap.get(l.user_id) || null,
        }));
      }

      return { data: finalData, count: finalData.length };
    } catch (error) {
      console.error(`Erro ao buscar anúncios (${radiusKm}km):`, error);
      return { data: [], count: 0 };
    }
  }, [userLocation]);

  // Helper: Buscar feed global (sem filtro de distância)
  const fetchGlobalFeed = useCallback(async (pageNum: number, isReset: boolean) => {
    const offset = pageNum * PAGE_SIZE;

    console.log("🌍 BUSCANDO FEED GLOBAL", { pageNum, offset, isReset });

    try {
      const { data, error, count } = await supabase
        .from("listings")
        .select("*", { count: "exact" })
        .eq("status", "ativo")
        .eq("approved", true)
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) throw error;

      console.log("📊 QUERY RESULT", {
        count: data?.length || 0,
        firstListing: data?.[0] ? {
          id: data[0].id,
          brand: data[0].brand_model,
          created_at: data[0].created_at,
          video_url: data[0].video_url?.substring(0, 60)
        } : null
      });

      // Buscar perfis separadamente
      const baseListings = data || [];
      let finalData = baseListings;
      
      if (baseListings.length > 0) {
        const userIds = [...new Set(baseListings.map((l: any) => l.user_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id,name,photo_url,location,verified")
          .in("id", userIds);
        
        const profilesMap = new Map((profilesData || []).map((p: any) => [p.id, p]));
        finalData = baseListings.map((l: any) => ({
          ...l,
          profiles: profilesMap.get(l.user_id) || null,
        }));
      }

      // Debug dos vídeos carregados
      console.log("📦 FEED_LOADED", {
        count: finalData.length,
        r2Videos: finalData.filter((l: any) => 
          l.video_url?.includes('r2.dev') || 
          l.video_url?.includes('r2.cloudflarestorage') || 
          l.video_url?.includes('pub-')
        ).length,
        sample: finalData.slice(0, 3).map((l: any) => ({
          id: l.id,
          brand: l.brand_model,
          hasVideo: !!l.video_url,
          videoUrl: l.video_url?.substring(0, 50)
        }))
      });

      if (isReset) {
        setListings(finalData);
      } else {
        setListings(prev => [...prev, ...finalData]);
      }

      setHasMore((count ?? 0) > (offset + PAGE_SIZE));
      return { data: finalData, count: count ?? 0 };
    } catch (error) {
      console.error("Erro ao buscar feed global:", error);
      return { data: [], count: 0 };
    }
  }, []);

  // PASSO 4: Buscar anúncios com expansão progressiva de raio
  const fetchWithProgressiveRadius = useCallback(async (pageNum: number, isReset: boolean = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      if (!userLocation) {
        console.log("🌍 Modo: Feed Global (sem localização do usuário)");
        setFeedMode("global");
        await fetchGlobalFeed(pageNum, isReset);
        return;
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
        await fetchGlobalFeed(pageNum, isReset);
        return;
      }
      
      if (isReset) {
        setListings(data || []);
      } else {
        setListings(prev => [...prev, ...(data || [])]);
      }

      setHasMore((count ?? 0) > (offset + PAGE_SIZE));
    } finally {
      isFetchingRef.current = false;
    }
  }, [userLocation, fetchByDistance, fetchGlobalFeed]);

  // Carregar dados iniciais
  useEffect(() => {
    if (!enabled) return;
    
    // Esperar até que userLocation seja definido (null ou objeto com lat/lng)
    if (userLocation === undefined) {
      console.log("⏳ Aguardando definição de localização...");
      return;
    }

    const loadInitial = async () => {
      console.log("🔄 INICIANDO CARREGAMENTO DO FEED");
      setLoading(true);
      setCurrentPage(0);
      setListings([]);
      await fetchWithProgressiveRadius(0, true);
      setLoading(false);
      console.log("✅ FEED CARREGADO");
    };

    loadInitial();
  }, [enabled, userLocation, fetchWithProgressiveRadius]);

  // Carregar mais
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || isFetchingRef.current) return;

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    await fetchWithProgressiveRadius(nextPage, false);
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
