import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

// Hook para integrar preferências
const usePreferencesUpdate = () => {
  const { user } = useAuth();
  
  const addLikedListing = async (listingId: string) => {
    if (!user) return;
    
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('liked_listings')
      .eq('user_id', user.id)
      .single();
    
    if (prefs) {
      const liked = [...new Set([...(prefs.liked_listings || []), listingId])];
      await supabase
        .from('user_preferences')
        .update({ liked_listings: liked })
        .eq('user_id', user.id);
    }
  };
  
  return { addLikedListing };
};


export const useLikesAndFavorites = (listingId?: string) => {
  const { user } = useAuth();
  const { addLikedListing } = usePreferencesUpdate();
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    if (listingId && user) {
      checkLikeStatus();
      checkFavoriteStatus();
      fetchLikesCount();
    }
  }, [listingId, user]);

  const checkLikeStatus = async () => {
    if (!user || !listingId) return;

    const { data } = await supabase
      .from("likes")
      .select("id")
      .eq("user_id", user.id)
      .eq("listing_id", listingId)
      .maybeSingle();

    setIsLiked(!!data);
  };

  const checkFavoriteStatus = async () => {
    if (!user || !listingId) return;

    const { data } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("listing_id", listingId)
      .maybeSingle();

    setIsFavorited(!!data);
  };

  const fetchLikesCount = async () => {
    if (!listingId) return;

    const { count } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("listing_id", listingId);

    setLikesCount(count || 0);
  };

  const toggleLike = async () => {
    if (!user || !listingId) {
      toast.error("Faça login para curtir");
      return;
    }

    if (isLiked) {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("user_id", user.id)
        .eq("listing_id", listingId);

      if (!error) {
        setIsLiked(false);
        setLikesCount((prev) => Math.max(0, prev - 1));
        toast.success("Curtida removida");
      } else {
        console.error("Erro ao remover curtida:", error);
        toast.error("Erro ao remover curtida");
      }
    } else {
      const { error } = await supabase
        .from("likes")
        .insert({ user_id: user.id, listing_id: listingId });

      if (!error) {
        setIsLiked(true);
        setLikesCount((prev) => prev + 1);
        
        // Atualizar preferências
        await addLikedListing(listingId);
        
        toast.success("Curtido!");
      } else {
        console.error("Erro ao curtir:", error);
        toast.error("Erro ao curtir");
      }
    }
  };

  const toggleFavorite = async () => {
    if (!user || !listingId) {
      toast.error("Faça login para favoritar");
      return;
    }

    if (isFavorited) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("listing_id", listingId);

      if (!error) {
        setIsFavorited(false);
        toast.success("Removido dos favoritos");
      } else {
        console.error("Erro ao remover favorito:", error);
        toast.error("Erro ao remover dos favoritos");
      }
    } else {
      const { error } = await supabase
        .from("favorites")
        .insert({ user_id: user.id, listing_id: listingId });

      if (!error) {
        setIsFavorited(true);
        toast.success("Favoritado!");
      } else {
        console.error("Erro ao favoritar:", error);
        toast.error("Erro ao favoritar");
      }
    }
  };

  return {
    isLiked,
    isFavorited,
    likesCount,
    toggleLike,
    toggleFavorite,
  };
};
