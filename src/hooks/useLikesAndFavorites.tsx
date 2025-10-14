import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export const useLikesAndFavorites = (listingId?: string) => {
  const { user } = useAuth();
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
      }
    } else {
      const { error } = await supabase
        .from("likes")
        .insert({ user_id: user.id, listing_id: listingId });

      if (!error) {
        setIsLiked(true);
        setLikesCount((prev) => prev + 1);
        toast.success("Curtido!");
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
      }
    } else {
      const { error } = await supabase
        .from("favorites")
        .insert({ user_id: user.id, listing_id: listingId });

      if (!error) {
        setIsFavorited(true);
        toast.success("Favoritado!");
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
