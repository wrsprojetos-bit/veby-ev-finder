import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { VehicleCard } from "@/components/VehicleCard";
import { ExploreGridCard } from "@/components/ExploreGridCard";
import { Button } from "@/components/ui/button";
import { Search, LogIn, Grid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { VEHICLE_TYPES, BRAZILIAN_STATES } from "@/data/categories";
import { useCities } from "@/hooks/useCities";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useInfiniteListings } from "@/hooks/useInfiniteListings";
import { InfiniteScrollTrigger } from "@/components/InfiniteScrollTrigger";

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const cities = useCities(selectedState);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addRecentSearch, trackCategoryView } = useUserPreferences();

  const handleOpenInFeed = (id: string) => {
    navigate(`/?listing=${id}`);
  };

  const { listings, loading, isLoadingMore, hasMore, loadMore } = useInfiniteListings({
    selectedCategory,
    selectedState,
    selectedCity,
    searchQuery,
    onCategoryView: trackCategoryView,
    onSearchAdd: addRecentSearch,
    userId: user?.id,
  });


  return (
    <div className="min-h-screen bg-black pb-16">
      <header className="fixed top-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-lg border-b border-white/10">
        <div className="px-4 py-3 space-y-3">
          {/* Barra de busca, localização e modo de visualização */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <Input
                placeholder="Buscar veículos elétricos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            
            {/* Botão de alternar visualização */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="hover:bg-white/10 text-white shrink-0"
            >
              {viewMode === "grid" ? (
                <List className="w-5 h-5" />
              ) : (
                <Grid className="w-5 h-5" />
              )}
            </Button>


            {!user && (
              <Button 
                onClick={() => navigate("/auth")}
                size="sm"
                className="bg-[#00FF7F] text-black hover:bg-[#00FF7F]/90 shrink-0"
              >
                <LogIn className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Entrar</span>
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

          {/* Tipos de Veículos */}
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
            {Object.entries(VEHICLE_TYPES).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === key
                    ? "bg-[#00FF7F] text-black"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="pt-40 px-4">
        {listings.length > 0 ? (
          viewMode === "grid" ? (
            <>
              {/* Visualização em grid com previews */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pb-4">
                {listings.map((listing) => (
                  <ExploreGridCard
                    key={listing.id}
                    id={listing.id}
                    title={listing.brand_model}
                    price={`R$ ${listing.price?.toFixed(2).replace('.', ',')}`}
                    thumbnail={listing.video_thumbnail || listing.thumbnail_url || listing.images?.[0]}
                    videoUrl={listing.video_url}
                    views={listing.views || 0}
                    onClick={() => handleOpenInFeed(listing.id)}
                  />
                ))}
              </div>
              <InfiniteScrollTrigger 
                onLoadMore={loadMore}
                isLoading={isLoadingMore}
                hasMore={hasMore}
              />
            </>
          ) : (
            <>
              {/* Visualização em lista */}
              <div className="space-y-3 pb-4">
                {listings.map((listing) => (
                  <VehicleCard 
                    key={listing.id} 
                    id={listing.id}
                    title={listing.brand_model}
                    price={`R$ ${listing.price?.toFixed(2).replace('.', ',')}`}
                    location={`${listing.city || ''}, ${listing.state || ''}`}
                    distance="2.5 km"
                    views={listing.views}
                    image={listing.video_thumbnail || listing.thumbnail_url || listing.images?.[0] || "https://images.unsplash.com/photo-1558981852-426c6c22a060?w=800&q=80"}
                    videoUrl={listing.video_url}
                    category={listing.category}
                    acceptsTrade={listing.accepts_trade}
                    variant="list"
                    sellerId={listing.user_id}
                    listingId={listing.id}
                    sellerName={listing.profiles?.name}
                    sellerAvatar={listing.profiles?.photo_url}
                    onCardClick={() => handleOpenInFeed(listing.id)}
                  />
                ))}
              </div>
              <InfiniteScrollTrigger 
                onLoadMore={loadMore}
                isLoading={isLoadingMore}
                hasMore={hasMore}
              />
            </>
          )
        ) : (
          <div className="text-center py-12 text-white/70">
            <p>{loading ? 'Carregando...' : 'Nenhum anúncio disponível'}</p>
          </div>
        )}
      </main>


      <BottomNav />
    </div>
  );
};

export default Explore;
