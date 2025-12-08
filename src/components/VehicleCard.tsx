import { Heart, MessageCircle, Share2, BookmarkPlus, MapPin, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthRequired } from "@/hooks/useAuthRequired";
import { toast } from "sonner";
import { useChat } from "@/hooks/useChat";
import { useLikesAndFavorites } from "@/hooks/useLikesAndFavorites";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useViewTracking } from "@/hooks/useViewTracking";
import { useGlobalAudio } from "@/contexts/GlobalAudioContext";
import { FeedVideoPlayer } from "./FeedVideoPlayer";

interface VehicleCardProps {
  id?: any;
  title: string;
  price: string;
  location: string;
  distance?: string;
  views: number;
  image: string;
  videoUrl?: string;
  category: string;
  acceptsTrade?: boolean;
  variant?: "feed" | "list";
  sellerId?: string;
  listingId?: string;
  sellerName?: string;
  sellerAvatar?: string;
  recommendationReason?: string;
  isPriority?: boolean;
  isActive?: boolean;
  isFeedReady?: boolean;
  onCardClick?: () => void;
}

export const VehicleCard = ({
  id,
  title,
  price,
  location,
  distance,
  views,
  image,
  videoUrl,
  category,
  acceptsTrade = false,
  variant = "feed",
  sellerId,
  listingId = "",
  sellerName = "Vendedor",
  sellerAvatar,
  recommendationReason,
  isPriority = false,
  isActive = true,
  isFeedReady = true,
  onCardClick,
}: VehicleCardProps) => {
  const { requireAuth, LoginDialog } = useAuthRequired();
  const { findOrCreateChat } = useChat();
  const navigate = useNavigate();
  const { isLiked, isFavorited, likesCount, toggleLike, toggleFavorite } = useLikesAndFavorites(listingId);
  const { isGlobalMuted, toggleGlobalMute } = useGlobalAudio();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Rastrear visualização (no feed, o vídeo é ativo quando isActive = true)
  useViewTracking(listingId, isActive && variant === "feed");

  const handleLike = () => {
    requireAuth(() => {
      toggleLike();
    });
  };

  const handleComment = () => {
    requireAuth(() => {
      toast.info("Abrindo comentários...");
    });
  };

  const handleFavorite = () => {
    requireAuth(() => {
      toggleFavorite();
    });
  };

  const handleMessage = async () => {
    if (!sellerId || !listingId) {
      toast.error("Informações do anúncio não disponíveis");
      return;
    }
    
    requireAuth(async () => {
      const chatId = await findOrCreateChat(listingId, sellerId);
      
      if (chatId) {
        navigate(`/chat?chatId=${chatId}`);
      }
    });
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/?listing=${listingId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Confira este anúncio: ${title} - ${price}`,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl);
      toast.success("Link copiado para a área de transferência!");
    }
  };

  if (variant === "list") {
    const handleListClick = () => {
      if (onCardClick) {
        onCardClick();
      }
    };

    return (
      <div 
        onClick={handleListClick}
        className="flex gap-3 p-3 bg-card rounded-xl border border-border hover:border-primary/50 transition-all cursor-pointer"
      >
        <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden" style={{ aspectRatio: '1/1' }}>
          <img src={image} alt={title} className="w-full h-full object-cover" width="96" height="96" style={{ aspectRatio: '1/1' }} decoding="async" loading="lazy" />
          {acceptsTrade && (
            <div className="absolute top-1 right-1 bg-secondary/90 text-secondary-foreground text-xs px-2 py-0.5 rounded">
              Troca
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">{title}</h3>
          <p className="text-primary font-bold text-lg">{price}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <MapPin className="w-3 h-3" />
            <span>{location}</span>
            <span>•</span>
            <span>{distance}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {views}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <LoginDialog />
      <div className="relative w-full h-[calc(100vh-56px)] md:h-screen md:max-w-[500px] snap-start snap-always bg-black feed-item md:rounded-lg md:overflow-hidden md:shadow-2xl">
        {/* Background Video or Image - Full Screen */}
        <div 
          className="absolute inset-0 overflow-hidden"
        >
          {videoUrl && videoUrl.endsWith('.mp4') ? (
            <FeedVideoPlayer
              listingId={listingId}
              videoUrl={videoUrl}
              posterUrl={image}
              isActive={isActive}
              isFeedReady={isFeedReady}
              isMuted={isGlobalMuted}
            />
          ) : (
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover"
              width="500"
              height="889"
              decoding="async"
              loading="eager"
              {...(isPriority && { fetchpriority: 'high' as any })}
            />
          )}
          
          {/* Botão de controle de áudio */}
          {videoUrl && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleGlobalMute();
              }}
              className="absolute right-4 top-20 bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors z-20"
            >
              {isGlobalMuted ? (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              )}
            </button>
          )}
          
          {/* Selo de Recomendação */}
          {recommendationReason && (
            <div className="absolute top-20 left-4 bg-gradient-to-r from-[#00FF7F] to-[#00D4FF] text-black px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
              <span className="text-lg">🔥</span>
              <span className="text-xs font-bold capitalize">{recommendationReason}</span>
            </div>
          )}
        </div>

        {/* Right Side Actions - TikTok Style */}
        <div className="absolute right-3 bottom-20 flex flex-col items-center gap-4 z-20">
          {/* Profile Avatar - Click to view seller profile */}
          <button 
            onClick={() => {
              if (sellerId) {
                navigate(`/profile?userId=${sellerId}`);
              } else {
                toast.error("Informações do vendedor não disponíveis");
              }
            }} 
            className="relative"
          >
            <Avatar className="w-11 h-11 border-2 border-white shadow-lg">
              <AvatarImage src={sellerAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sellerId}`} />
              <AvatarFallback>{sellerName?.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </button>

          {/* Like Button */}
          <button onClick={handleLike} className="flex flex-col items-center gap-0.5">
            <Heart
              className={cn(
                "w-7 h-7 transition-all drop-shadow-lg",
                isLiked ? "fill-red-500 text-red-500" : "text-white"
              )}
            />
            <span className="text-xs font-semibold text-white drop-shadow-lg">{likesCount}</span>
          </button>

          {/* Comment Button */}
          <button onClick={handleComment} className="flex flex-col items-center gap-0.5">
            <MessageCircle className="w-7 h-7 text-white drop-shadow-lg" />
          </button>

          {/* Bookmark Button */}
          <button onClick={handleFavorite} className="flex flex-col items-center gap-0.5">
            <BookmarkPlus
              className={cn(
                "w-7 h-7 transition-all drop-shadow-lg",
                isFavorited ? "fill-yellow-400 text-yellow-400" : "text-white"
              )}
            />
          </button>

          {/* Share Button */}
          <button onClick={handleShare} className="flex flex-col items-center gap-0.5">
            <Share2 className="w-7 h-7 text-white drop-shadow-lg" />
          </button>
        </div>

        {/* Bottom Info Overlay - TikTok Style */}
        <div className="absolute inset-x-0 bottom-0 z-10">
          {/* Faixa Preta Semi-Transparente */}
          <div 
            className={cn(
              "bg-black/50 px-4 py-3 transition-all duration-300",
              isExpanded ? "max-h-[60vh] overflow-y-auto" : "max-h-auto"
            )}
          >
            {/* User Info com Botão Negociar */}
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-white font-bold text-sm drop-shadow-lg">@{sellerName.toLowerCase().replace(/\s+/g, '_')}</h3>
              <Button
                onClick={handleMessage}
                className="h-7 px-4 bg-transparent hover:bg-white/10 text-white font-semibold text-xs border border-white/80 rounded-full"
              >
                Negociar
              </Button>
            </div>
            
            {/* Título do Produto */}
            <p className="text-white text-base font-bold mb-1 drop-shadow-lg">
              {title}
            </p>
            
            {/* Preço, Localização e Distância com Ver Mais */}
            <div className="flex items-center gap-1 text-white/90 text-sm drop-shadow-lg">
              <span>{price}</span>
              <span>•</span>
              <span>{location}</span>
              <span>•</span>
              <span>{distance}</span>
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="ml-2 text-white/70 hover:text-white font-semibold"
              >
                ...ver mais
              </button>
            </div>
            
            {/* Conteúdo Expandido */}
            {isExpanded && (
              <div className="mt-4 space-y-3 text-white">
                <div>
                  <h4 className="font-bold mb-1">Descrição</h4>
                  <p className="text-sm text-white/90">
                    {title} em ótimo estado de conservação.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-bold mb-1">Informações</h4>
                  <div className="text-sm text-white/90 space-y-1">
                    <p>💰 Preço: {price}</p>
                    <p>📍 Localização: {location}</p>
                    <p>📏 Distância: {distance}</p>
                    <p>👁️ Visualizações: {views}</p>
                    {acceptsTrade && <p>🔄 Aceita Troca</p>}
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[#00FFB2] text-xs font-semibold">#{category}</span>
                  {acceptsTrade && (
                    <span className="bg-[#FF2C2C] text-white text-xs font-bold px-2 py-0.5 rounded">
                      Aceita Troca
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};