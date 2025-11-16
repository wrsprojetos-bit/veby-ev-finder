import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const LIMIT = 20;

interface ListingWithScore extends Record<string, any> {
  id: string;
  engagement_score: number;
  relevance_score?: number;
}

export const useInfiniteRecommendations = (userCity?: string, userState?: string, userId?: string) => {
  const [recommendations, setRecommendations] = useState<ListingWithScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const locationRef = useRef({ userCity, userState });

  // Detecta mudança de localização e reseta
  useEffect(() => {
    const currentLocation = { userCity, userState };
    const locationChanged = JSON.stringify(locationRef.current) !== JSON.stringify(currentLocation);

    if (locationChanged) {
      locationRef.current = currentLocation;
      setPage(0);
      setRecommendations([]);
      setHasMore(true);
      fetchRecommendations(0, true);
    }
  }, [userCity, userState]);

  const calculateRelevanceScore = (listing: any): number => {
    let score = 0;

    // Boost por localização
    if (userCity && listing.city === userCity) score += 30;
    else if (userState && listing.state === userState) score += 15;

    // Boost por engajamento
    const engagementScore = listing.engagement_score || 0;
    score += Math.min(engagementScore * 0.5, 25);

    // Boost por recência (últimos 7 dias ganham mais pontos)
    const daysSinceCreation = listing.created_at
      ? Math.floor((Date.now() - new Date(listing.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    
    if (daysSinceCreation <= 7) score += 20;
    else if (daysSinceCreation <= 30) score += 10;

    return score;
  };

  const fetchRecommendations = async (pageNum: number, isReset: boolean = false) => {
    try {
      if (isReset) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const offset = pageNum * LIMIT;

      const { data: listings, error } = await supabase
        .from("listings")
        .select(`
          *,
          profiles:user_id (
            name,
            photo_url,
            location,
            verified
          )
        `)
        .eq("status", "ativo")
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(offset, offset + LIMIT - 1);

      if (error) throw error;

      if (!listings || listings.length === 0) {
        setHasMore(false);
        if (isReset) setRecommendations([]);
        return;
      }

      // Calcular scores de relevância
      const listingsWithScores: ListingWithScore[] = listings.map((listing) => ({
        ...listing,
        relevance_score: calculateRelevanceScore(listing),
      }));

      // Ordenar por relevância
      listingsWithScores.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));

      if (isReset) {
        setRecommendations(listingsWithScores);
      } else {
        setRecommendations((prev) => [...prev, ...listingsWithScores]);
      }

      // Se retornou menos que LIMIT, acabou
      setHasMore(listings.length === LIMIT);

    } catch (error) {
      console.error("Erro ao carregar recomendações:", error);
      setHasMore(false);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore || loading) return;
    
    const nextPage = page + 1;
    setPage(nextPage);
    fetchRecommendations(nextPage, false);
  }, [page, isLoadingMore, hasMore, loading]);

  // Carregamento inicial
  useEffect(() => {
    fetchRecommendations(0, true);
  }, []);

  return {
    recommendations,
    loading,
    isLoadingMore,
    hasMore,
    loadMore,
    refetch: () => {
      setPage(0);
      setRecommendations([]);
      setHasMore(true);
      fetchRecommendations(0, true);
    },
  };
};
