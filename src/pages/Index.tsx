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

const Index = () => {
  const [viewMode, setViewMode] = useState<"feed" | "list">("feed");
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const cities = useCities(selectedState);
  const { user } = useAuth();
  const navigate = useNavigate();

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
      }

      const { data, error } = await query.order("created_at", { ascending: false }).limit(50);

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

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-black border-b border-white/10 z-30">
        {/* Top Bar */}
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

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
            <Input
              placeholder="Buscar produtos, serviços ou imóveis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          <Select value={selectedState || "all"} onValueChange={(value) => {
            setSelectedState(value === "all" ? null : value);
            setSelectedCity(null);
          }}>
            <SelectTrigger className="w-[120px] bg-white/10 border-white/20 text-white text-xs shrink-0">
              <MapPin className="w-3 h-3 mr-1" />
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

          <Button
            variant={viewMode === "feed" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("feed")}
            className={`shrink-0 ${viewMode === "feed" ? "bg-[#00FF7F] text-black" : "bg-white/10 text-white border-white/20"}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            className={`shrink-0 ${viewMode === "list" ? "bg-[#00FF7F] text-black" : "bg-white/10 text-white border-white/20"}`}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>

        {/* Categories Scroll */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
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
      <main className="pt-0 md:ml-64">
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

      <BottomNav />
    </div>
  );
};

export default Index;
