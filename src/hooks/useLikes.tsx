import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export const useLikes = (listingId: string) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    if (!listingId) return;

    const fetchLikeStatus = async () => {
      // Get total likes count
      const { count } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("listing_id", listingId);

      setLikesCount(count || 0);

      // Check if current user liked it
      if (user) {
        const { data } = await supabase
          .from("likes")
          .select("id")
          .eq("listing_id", listingId)
          .eq("user_id", user.id)
          .maybeSingle();

        setIsLiked(!!data);
      }
    };

    fetchLikeStatus();
  }, [listingId, user]);

  const toggleLike = async () => {
    if (!user) {
      toast.error("Faça login para curtir");
      return;
    }

    if (isLiked) {
      // Remove like
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("listing_id", listingId)
        .eq("user_id", user.id);

      if (!error) {
        setIsLiked(false);
        setLikesCount((prev) => prev - 1);
      }
    } else {
      // Add like
      const { error } = await supabase
        .from("likes")
        .insert({ listing_id: listingId, user_id: user.id });

      if (!error) {
        setIsLiked(true);
        setLikesCount((prev) => prev + 1);
      }
    }
  };

  return { isLiked, likesCount, toggleLike };
};
