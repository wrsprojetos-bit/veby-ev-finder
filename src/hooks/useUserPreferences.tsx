import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface UserPreferences {
  favorite_categories: string[];
  recent_searches: string[];
  liked_listings: string[];
  view_count_per_category: Record<string, number>;
  last_filter: any;
}

export const useUserPreferences = () => {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const { user } = useAuth();

  // Carregar preferências
  const loadPreferences = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setPreferences({
        favorite_categories: data.favorite_categories || [],
        recent_searches: data.recent_searches || [],
        liked_listings: data.liked_listings || [],
        view_count_per_category: (data.view_count_per_category as Record<string, number>) || {},
        last_filter: data.last_filter || {},
      });
    } else {
      // Criar preferências iniciais
      const { data: newPrefs } = await supabase
        .from('user_preferences')
        .insert({
          user_id: user.id,
          favorite_categories: [],
          recent_searches: [],
          liked_listings: [],
          view_count_per_category: {},
          last_filter: {},
        })
        .select()
        .single();
      
      if (newPrefs) {
        setPreferences({
          favorite_categories: [],
          recent_searches: [],
          liked_listings: [],
          view_count_per_category: {},
          last_filter: {},
        });
      }
    }
  };

  // Registrar visualização de categoria
  const trackCategoryView = async (category: string) => {
    if (!user || !preferences) return;

    const currentCount = preferences.view_count_per_category[category] || 0;
    const updatedCounts = {
      ...preferences.view_count_per_category,
      [category]: currentCount + 1,
    };

    await supabase
      .from('user_preferences')
      .update({ view_count_per_category: updatedCounts })
      .eq('user_id', user.id);

    setPreferences({ ...preferences, view_count_per_category: updatedCounts });
  };

  // Adicionar busca recente
  const addRecentSearch = async (query: string) => {
    if (!user || !preferences || !query.trim()) return;

    const searches = [query, ...preferences.recent_searches.filter(s => s !== query)].slice(0, 10);

    await supabase
      .from('user_preferences')
      .update({ recent_searches: searches })
      .eq('user_id', user.id);

    setPreferences({ ...preferences, recent_searches: searches });
  };

  // Adicionar anúncio curtido
  const addLikedListing = async (listingId: string) => {
    if (!user || !preferences) return;

    const liked = [...new Set([...preferences.liked_listings, listingId])];

    await supabase
      .from('user_preferences')
      .update({ liked_listings: liked })
      .eq('user_id', user.id);

    setPreferences({ ...preferences, liked_listings: liked });
  };

  // Salvar último filtro
  const saveLastFilter = async (filter: any) => {
    if (!user) return;

    await supabase
      .from('user_preferences')
      .update({ last_filter: filter })
      .eq('user_id', user.id);

    if (preferences) {
      setPreferences({ ...preferences, last_filter: filter });
    }
  };

  // Obter categorias favoritas (top 3 mais visualizadas)
  const getFavoriteCategories = () => {
    if (!preferences) return [];

    const sorted = Object.entries(preferences.view_count_per_category)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);

    return sorted;
  };

  useEffect(() => {
    loadPreferences();
  }, [user]);

  return {
    preferences,
    trackCategoryView,
    addRecentSearch,
    addLikedListing,
    saveLastFilter,
    getFavoriteCategories,
    loadPreferences,
  };
};
