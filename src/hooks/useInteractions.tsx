import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

type InteractionType = "view" | "like" | "comment" | "share";

export const useInteractions = () => {
  const { user } = useAuth();

  const trackInteraction = async (
    listingId: string,
    type: InteractionType,
    duration: number = 0
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase.from("interactions").insert({
        user_id: user.id,
        listing_id: listingId,
        type,
        duration,
      });

      if (error) throw error;
    } catch (error) {
      console.error("Erro ao registrar interação:", error);
    }
  };

  const trackView = (listingId: string, duration: number = 0) => {
    trackInteraction(listingId, "view", duration);
  };

  const trackLike = (listingId: string) => {
    trackInteraction(listingId, "like");
  };

  const trackComment = (listingId: string) => {
    trackInteraction(listingId, "comment");
  };

  const trackShare = async (listingId: string) => {
    await trackInteraction(listingId, "share");
    toast.success("Compartilhamento registrado!");
  };

  return {
    trackView,
    trackLike,
    trackComment,
    trackShare,
  };
};
