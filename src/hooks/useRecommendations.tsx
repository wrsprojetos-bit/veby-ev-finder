import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useUserPreferences } from "./useUserPreferences";

interface ListingWithScore {
  id: string;
  brand_model: string;
  price: number;
  city: string;
  state: string;
  category: string;
  subcategory?: string;
  tags?: string[];
  engagement_score: number;
  created_at: string;
  views: number;
  likes: number;
  thumbnail_url?: string;
  images?: string[];
  video_url?: string;
  accepts_trade: boolean;
  user_id: string;
  profiles?: any;
  relevance_score?: number;
  recommendation_reason?: string;
}

export const useRecommendations = (userCity?: string, userState?: string) => {
  const { user } = useAuth();
  const { preferences, getFavoriteCategories } = useUserPreferences();
  const [recommendations, setRecommendations] = useState<ListingWithScore[]>([]);
  const [loading, setLoading] = useState(true);

  const calculateRelevanceScore = (listing: any): { score: number; reason: string } => {
    let score = 0;
    let reasons: string[] = [];
    
    const favoriteCategories = getFavoriteCategories();
    
    // 1. Match de categoria (40%)
    if (favoriteCategories.includes(listing.category)) {
      score += 0.4;
      reasons.push("categoria favorita");
    } else if (preferences?.view_count_per_category?.[listing.category]) {
      score += 0.2;
      reasons.push("categoria conhecida");
    }

    // 2. Match de localização (30%)
    if (userCity && listing.city === userCity) {
      score += 0.3;
      reasons.push("próximo a você");
    } else if (userState && listing.state === userState) {
      score += 0.15;
      reasons.push("na sua região");
    }

    // 3. Engajamento (20%)
    const engagementScore = listing.engagement_score || 0;
    const normalizedEngagement = Math.min(engagementScore / 100, 1);
    score += normalizedEngagement * 0.2;
    if (engagementScore > 50) {
      reasons.push("popular");
    }

    // 4. Recência (10%)
    const createdAt = new Date(listing.created_at).getTime();
    const now = Date.now();
    const daysSinceCreation = (now - createdAt) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 1 - daysSinceCreation / 30); // Decai ao longo de 30 dias
    score += recencyScore * 0.1;
    if (daysSinceCreation < 3) {
      reasons.push("novo");
    }

    return {
      score,
      reason: reasons.length > 0 ? reasons.join(", ") : "recomendado"
    };
  };

  const fetchRecommendations = async () => {
    try {
      setLoading(true);

      // Buscar todos os anúncios ativos
      const { data, error } = await supabase
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
        .limit(200);

      if (error) throw error;

      if (!data) {
        setRecommendations([]);
        return;
      }

      // Calcular score de relevância para cada anúncio
      const listingsWithScores = data.map(listing => {
        const { score, reason } = calculateRelevanceScore(listing);
        return {
          ...listing,
          relevance_score: score,
          recommendation_reason: reason
        };
      });

      // Ordenar por score de relevância
      const sorted = listingsWithScores.sort((a, b) => 
        (b.relevance_score || 0) - (a.relevance_score || 0)
      );

      // Separar em grupos por score
      const highRelevance = sorted.filter(l => (l.relevance_score || 0) >= 0.6);
      const mediumRelevance = sorted.filter(l => (l.relevance_score || 0) >= 0.3 && (l.relevance_score || 0) < 0.6);
      const lowRelevance = sorted.filter(l => (l.relevance_score || 0) < 0.3);

      // Montar feed final: 70% alta relevância, 20% média, 10% descoberta
      const finalFeed: ListingWithScore[] = [];
      
      // Pegar 70% de alta relevância (ou até 35 itens)
      const highCount = Math.min(Math.floor(highRelevance.length * 0.7) || 15, 35);
      finalFeed.push(...highRelevance.slice(0, highCount));

      // Pegar 20% de média relevância (ou até 10 itens)
      const medCount = Math.min(Math.floor(mediumRelevance.length * 0.2) || 5, 10);
      finalFeed.push(...mediumRelevance.slice(0, medCount));

      // Pegar 10% de baixa relevância para descoberta (ou até 5 itens)
      const lowCount = Math.min(Math.floor(lowRelevance.length * 0.1) || 3, 5);
      // Embaralhar para variedade
      const shuffledLow = lowRelevance.sort(() => Math.random() - 0.5);
      finalFeed.push(...shuffledLow.slice(0, lowCount));

      setRecommendations(finalFeed);
    } catch (error) {
      console.error("Erro ao buscar recomendações:", error);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Buscar recomendações sempre, mesmo sem usuário logado
    fetchRecommendations();
  }, [user, userCity, userState, preferences]);

  return {
    recommendations,
    loading,
    refetch: fetchRecommendations
  };
};
