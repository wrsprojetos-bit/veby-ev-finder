import { Heart, MessageCircle, Share2, BookmarkPlus, UserPlus, MapPin, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthRequired } from "@/hooks/useAuthRequired";
import { toast } from "sonner";
import { useChat } from "@/hooks/useChat";
import { useNavigate } from "react-router-dom";

interface VehicleCardProps {
  id?: any;
  title: string;
  price: string;
  location: string;
  distance: string;
  views: number;
  likes: number;
  image: string;
  category: string;
  acceptsTrade?: boolean;
  isLiked?: boolean;
  isFavorited?: boolean;
  variant?: "feed" | "list";
  sellerId?: string;
  listingId?: string;
}

export const VehicleCard = ({
  id,
  title,
  price,
  location,
  distance,
  views,
  likes,
  image,
  category,
  acceptsTrade = false,
  isLiked = false,
  isFavorited = false,
  variant = "feed",
  sellerId,
  listingId,
}: VehicleCardProps) => {
  const { requireAuth, LoginDialog } = useAuthRequired();
  const { findOrCreateChat } = useChat();
  const navigate = useNavigate();

  const handleLike = () => {
    requireAuth(() => {
      toast.success("Curtido!");
    });
  };

  const handleComment = () => {
    requireAuth(() => {
      toast.info("Abrindo comentários...");
    });
  };

  const handleFavorite = () => {
    requireAuth(() => {
      toast.success("Favoritado!");
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

  const handleFollow = () => {
    requireAuth(() => {
      toast.success("Seguindo!");
    });
  };

  if (variant === "list") {
    return (
      <div className="flex gap-3 p-3 bg-card rounded-xl border border-border hover:border-primary/50 transition-all">
        <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
          <img src={image} alt={title} className="w-full h-full object-cover" />
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
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              {likes}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <LoginDialog />
      <div className="relative w-full h-screen snap-start">
        {/* Background Image - Full Screen */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
        </div>

        {/* Right Side Actions - TikTok Style */}
        <div className="absolute right-2 bottom-24 flex flex-col items-center gap-5 z-20">
          {/* Profile Avatar with Follow Button */}
          <div className="relative">
            <Avatar className="w-12 h-12 border-2 border-white">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=seller" />
              <AvatarFallback>VD</AvatarFallback>
            </Avatar>
            <button onClick={handleFollow} className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>

          {/* Like Button */}
          <button onClick={handleLike} className="flex flex-col items-center gap-1">
            <Heart
              className={cn(
                "w-8 h-8 transition-all",
                isLiked ? "fill-primary text-primary" : "text-white"
              )}
            />
            <span className="text-xs font-semibold text-white drop-shadow-lg">{likes}</span>
          </button>

          {/* Message Button */}
          <button onClick={handleMessage} className="flex flex-col items-center gap-1">
            <MessageCircle className="w-8 h-8 text-white fill-white" />
            <span className="text-xs font-semibold text-white drop-shadow-lg">Chat</span>
          </button>

          {/* Bookmark Button */}
          <button onClick={handleFavorite} className="flex flex-col items-center gap-1">
            <BookmarkPlus
              className={cn(
                "w-8 h-8 transition-all",
                isFavorited ? "fill-secondary text-secondary" : "text-white"
              )}
            />
            <span className="text-xs font-semibold text-white drop-shadow-lg">182</span>
          </button>

          {/* Share Button */}
          <button className="flex flex-col items-center gap-1">
            <Share2 className="w-8 h-8 text-white" />
            <span className="text-xs font-semibold text-white drop-shadow-lg">148</span>
          </button>
        </div>

        {/* Bottom Info Overlay - TikTok Style */}
        <div className="absolute inset-x-0 bottom-20 px-4 pb-4 space-y-3 z-10">
          {/* User Info */}
          <div className="flex items-center gap-2">
            <h3 className="text-white font-semibold text-base">@{title.toLowerCase().replace(/\s+/g, '_')}</h3>
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <p className="text-white text-sm">
              {price} • {location} • {distance}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-primary text-xs">#{category}</span>
              {acceptsTrade && (
                <span className="text-secondary text-xs">#aceitatroca</span>
              )}
            </div>
          </div>

          {/* Botão de Negociação - Grande e Destacado */}
          <Button
            onClick={handleMessage}
            size="lg"
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-bold text-base shadow-lg"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Negociar com o vendedor
          </Button>
        </div>
      </div>
    </>
  );
};
