import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface PersonalizedListing {
  listing_id: string;
  title: string;
  price: number;
  thumbnail_url: string;
  video_preview: string;
  ranking_score: number;
  relevance_score: number;
}

export const usePersonalizedFeed = (limit: number = 50, offset: number = 0) => {
  const { user } = useAuth();
  const [feed, setFeed] = useState<PersonalizedListing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPersonalizedFeed = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.rpc("get_personalized_feed", {
        p_user_id: user.id,
        p_limit: limit,
        p_offset: offset,
      });

      if (error) throw error;

      setFeed(data || []);
    } catch (error) {
      console.error("Erro ao carregar feed personalizado:", error);
      setFeed([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonalizedFeed();
  }, [user, limit, offset]);

  return {
    feed,
    loading,
    refetch: fetchPersonalizedFeed,
  };
};
