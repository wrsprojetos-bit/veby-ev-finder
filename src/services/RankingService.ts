import { supabase } from "@/integrations/supabase/client";

export const RankingService = {
  /**
   * Recalcula o ranking de todos os anúncios ativos
   * Deve ser chamado periodicamente (a cada 15 minutos via cron)
   */
  recalculateRanking: async () => {
    try {
      const { error } = await supabase.rpc("recalculate_listing_ranking");

      if (error) throw error;

      console.log("Ranking recalculado com sucesso");
      return { success: true };
    } catch (error) {
      console.error("Erro ao recalcular ranking:", error);
      return { success: false, error };
    }
  },

  /**
   * Busca estatísticas de um anúncio específico
   */
  getListingStats: async (listingId: string) => {
    try {
      const { data: interactions, error } = await supabase
        .from("interactions")
        .select("type, created_at")
        .eq("listing_id", listingId);

      if (error) throw error;

      const stats = {
        totalViews: interactions?.filter((i) => i.type === "view").length || 0,
        totalLikes: interactions?.filter((i) => i.type === "like").length || 0,
        totalShares:
          interactions?.filter((i) => i.type === "share").length || 0,
        recentViews:
          interactions?.filter(
            (i) =>
              i.type === "view" &&
              new Date(i.created_at) >
                new Date(Date.now() - 24 * 60 * 60 * 1000)
          ).length || 0,
      };

      return stats;
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      return null;
    }
  },

  /**
   * Busca os anúncios em alta (mais engajamento recente)
   */
  getTrendingListings: async (limit: number = 10) => {
    try {
      const { data, error } = await supabase
        .from("listings")
        .select(
          `
          *,
          profiles:user_id (
            name,
            photo_url,
            verified
          )
        `
        )
        .eq("status", "ativo")
        .eq("approved", true)
        .order("ranking_score", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error("Erro ao buscar anúncios em alta:", error);
      return [];
    }
  },
};
