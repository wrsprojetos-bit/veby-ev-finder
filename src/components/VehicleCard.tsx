import { Heart, Eye, Share2, Star, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VehicleCardProps {
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
}

export const VehicleCard = ({
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
}: VehicleCardProps) => {
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
    <div className="relative w-full h-[calc(100vh-8rem)] snap-start">
      {/* Background Image */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-x-0 bottom-0 p-6 space-y-4">
        {/* Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-medium rounded-full backdrop-blur-sm border border-primary/30">
              {category}
            </span>
            {acceptsTrade && (
              <span className="px-3 py-1 bg-secondary/20 text-secondary text-xs font-medium rounded-full backdrop-blur-sm border border-secondary/30">
                Aceita troca
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          <p className="text-3xl font-bold text-primary">{price}</p>
          <div className="flex items-center gap-2 text-sm text-foreground/80">
            <MapPin className="w-4 h-4" />
            <span>{location}</span>
            <span>•</span>
            <span>{distance}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button className="flex flex-col items-center gap-1">
              <Heart
                className={cn(
                  "w-8 h-8 transition-all",
                  isLiked && "fill-primary text-primary drop-shadow-glow-primary"
                )}
              />
              <span className="text-xs font-medium">{likes}</span>
            </button>
            <button className="flex flex-col items-center gap-1">
              <Eye className="w-8 h-8" />
              <span className="text-xs font-medium">{views}</span>
            </button>
            <button className="flex flex-col items-center gap-1">
              <Share2 className="w-8 h-8" />
            </button>
            <button className="flex flex-col items-center gap-1">
              <Star
                className={cn(
                  "w-8 h-8 transition-all",
                  isFavorited && "fill-secondary text-secondary drop-shadow-glow-secondary"
                )}
              />
            </button>
          </div>
          <Button className="bg-gradient-primary text-primary-foreground font-semibold shadow-glow-primary hover:scale-105 transition-transform">
            Fazer Negócio
          </Button>
        </div>
      </div>
    </div>
  );
};
