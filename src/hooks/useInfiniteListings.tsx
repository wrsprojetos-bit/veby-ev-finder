import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseInfiniteListingsProps {
  selectedCategory?: string;
  selectedState?: string | null;
  selectedCity?: string | null;
  searchQuery?: string;
  onCategoryView?: (category: string) => void;
  onSearchAdd?: (query: string) => void;
  userId?: string | null;
}

const LIMIT = 20;

export const useInfiniteListings = ({
  selectedCategory = "Todos",
  selectedState,
  selectedCity,
  searchQuery,
  onCategoryView,
  onSearchAdd,
  userId,
}: UseInfiniteListingsProps) => {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  
  const filtersRef = useRef({
    selectedCategory,
    selectedState,
    selectedCity,
    searchQuery,
  });

  // Detecta mudança de filtros e reseta
  useEffect(() => {
    const currentFilters = {
      selectedCategory,
      selectedState,
      selectedCity,
      searchQuery,
    };

    const filtersChanged = JSON.stringify(filtersRef.current) !== JSON.stringify(currentFilters);

    if (filtersChanged) {
      filtersRef.current = currentFilters;
      setPage(0);
      setListings([]);
      setHasMore(true);
      fetchListings(0, true);
    }
  }, [selectedCategory, selectedState, selectedCity, searchQuery]);

  const fetchListings = async (pageNum: number, isReset: boolean = false) => {
    try {
      if (isReset) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const offset = pageNum * LIMIT;

      let query = supabase
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
        .eq("status", "ativo");

      // Filtro por categoria
      if (selectedCategory !== "Todos") {
        query = query.eq("category", selectedCategory);
        if (userId && onCategoryView) onCategoryView(selectedCategory);
      }

      // Filtro por estado
      if (selectedState) {
        query = query.eq("state", selectedState);
      }

      // Filtro por cidade
      if (selectedCity) {
        query = query.eq("city", selectedCity);
      }

      // Busca por texto
      if (searchQuery) {
        query = query.or(`brand_model.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
        if (userId && onSearchAdd) onSearchAdd(searchQuery);
      }

      const { data, error } = await query
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(offset, offset + LIMIT - 1);

      if (error) throw error;

      const newListings = data || [];
      
      if (isReset) {
        setListings(newListings);
      } else {
        setListings((prev) => [...prev, ...newListings]);
      }

      // Se retornou menos que LIMIT, acabou
      setHasMore(newListings.length === LIMIT);
      
    } catch (error) {
      console.error("Erro ao carregar anúncios:", error);
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
    fetchListings(nextPage, false);
  }, [page, isLoadingMore, hasMore, loading]);

  // Carregamento inicial
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchListings(0, true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  return {
    listings,
    loading,
    isLoadingMore,
    hasMore,
    loadMore,
  };
};
