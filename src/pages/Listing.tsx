import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { VehicleCard } from "@/components/VehicleCard";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const Listing = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      navigate("/explore");
      return;
    }

    const fetchListing = async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .eq("status", "ativo")
        .eq("approved", true)
        .single();

      if (error || !data) {
        console.error("Erro ao buscar anúncio:", error);
        navigate("/explore");
        return;
      }

      setListing(data);
      setLoading(false);
    };

    fetchListing();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Carregando anúncio...</p>
      </div>
    );
  }

  if (!listing) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Botão voltar */}
      <div className="fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/explore")}
          className="bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>

      {/* Player de vídeo */}
      <div className="h-screen">
        <VehicleCard
          id={listing.id}
          listingId={listing.id}
          sellerId={listing.user_id}
          title={listing.brand_model}
          price={listing.price ? `R$ ${listing.price.toLocaleString()}` : "Preço não informado"}
          location={`${listing.city || listing.location}, ${listing.state}`}
          distance="0 km"
          videoUrl={listing.video_url}
          image={listing.video_thumbnail || listing.thumbnail_url || ""}
          views={listing.views || 0}
          category={listing.category}
          acceptsTrade={listing.accepts_trade}
          variant="feed"
        />
      </div>
    </div>
  );
};

export default Listing;
