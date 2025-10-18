import { useEffect, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { VehicleCard } from "@/components/VehicleCard";
import { Button } from "@/components/ui/button";
import { Search, LogIn, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { CATEGORIES, BRAZILIAN_STATES } from "@/data/categories";
import { useCities } from "@/hooks/useCities";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { LocationSelector } from "@/components/LocationSelector";

const Explore = () => {
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
  const { location } = useGeolocation();
  const { addRecentSearch, trackCategoryView } = useUserPreferences();

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

      // Filtro por estado
      if (selectedState) {
        query = query.eq("state", selectedState);
      }

      // Filtro por cidade
      if (selectedCity) {
        query = query.eq("city", selectedCity);
      }

      // Busca por texto
      if (searchQuery) {
        query = query.or(`brand_model.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
        if (user) addRecentSearch(searchQuery);
      }

      const { data, error } = await query.order("created_at", { ascending: false }).limit(100);

      if (error) throw error;
      
      setListings(data || []);
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
        <p className="text-white">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-16">
      <header className="fixed top-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-lg border-b border-white/10">
        <div className="px-4 py-3 space-y-3">
          {/* Barra de busca e localização */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <Input
                placeholder="Buscar produtos, serviços ou imóveis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            
            {/* Localização atual - clicável */}
            {(location.city || location.state) && (
              <button
                onClick={() => setShowLocationModal(true)}
                className="flex items-center gap-1 px-3 py-2 bg-white/10 rounded-lg text-xs text-white hover:bg-white/20 transition-colors border border-white/20"
              >
                <MapPin className="w-4 h-4 text-[#00FF7F]" />
                <span className="hidden sm:inline max-w-[100px] truncate">
                  {location.city}, {location.state}
                </span>
              </button>
            )}

            {!user && (
              <Button 
                onClick={() => navigate("/auth")}
                size="sm"
                className="bg-[#00FF7F] text-black hover:bg-[#00FF7F]/90"
              >
                <LogIn className="w-4 h-4 mr-1" />
                Entrar
              </Button>
            )}
          </div>
          
          {/* Filtros de Estado e Cidade */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <Select value={selectedState || "all"} onValueChange={(value) => {
              setSelectedState(value === "all" ? null : value);
              setSelectedCity(null);
            }}>
              <SelectTrigger className="w-[120px] bg-white/10 border-white/20 text-white text-xs shrink-0">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="bg-black border-white/20">
                <SelectItem value="all" className="text-white">Todos</SelectItem>
                {BRAZILIAN_STATES.map((state) => (
                  <SelectItem key={state.uf} value={state.uf} className="text-white">{state.uf}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedState && (
              <Select value={selectedCity || "all"} onValueChange={(value) => setSelectedCity(value === "all" ? null : value)}>
                <SelectTrigger className="w-[140px] bg-white/10 border-white/20 text-white text-xs shrink-0">
                  <SelectValue placeholder="Cidade" />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/20">
                  <SelectItem value="all" className="text-white">Todas</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city} className="text-white">{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Categorias */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory("Todos")}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === "Todos"
                  ? "bg-[#00FF7F] text-black"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              Todos
            </button>
            {Object.keys(CATEGORIES).map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? "bg-[#00FF7F] text-black"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="pt-40 px-4 space-y-3">
        {listings.length > 0 ? (
          listings.map((listing) => (
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
          ))
        ) : (
          <div className="text-center py-12 text-white/70">
            <p>Nenhum anúncio disponível</p>
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

export default Explore;
