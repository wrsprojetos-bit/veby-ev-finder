import { Heart, MessageCircle, Share2, BookmarkPlus, MapPin, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthRequired } from "@/hooks/useAuthRequired";
import { toast } from "sonner";
import { useChat } from "@/hooks/useChat";
import { useLikesAndFavorites } from "@/hooks/useLikesAndFavorites";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface VehicleCardProps {
  id?: any;
  title: string;
  price: string;
  location: string;
  distance: string;
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
}: VehicleCardProps) => {
  const { requireAuth, LoginDialog } = useAuthRequired();
  const { findOrCreateChat } = useChat();
  const navigate = useNavigate();
  const { isLiked, isFavorited, likesCount, toggleLike, toggleFavorite } = useLikesAndFavorites(listingId);
  const [isExpanded, setIsExpanded] = useState(false);

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
    return (
      <div className="flex gap-3 p-3 bg-card rounded-xl border border-border hover:border-primary/50 transition-all">
        <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
          {videoUrl ? (
            <video 
              src={videoUrl} 
              className="w-full h-full object-cover"
              muted
              playsInline
            />
          ) : (
            <img src={image} alt={title} className="w-full h-full object-cover" />
          )}
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
      <div className="relative w-full h-screen snap-start bg-black">
        {/* Background Video/Image - Full Screen */}
        <div className="absolute inset-0 overflow-hidden">
          {videoUrl ? (
            <video
              src={videoUrl}
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
          ) : (
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Right Side Actions - TikTok Style */}
        <div className="absolute right-3 bottom-40 flex flex-col items-center gap-4 z-20">
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
            <span className="text-xs font-semibold text-white drop-shadow-lg">182</span>
          </button>

          {/* Share Button */}
          <button onClick={handleShare} className="flex flex-col items-center gap-0.5">
            <Share2 className="w-7 h-7 text-white drop-shadow-lg" />
          </button>
        </div>

        {/* Bottom Info Overlay - TikTok Style */}
        <div className="absolute inset-x-0 bottom-24 z-10">
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
