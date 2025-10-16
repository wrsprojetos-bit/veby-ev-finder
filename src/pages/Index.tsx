import { useState, useEffect } from "react";
import vebyLogo from "@/assets/veby-logo-new.png";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { VehicleCard } from "@/components/VehicleCard";
import { LayoutGrid, List, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      {/* Desktop Sidebar - Hidden on mobile */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex-col p-4 z-50">
        <div className="flex items-center gap-2 mb-8 px-2">
          <img src={vebyLogo} alt="VEBY" className="w-10 h-10" />
          <h1 className="text-2xl font-bold">VEBY</h1>
        </div>
        
        <nav className="flex-1 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-primary font-semibold">
            <LayoutGrid className="w-6 h-6" />
            <span>Para Você</span>
          </button>
          <button 
            onClick={() => navigate("/explore")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Explorar</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Seguindo</span>
          </button>
          <button 
            onClick={() => navigate("/publish")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span>Publicar</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>LIVE</span>
          </button>
          <button 
            onClick={() => navigate("/profile")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Perfil</span>
          </button>
        </nav>

        {!user && (
          <Button
            onClick={() => navigate("/auth")}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-4"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Entrar
          </Button>
        )}
      </aside>

      {/* Header - Mobile only */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
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
            <img src={vebyLogo} alt="VEBY" className="w-10 h-10" />
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

      {/* Desktop Header - Top right buttons */}
      <header className="hidden md:flex fixed top-0 right-0 z-40 p-4 gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setViewMode(viewMode === "feed" ? "list" : "feed")}
          className="hover:bg-muted"
        >
          {viewMode === "feed" ? (
            <List className="w-5 h-5" />
          ) : (
            <LayoutGrid className="w-5 h-5" />
          )}
        </Button>
        {!user && (
          <Button
            onClick={() => navigate("/auth")}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Entrar
          </Button>
        )}
      </header>

      {/* Content */}
      <main className="pt-0 md:ml-64">
        {viewMode === "feed" ? (
          <div className="snap-y snap-mandatory overflow-y-scroll no-scrollbar h-[calc(100vh-56px)] md:h-screen feed-scroll md:flex md:items-center md:justify-center" data-scroll-root="true" id="feed-scroll">
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
                videoUrl={listing.video_url}
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
          <div className="space-y-3 p-4 pt-20 md:pt-4">
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
                videoUrl={listing.video_url}
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
