import { useState, useRef, useEffect } from "react";
import { Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ExploreGridCardProps {
  id: string;
  title: string;
  price: string;
  thumbnail?: string;
  preview?: string;
  videoUrl?: string;
  image?: string;
  views: number;
}

export const ExploreGridCard = ({
  id,
  title,
  price,
  thumbnail,
  preview,
  videoUrl,
  image,
  views,
}: ExploreGridCardProps) => {
  const navigate = useNavigate();
  const [showPreview, setShowPreview] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer para lazy loading e autoplay do preview
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            // Após 300ms no viewport, ativa o preview
            const timer = setTimeout(() => {
              if (entry.isIntersecting) {
                setShowPreview(true);
              }
            }, 300);
            return () => clearTimeout(timer);
          } else {
            setIsInView(false);
            setShowPreview(false);
          }
        });
      },
      {
        threshold: 0.5, // 50% visível
        rootMargin: "50px", // Pré-carrega quando estiver próximo
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  // Autoplay do preview quando ativo
  useEffect(() => {
    if (showPreview && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Silenciosamente ignora erro de autoplay
      });
    } else if (!showPreview && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [showPreview]);

  const handleClick = () => {
    navigate(`/?listing=${id}`);
  };

  // Define a imagem a ser mostrada
  const displayImage = thumbnail || image || "https://images.unsplash.com/photo-1558981852-426c6c22a060?w=800&q=80";
  const hasVideo = videoUrl || preview;

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className="relative aspect-[9/16] rounded-lg overflow-hidden cursor-pointer group"
    >
      {/* Thumbnail estática */}
      {!showPreview && (
        <img
          src={displayImage}
          alt={title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
        />
      )}

      {/* Preview animado (3s loop) */}
      {showPreview && preview && (
        <video
          ref={videoRef}
          src={preview}
          className="absolute inset-0 w-full h-full object-cover"
          loop
          muted
          playsInline
          preload="metadata"
        />
      )}

      {/* Ícone de Play (oculto quando preview está ativo) */}
      {hasVideo && !showPreview && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="bg-white/80 backdrop-blur-sm rounded-full p-3 group-hover:scale-110 transition-transform">
            <Play className="w-8 h-8 text-black fill-black" />
          </div>
        </div>
      )}

      {/* Overlay com informações */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3">
        <p className="text-white font-bold text-sm line-clamp-2 mb-1">
          {title}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[#00FF7F] font-bold text-sm">
            {price}
          </span>
          <span className="text-white/70 text-xs">
            {views.toLocaleString()} visualizações
          </span>
        </div>
      </div>
    </div>
  );
};
