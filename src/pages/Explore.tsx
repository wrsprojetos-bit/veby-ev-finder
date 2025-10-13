import { useEffect, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { VehicleCard } from "@/components/VehicleCard";
import { Button } from "@/components/ui/button";
import { Filter, Search, LogIn } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const categories = [
  "Todos",
  "Bike Elétrica",
  "Patinete",
  "Skate",
  "Scooter",
  "Carro",
  "Peças",
];

const Explore = () => {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    const { data } = await supabase
      .from("listings")
      .select("*")
      .eq("status", "ativo")
      .order("created_at", { ascending: false });
    
    if (data) setListings(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="fixed top-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-3 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar veículos elétricos..."
                className="pl-10 bg-input border-border"
              />
            </div>
            {!user && (
              <Button 
                onClick={() => navigate("/auth")}
                size="sm"
                className="bg-gradient-primary text-primary-foreground shadow-glow-primary"
              >
                <LogIn className="w-4 h-4 mr-1" />
                Entrar
              </Button>
            )}
            <Button size="icon" variant="outline" className="border-border">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <Button
                key={category}
                variant="outline"
                size="sm"
                className="border-border whitespace-nowrap hover:bg-primary/10 hover:border-primary"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </header>

      <main className="pt-32 px-4 space-y-3">
        {listings.length > 0 ? (
          listings.map((listing) => (
            <VehicleCard 
              key={listing.id} 
              id={listing.id}
              title={listing.brand_model}
              price={`R$ ${listing.price?.toFixed(2).replace('.', ',')}`}
              location={listing.location}
              distance="2.3 km"
              views={listing.views}
              likes={listing.likes}
              image={listing.thumbnail_url || listing.images?.[0] || "https://images.unsplash.com/photo-1558981852-426c6c22a060?w=800&q=80"}
              category={listing.category}
              acceptsTrade={listing.accepts_trade}
              variant="list"
              sellerId={listing.user_id}
              listingId={listing.id}
            />
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhum anúncio disponível</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Explore;
