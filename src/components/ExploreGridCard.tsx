import { Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ExploreGridCardProps {
  id: string;
  title: string;
  price: string;
  thumbnail?: string; // capa do vídeo ou imagem principal
  videoUrl?: string;  // usado para mostrar ícone de play
  views: number;
  onClick?: () => void;
}

export const ExploreGridCard = ({
  id,
  title,
  price,
  thumbnail,
  videoUrl,
  views,
  onClick,
}: ExploreGridCardProps) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const displayImage = thumbnail || "https://images.unsplash.com/photo-1558981852-426c6c22a060?w=800&q=80";
  const hasVideo = Boolean(videoUrl);

  return (
    <div
      onClick={handleClick}
      className="relative aspect-[9/16] rounded-lg overflow-hidden cursor-pointer group"
      style={{ aspectRatio: '9/16' }}
    >
      {/* Capa estática */}
      <img
        src={displayImage}
        alt={`${title} - capa do anúncio`}
        loading="lazy"
        decoding="async"
        width="281"
        height="500"
        style={{ aspectRatio: '9/16' }}
        className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
      />

      {/* Ícone de Play (se houver vídeo) */}
      {hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 group-hover:scale-110 transition-transform">
            <Play className="w-8 h-8 text-black fill-black" />
          </div>
        </div>
      )}

      {/* Informações */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3">
        <p className="text-white font-bold text-sm line-clamp-2 mb-1">{title}</p>
        <div className="flex items-center justify-between">
          <span className="text-[#00FF7F] font-bold text-sm">{price}</span>
          <span className="text-white/70 text-xs">{views.toLocaleString()} visualizações</span>
        </div>
      </div>
    </div>
  );
};
