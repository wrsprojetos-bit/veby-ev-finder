import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export const useFavorites = (listingId: string) => {
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    if (!listingId || !user) return;

    const fetchFavoriteStatus = async () => {
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("listing_id", listingId)
        .eq("user_id", user.id)
        .maybeSingle();

      setIsFavorited(!!data);
    };

    fetchFavoriteStatus();
  }, [listingId, user]);

  const toggleFavorite = async () => {
    if (!user) {
      toast.error("Faça login para favoritar");
      return;
    }

    if (isFavorited) {
      // Remove favorite
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("listing_id", listingId)
        .eq("user_id", user.id);

      if (!error) {
        setIsFavorited(false);
      }
    } else {
      // Add favorite
      const { error } = await supabase
        .from("favorites")
        .insert({ listing_id: listingId, user_id: user.id });

      if (!error) {
        setIsFavorited(true);
      }
    }
  };

  return { isFavorited, toggleFavorite };
};
