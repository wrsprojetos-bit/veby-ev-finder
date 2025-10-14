import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { VehicleCard } from "@/components/VehicleCard";
import { LayoutGrid, List, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import vebyLogo from "@/assets/veby-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Mock data
const vehicles = [
  {
    id: 1,
    title: "Bike Elétrica SuperCharge Pro",
    price: "R$ 4.500",
    location: "São Paulo, SP",
    distance: "2.3 km",
    views: 1234,
    likes: 89,
    image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&q=80",
    category: "Bike Elétrica",
    acceptsTrade: true,
  },
  {
    id: 2,
    title: "Patinete Xiaomi Mi Pro 2",
    price: "R$ 2.800",
    location: "Rio de Janeiro, RJ",
    distance: "5.1 km",
    views: 856,
    likes: 45,
    image: "https://images.unsplash.com/photo-1621544402532-7a86ed81d07a?w=800&q=80",
    category: "Patinete",
    acceptsTrade: false,
  },
  {
    id: 3,
    title: "Scooter Elétrica Voltz EV1",
    price: "R$ 8.900",
    location: "Curitiba, PR",
    distance: "1.8 km",
    views: 2341,
    likes: 156,
    image: "https://images.unsplash.com/photo-1558981852-426c6c22a060?w=800&q=80",
    category: "Scooter",
    acceptsTrade: true,
  },
];

const Index = () => {
  const [viewMode, setViewMode] = useState<"feed" | "list">("feed");
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setLoading(true);
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
      .limit(20);

    if (data) {
      setListings(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando anúncios...</p>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-16">
        <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
          <div className="flex items-center justify-between px-4 h-14">
            <div className="flex items-center gap-2 flex-1 justify-center">
              <img src={vebyLogo} alt="VEBY" className="w-8 h-8" />
              <h1 className="text-xl font-semibold text-foreground tracking-wide">VEBY</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode(viewMode === "feed" ? "list" : "feed")}
              className="hover:bg-white/10 absolute right-4"
            >
              {viewMode === "feed" ? (
                <List className="w-5 h-5" />
              ) : (
                <LayoutGrid className="w-5 h-5" />
              )}
            </Button>
          </div>
        </header>
        <main className="pt-20 px-4 text-center">
          <p className="text-muted-foreground mb-4">Nenhum anúncio disponível no momento.</p>
          {!user && (
            <Button onClick={() => navigate("/auth")} className="bg-gradient-primary">
              Fazer Login para Publicar
            </Button>
          )}
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center justify-between px-4 h-14">
          {!user && (
            <Button 
              onClick={() => navigate("/auth")}
              size="sm"
              className="bg-gradient-primary text-primary-foreground shadow-glow-primary absolute left-4 z-10"
            >
              <LogIn className="w-4 h-4 mr-1" />
              Entrar
            </Button>
          )}
          <div className="flex items-center gap-2 flex-1 justify-center">
            <img src={vebyLogo} alt="VEBY" className="w-8 h-8" />
            <h1 className="text-xl font-semibold text-foreground tracking-wide">VEBY</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode(viewMode === "feed" ? "list" : "feed")}
            className="hover:bg-white/10 absolute right-4"
          >
            {viewMode === "feed" ? (
              <List className="w-5 h-5" />
            ) : (
              <LayoutGrid className="w-5 h-5" />
            )}
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="pt-0">
        {viewMode === "feed" ? (
          <div className="snap-y snap-mandatory overflow-y-scroll h-screen">
            {listings.map((listing) => (
              <VehicleCard 
                key={listing.id}
                id={listing.id}
                title={listing.brand_model}
                price={`R$ ${listing.price?.toFixed(2).replace('.', ',')}`}
                location={listing.profiles?.location || listing.location}
                distance="2.5 km"
                views={listing.views}
                image={listing.video_url || listing.thumbnail_url || listing.images?.[0] || "https://images.unsplash.com/photo-1558981852-426c6c22a060?w=800&q=80"}
                category={listing.category}
                acceptsTrade={listing.accepts_trade}
                variant="feed"
                sellerId={listing.user_id}
                listingId={listing.id}
                sellerName={listing.profiles?.name}
                sellerAvatar={listing.profiles?.photo_url}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3 p-4 pt-20">
            {listings.map((listing) => (
              <VehicleCard 
                key={listing.id}
                id={listing.id}
                title={listing.brand_model}
                price={`R$ ${listing.price?.toFixed(2).replace('.', ',')}`}
                location={listing.profiles?.location || listing.location}
                distance="2.5 km"
                views={listing.views}
                image={listing.thumbnail_url || listing.images?.[0] || "https://images.unsplash.com/photo-1558981852-426c6c22a060?w=800&q=80"}
                category={listing.category}
                acceptsTrade={listing.accepts_trade}
                variant="list"
                sellerId={listing.user_id}
                listingId={listing.id}
                sellerName={listing.profiles?.name}
                sellerAvatar={listing.profiles?.photo_url}
              />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
