import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Listing {
  id: string;
  [key: string]: any;
}

interface UseProximityFeedProps {
  userId?: string;
  enabled?: boolean;
}

export const useProximityFeed = ({ 
  userId, 
  enabled = true 
}: UseProximityFeedProps) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  
  const PAGE_SIZE = 20;
  const isFetchingRef = useRef(false);

  // Buscar feed global (sem filtro de localização)
  const fetchGlobalFeed = useCallback(async (pageNum: number, isReset: boolean) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    const offset = pageNum * PAGE_SIZE;

    try {
      const { data, error, count } = await supabase
        .from("listings")
        .select("*", { count: "exact" })
        .eq("status", "ativo")
        .eq("approved", true)
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

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

      if (isReset) {
        setListings(finalData);
      } else {
        setListings(prev => [...prev, ...finalData]);
      }

      setHasMore((count ?? 0) > (offset + PAGE_SIZE));
    } catch (error) {
      console.error("Erro ao buscar feed global:", error);
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  // Carregar dados iniciais
  useEffect(() => {
    if (!enabled) return;

    const loadInitial = async () => {
      setLoading(true);
      setCurrentPage(0);
      setListings([]);
      await fetchGlobalFeed(0, true);
      setLoading(false);
    };

    loadInitial();
  }, [enabled, fetchGlobalFeed]);

  // Carregar mais
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || isFetchingRef.current) return;

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    await fetchGlobalFeed(nextPage, false);
    setIsLoadingMore(false);
  }, [hasMore, isLoadingMore, currentPage, fetchGlobalFeed]);

  return {
    listings,
    loading,
    isLoadingMore,
    hasMore,
    loadMore,
    refetch: () => fetchGlobalFeed(0, true)
  };
};
