import { useState, useEffect } from "react";
import vebyLogo from "@/assets/veby-logo-new.png";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { VehicleCard } from "@/components/VehicleCard";
import { LayoutGrid, List, LogIn, Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CATEGORIES, BRAZILIAN_STATES } from "@/data/categories";
import { useCities } from "@/hooks/useCities";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { LocationSelector } from "@/components/LocationSelector";
import { toast } from "sonner";

const Index = () => {
  const [viewMode, setViewMode] = useState<"feed" | "list">("feed");
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const cities = useCities(selectedState);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { location, requestLocation } = useGeolocation();
  const { trackCategoryView, addRecentSearch, getFavoriteCategories } = useUserPreferences();

  // Solicitar localização ao abrir pela primeira vez
  useEffect(() => {
    const hasRequestedLocation = localStorage.getItem('hasRequestedLocation');
    if (!hasRequestedLocation && !location.state) {
      setTimeout(() => {
        setShowLocationModal(true);
        localStorage.setItem('hasRequestedLocation', 'true');
      }, 2000);
    }
  }, []);

  // Usar localização do hook se disponível
  useEffect(() => {
    if (location.state && !selectedState) {
      setSelectedState(location.state);
    }
    if (location.city && !selectedCity) {
      setSelectedCity(location.city);
    }
  }, [location]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      
      // Personalização: feed inteligente baseado em localização
      const userCity = selectedCity || location.city;
      const userState = selectedState || location.state;
      
      let query = supabase
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
        .eq("status", "ativo");

      // Filtro por categoria
      if (selectedCategory !== "Todos") {
        query = query.eq("category", selectedCategory);
        if (user) trackCategoryView(selectedCategory);
      }

      // Busca por texto
      if (searchQuery) {
        query = query.or(`brand_model.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
        if (user) addRecentSearch(searchQuery);
      }

      const { data, error } = await query.order("created_at", { ascending: false }).limit(100);

      if (error) throw error;
      
      // Personalização do feed por localização (70% mesma cidade, 20% mesmo estado, 10% outros)
      let sortedListings = data || [];
      
      if (userCity && userState) {
        const sameCityListings = sortedListings.filter(l => l.city === userCity);
        const sameStateListings = sortedListings.filter(l => l.state === userState && l.city !== userCity);
        const otherListings = sortedListings.filter(l => l.state !== userState);
        
        // Embaralhar e combinar com proporções
        const sameCityCount = Math.floor(sameCityListings.length * 0.7);
        const sameStateCount = Math.floor(sameStateListings.length * 0.2);
        
        sortedListings = [
          ...sameCityListings.slice(0, sameCityCount),
          ...sameStateListings.slice(0, sameStateCount),
          ...otherListings.slice(0, 10),
        ].slice(0, 50);
      }
      
      setListings(sortedListings);
    } catch (error) {
      console.error("Erro ao carregar anúncios:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [selectedCategory, selectedState, selectedCity, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Carregando anúncios...</p>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="min-h-screen bg-black pb-16">
        <header className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/10">
          <div className="flex items-center justify-between px-4 h-14">
            <div className="flex items-center gap-2 flex-1 justify-center">
              <img src={vebyLogo} alt="VEBY" className="w-8 h-8" />
              <h1 className="text-xl font-semibold text-white tracking-wide">VEBY</h1>
            </div>
          </div>
        </header>
        <main className="pt-20 px-4 text-center">
          <p className="text-white/70 mb-4">Nenhum anúncio disponível no momento.</p>
          {!user && (
            <Button onClick={() => navigate("/auth")} className="bg-[#00FF7F] text-black hover:bg-[#00FF7F]/90">
              Fazer Login para Publicar
            </Button>
          )}
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-16 md:pb-0">
      {/* Desktop Sidebar - Hidden on mobile */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-black border-r border-white/10 flex-col p-4 z-50">
        <div className="flex items-center gap-2 mb-8 px-2">
          <img src={vebyLogo} alt="VEBY" className="w-10 h-10" />
          <h1 className="text-2xl font-bold text-white">VEBY</h1>
        </div>
        
        <nav className="flex-1 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-[#00FF7F] font-semibold">
            <LayoutGrid className="w-6 h-6" />
            <span>Para Você</span>
          </button>
          <button 
            onClick={() => navigate("/explore")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-white"
          >
            <Search className="w-6 h-6" />
            <span>Explorar</span>
          </button>
          <button 
            onClick={() => navigate("/publish")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span>Publicar</span>
          </button>
          <button 
            onClick={() => navigate("/profile")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-white"
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
            className="w-full bg-[#00FF7F] text-black hover:bg-[#00FF7F]/90 mt-4"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Entrar
          </Button>
        )}
      </aside>

      {/* Mobile Header - Simplificado */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-black border-b border-white/10 z-30">
        <div className="px-4 py-3 flex items-center justify-between">
          <img src={vebyLogo} alt="VEBY" className="h-8" />
          
          {!user && (
            <button 
              onClick={() => navigate('/auth')}
              className="bg-[#00FF7F] text-black px-4 py-2 rounded-full font-bold text-sm hover:bg-[#00FF7F]/90 transition-colors"
            >
              Entrar
            </button>
          )}
        </div>
      </div>

      {/* Desktop Header - Top right buttons */}
      <header className="hidden md:flex fixed top-0 right-0 z-40 p-4 gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setViewMode(viewMode === "feed" ? "list" : "feed")}
          className="hover:bg-white/10 text-white"
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
            className="bg-[#00FF7F] text-black hover:bg-[#00FF7F]/90"
          >
            Entrar
          </Button>
        )}
      </header>

      {/* Content */}
      <main className="pt-14 md:ml-64">
        {viewMode === "feed" ? (
          <div className="snap-y snap-mandatory overflow-y-scroll no-scrollbar h-[calc(100vh-56px)] md:h-screen feed-scroll md:snap-y md:snap-mandatory" data-scroll-root="true" id="feed-scroll">
            <div className="md:flex md:flex-col md:items-center md:justify-start md:h-full">
              {listings.map((listing) => (
                <VehicleCard 
                  key={listing.id}
                  id={listing.id}
                  title={listing.brand_model}
                  price={`R$ ${listing.price?.toFixed(2).replace('.', ',')}`}
                  location={`${listing.city || ''}, ${listing.state || ''}`}
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
          </div>
        ) : (
          <div className="space-y-3 p-4 pt-[280px] md:pt-4">
            {listings.map((listing) => (
              <VehicleCard 
                key={listing.id}
                id={listing.id}
                title={listing.brand_model}
                price={`R$ ${listing.price?.toFixed(2).replace('.', ',')}`}
                location={`${listing.city || ''}, ${listing.state || ''}`}
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

      <LocationSelector 
        open={showLocationModal} 
        onOpenChange={setShowLocationModal}
        onLocationChange={(state, city) => {
          setSelectedState(state);
          setSelectedCity(city);
        }}
      />

      <BottomNav />
    </div>
  );
};

export default Index;
