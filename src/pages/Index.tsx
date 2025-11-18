import { useState, useEffect } from "react";
import vebyLogo from "@/assets/veby-logo-new.png";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { VehicleCard } from "@/components/VehicleCard";
import { LayoutGrid, List, LogIn, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useGeolocation } from "@/hooks/useGeolocation";
import { LocationSelector } from "@/components/LocationSelector";
import { useProximityFeed } from "@/hooks/useProximityFeed";
import { InfiniteScrollTrigger } from "@/components/InfiniteScrollTrigger";

const Index = () => {
  const [viewMode, setViewMode] = useState<"feed" | "list">("feed");
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { location } = useGeolocation();
  
  // PASSO 4 e 5: Hook de feed por proximidade com raio progressivo
  const userCity = selectedCity || location.city;
  const userState = selectedState || location.state;
  const {
    listings: recommendations,
    loading,
    isLoadingMore,
    hasMore,
    loadMore,
    feedMode,
    userLocation
  } = useProximityFeed({
    userId: user?.id,
    userCity: userCity || undefined,
    userState: userState || undefined,
    enabled: true
  });

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

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Carregando anúncios...</p>
      </div>
    );
  }

  if (recommendations.length === 0 && !loading) {
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
          <p className="text-white/70 mb-4">Nenhum veículo elétrico disponível no momento.</p>
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
          <img src={vebyLogo} alt="VEBY" className="w-10 h-10" decoding="async" loading="eager" />
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
        {/* DEBUG: Vídeo fixo para testar autoplay */}
        <div className="p-4">
          <video
            src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
            autoPlay
            muted
            playsInline
            loop
            preload="auto"
            style={{ width: '100%', height: '300px', objectFit: 'cover', border: '1px solid red' }}
          />
        </div>
        {viewMode === "feed" ? (
          <div className="snap-y snap-mandatory overflow-y-scroll no-scrollbar h-[calc(100vh-56px)] md:h-screen feed-scroll md:snap-y md:snap-mandatory" data-scroll-root="true" id="feed-scroll">
            <div className="md:flex md:flex-col md:items-center md:justify-start md:h-full">
              {recommendations.map((listing, index) => (
                <VehicleCard 
                  key={listing.id}
                  id={listing.id}
                  title={listing.brand_model}
                  price={`R$ ${listing.price?.toFixed(2).replace('.', ',')}`}
                  location={`${listing.city || ''}, ${listing.state || ''}`}
                  distance={listing.distance_km ? `${listing.distance_km.toFixed(1)} km` : "--"}
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
                  recommendationReason={listing.recommendation_reason}
                  isPriority={index === 0}
                />
              ))}
              <InfiniteScrollTrigger 
                onLoadMore={loadMore}
                isLoading={isLoadingMore}
                hasMore={hasMore}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-3 p-4 pt-[280px] md:pt-4">
              {recommendations.map((listing) => (
                <VehicleCard 
                  key={listing.id}
                  id={listing.id}
                  title={listing.brand_model}
                  price={`R$ ${listing.price?.toFixed(2).replace('.', ',')}`}
                  location={`${listing.city || ''}, ${listing.state || ''}`}
                  distance={listing.distance_km ? `${listing.distance_km.toFixed(1)} km` : "--"}
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
                  recommendationReason={listing.recommendation_reason}
                />
              ))}
            </div>
            <InfiniteScrollTrigger 
              onLoadMore={loadMore}
              isLoading={isLoadingMore}
              hasMore={hasMore}
            />
          </>
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
