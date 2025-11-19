import { useState, useEffect, useRef } from "react";
import vebyLogo from "@/assets/veby-logo-new.png";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { VehicleCard } from "@/components/VehicleCard";
import { LogIn, Search, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useGeolocation } from "@/hooks/useGeolocation";
import { LocationSelector } from "@/components/LocationSelector";
import { useProximityFeed } from "@/hooks/useProximityFeed";
import { InfiniteScrollTrigger } from "@/components/InfiniteScrollTrigger";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isFeedReady, setIsFeedReady] = useState(false);
  const [hasDeepLinked, setHasDeepLinked] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { location } = useGeolocation();
  const isAnimatingRef = useRef(false);
  const [searchParams, setSearchParams] = useSearchParams();
  
  // PASSO 4 e 5: Hook de feed por proximidade com raio progressivo
  const userCity = selectedCity || location.city;
  const userState = selectedState || location.state;
  const {
    listings: baseRecommendations,
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

  // Estado único do feed: tudo que o feed renderiza vem daqui
  const [feedListings, setFeedListings] = useState<any[]>([]);
  const displayListings = feedListings;

  // Sincronização do feed normal (sem listing na URL)
  useEffect(() => {
    const listingIdFromUrl = searchParams.get("listing");
    
    // Se ainda existe listing na URL, quem manda é o efeito de deep link
    if (listingIdFromUrl) return;
    
    // Se já inicializei via deep link, não sobrescreve o feed
    if (hasDeepLinked) return;

    if (baseRecommendations && baseRecommendations.length > 0) {
      setFeedListings(baseRecommendations);
      setCurrentIndex(0);
      setIsFeedReady(true);
    }
  }, [baseRecommendations, searchParams, hasDeepLinked]);

  // Deep link vindo do /explore - sempre buscar por ID
  useEffect(() => {
    const listingIdFromUrl = searchParams.get("listing");
    if (!listingIdFromUrl) return;

    const loadDeepLinkedListing = async () => {
      console.log("DEEP_LINK_DEBUG buscando listing por id =", listingIdFromUrl);

      // 1) Buscar o anúncio específico no Supabase
      const { data, error } = await supabase
        .from("listings")
        .select("*, profiles:user_id(*)")
        .eq("id", listingIdFromUrl)
        .single();

      if (error) {
        console.error("DEEP_LINK_DEBUG erro ao buscar listing por id", error);
        // Em caso de erro, cair para o feed normal
        setIsFeedReady(true);
        searchParams.delete("listing");
        setSearchParams(searchParams, { replace: true });
        return;
      }

      console.log("DEEP_LINK_DEBUG anúncio encontrado:", data.id, data.brand_model);

      // 2) Montar feed começando por esse anúncio
      const base = baseRecommendations || [];
      const filtered = base.filter((r) => r.id !== data.id);
      const merged = [data, ...filtered];

      console.log("DEEP_LINK_DEBUG feed montado com", merged.length, "anúncios");

      setFeedListings(merged);
      setCurrentIndex(0);
      setIsFeedReady(true);
      setHasDeepLinked(true);

      // 3) Limpar parâmetro da URL
      searchParams.delete("listing");
      setSearchParams(searchParams, { replace: true });
    };

    loadDeepLinkedListing();
  }, [baseRecommendations, searchParams, setSearchParams]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  // Funções de navegação
  const goToNextVideo = () => {
    if (currentIndex < displayListings.length - 1) {
      isAnimatingRef.current = true;
      setCurrentIndex(prev => prev + 1);
      setTimeout(() => {
        isAnimatingRef.current = false;
      }, 300);
    }
  };

  const goToPreviousVideo = () => {
    if (currentIndex > 0) {
      isAnimatingRef.current = true;
      setCurrentIndex(prev => prev - 1);
      setTimeout(() => {
        isAnimatingRef.current = false;
      }, 300);
    }
  };

  // Navegação por teclado (desktop)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (window.innerWidth >= 1024) {
        if (e.key === "ArrowDown") {
          goToNextVideo();
        } else if (e.key === "ArrowUp") {
          goToPreviousVideo();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, displayListings.length, goToNextVideo, goToPreviousVideo]);

  // Navegação por scroll do mouse (desktop)
  useEffect(() => {
    if (window.innerWidth < 1024) return;

    const handleWheel = (event: WheelEvent) => {
      if (isAnimatingRef.current) return;

      if (event.deltaY > 30) {
        goToNextVideo();
      } else if (event.deltaY < -30) {
        goToPreviousVideo();
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [currentIndex, displayListings.length, goToNextVideo, goToPreviousVideo]);

  // Carregar mais quando chegar perto do final
  useEffect(() => {
    if (currentIndex >= displayListings.length - 3 && hasMore && !isLoadingMore) {
      loadMore();
    }
  }, [currentIndex, displayListings.length, hasMore, isLoadingMore, loadMore]);

  // Logs de sanidade
  console.log("FEED_FINAL_DEBUG", {
    isFeedReady,
    hasDeepLinked,
    currentIndex,
    feedLen: feedListings.length,
    feedIds: feedListings.map((l) => l.id),
  });

  if (loading || !isFeedReady) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Carregando anúncios...</p>
      </div>
    );
  }

  if (displayListings.length === 0) {
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
          <button 
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-white/10 transition-colors text-white font-medium"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
            </svg>
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

      {/* Desktop Navigation Controls */}
      <div className="hidden md:flex fixed right-8 top-1/2 -translate-y-1/2 z-40 flex-col gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPreviousVideo}
          disabled={currentIndex === 0}
          className="w-10 h-10 rounded-full hover:bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronUp className="w-6 h-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextVideo}
          disabled={currentIndex >= displayListings.length - 1}
          className="w-10 h-10 rounded-full hover:bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronDown className="w-6 h-6" />
        </Button>
      </div>

      {/* Content */}
      <main className="pt-14 md:pt-0 md:ml-64">
      {/* Mobile: Feed vertical com scroll */}
        <div className="md:hidden snap-y snap-mandatory overflow-y-scroll no-scrollbar h-[calc(100vh-56px)] feed-scroll" data-scroll-root="true">
          {feedListings.map((listing, index) => (
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
              isActive={index === currentIndex}
              isFeedReady={isFeedReady}
              isPriority={index === 0}
            />
          ))}
          <InfiniteScrollTrigger 
            onLoadMore={loadMore}
            isLoading={isLoadingMore}
            hasMore={hasMore}
          />
        </div>

        {/* Desktop: Um vídeo único, centralizado, estilo TikTok */}
        <div className="hidden md:flex items-center justify-center h-screen overflow-hidden">
          {feedListings[currentIndex] && (
            <div className="relative w-full h-full flex items-center justify-center">
              <VehicleCard 
                key={feedListings[currentIndex].id}
                id={feedListings[currentIndex].id}
                title={feedListings[currentIndex].brand_model}
                price={`R$ ${feedListings[currentIndex].price?.toFixed(2).replace('.', ',')}`}
                location={`${feedListings[currentIndex].city || ''}, ${feedListings[currentIndex].state || ''}`}
                distance={feedListings[currentIndex].distance_km ? `${feedListings[currentIndex].distance_km.toFixed(1)} km` : "--"}
                views={feedListings[currentIndex].views}
                image={feedListings[currentIndex].thumbnail_url || feedListings[currentIndex].images?.[0] || "https://images.unsplash.com/photo-1558981852-426c6c22a060?w=800&q=80"}
                videoUrl={feedListings[currentIndex].video_url}
                category={feedListings[currentIndex].category}
                acceptsTrade={feedListings[currentIndex].accepts_trade}
                variant="feed"
                sellerId={feedListings[currentIndex].user_id}
                listingId={feedListings[currentIndex].id}
                sellerName={feedListings[currentIndex].profiles?.name}
                sellerAvatar={feedListings[currentIndex].profiles?.photo_url}
                recommendationReason={feedListings[currentIndex].recommendation_reason}
                isActive={true}
                isFeedReady={isFeedReady}
                isPriority={true}
              />
            </div>
          )}
        </div>
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
