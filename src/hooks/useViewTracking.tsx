import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useViewTracking = (listingId: string, isVisible: boolean) => {
  const { user } = useAuth();
  const startTimeRef = useRef<number | null>(null);
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    if (!user || !listingId || hasTrackedRef.current) return;

    const trackView = async () => {
      try {
        // Buscar views atual
        const { data: currentListing } = await supabase
          .from('listings')
          .select('views')
          .eq('id', listingId)
          .single();

        // Incrementar views no listing
        await supabase
          .from('listings')
          .update({ views: (currentListing?.views || 0) + 1 })
          .eq('id', listingId);

        // Registrar no histórico
        await supabase.from('view_history').insert({
          user_id: user.id,
          listing_id: listingId,
          watch_time_seconds: 0
        });

        hasTrackedRef.current = true;
      } catch (error) {
        console.error('Erro ao rastrear visualização:', error);
      }
    };

    if (isVisible) {
      startTimeRef.current = Date.now();
      trackView();
    }

    return () => {
      if (startTimeRef.current && isVisible && user) {
        const watchTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
        
        // Atualizar tempo de visualização de forma assíncrona
        (async () => {
          try {
            await supabase
              .from('view_history')
              .update({ watch_time_seconds: watchTime })
              .eq('user_id', user.id)
              .eq('listing_id', listingId);
            startTimeRef.current = null;
          } catch (error) {
            console.error('Erro ao atualizar tempo de visualização:', error);
          }
        })();
      }
    };
  }, [user, listingId, isVisible]);
};
