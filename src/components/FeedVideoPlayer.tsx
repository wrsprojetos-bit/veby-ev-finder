import React, { useEffect, useRef } from "react";

type FeedVideoPlayerProps = {
  listingId: string;
  videoUrl: string;
  posterUrl?: string;
  isActive: boolean;
  isFeedReady: boolean;
  isMuted: boolean;
};

export const FeedVideoPlayer: React.FC<FeedVideoPlayerProps> = ({
  listingId,
  videoUrl,
  posterUrl,
  isActive,
  isFeedReady,
  isMuted,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Converter URLs R2 privadas para públicas
  const getPublicVideoUrl = (url: string): string => {
    if (!url) return url;
    
    // Se for URL R2 privada, converter para pública
    if (url.includes('r2.cloudflarestorage.com')) {
      const match = url.match(/veby-videos\/[^/]+\/(.+?)(\?|$)/);
      if (match && match[1]) {
        return `https://pub-f8bd655895704ae0920c77e678028442.r2.dev/videos/${match[1]}`;
      }
    }
    return url;
  };

  const processedVideoUrl = getPublicVideoUrl(videoUrl);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Se não é o ativo ou o feed ainda não está pronto: pausa e reseta
    if (!isActive || !isFeedReady) {
      video.pause();
      video.currentTime = 0;
      return;
    }

    // Configurações obrigatórias pra autoplay mobile/desktop
    video.muted = true; // Sempre começar muted para garantir autoplay
    video.playsInline = true;

    const tryPlay = () => {
      if (!video || video.paused === false) return;
      
      video.muted = true;
      
      video.play()
        .then(() => {
          // Aplicar estado de mute global após play bem sucedido
          video.muted = isMuted;
        })
        .catch((err) => {
          console.warn("Autoplay blocked:", err.message);
          // Retry uma vez após interação do usuário
          const handleInteraction = () => {
            video.muted = true;
            video.play().catch(() => {});
            document.removeEventListener('click', handleInteraction);
            document.removeEventListener('touchstart', handleInteraction);
          };
          document.addEventListener('click', handleInteraction, { once: true });
          document.addEventListener('touchstart', handleInteraction, { once: true });
        });
    };

    // Esperar pelo carregamento mínimo antes de tentar play
    if (video.readyState >= 2) {
      tryPlay();
    } else {
      const onCanPlay = () => {
        tryPlay();
        video.removeEventListener("canplay", onCanPlay);
      };
      video.addEventListener("canplay", onCanPlay);
      
      return () => {
        video.removeEventListener("canplay", onCanPlay);
      };
    }
  }, [isActive, isFeedReady, isMuted, processedVideoUrl, listingId]);

  // Sincronizar estado de mute quando mudar globalmente
  useEffect(() => {
    const video = videoRef.current;
    if (video && isActive) {
      video.muted = isMuted;
    }
  }, [isMuted, isActive]);

  if (!processedVideoUrl) return null;

  return (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <video
        ref={videoRef}
        src={processedVideoUrl}
        className="max-h-full max-w-full object-contain"
        poster={posterUrl}
        loop
        preload="auto"
        muted
        playsInline
        disablePictureInPicture
      />
    </div>
  );
};
