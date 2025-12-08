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
    // Se for URL R2 privada, converter para pública
    if (url.includes('r2.cloudflarestorage.com')) {
      // Extrair o nome do arquivo do caminho
      const match = url.match(/veby-videos\/[^/]+\/(.+)$/);
      if (match && match[1]) {
        const publicUrl = `https://pub-f8bd655895704ae0920c77e678028442.r2.dev/videos/${match[1]}`;
        console.log("🔄 Convertendo URL R2 privada para pública:", { original: url, converted: publicUrl });
        return publicUrl;
      }
    }
    return url;
  };

  const processedVideoUrl = getPublicVideoUrl(videoUrl);

  // Log da URL do vídeo
  useEffect(() => {
    console.log("🎬 VIDEO_URL_DEBUG", { 
      listingId, 
      videoUrl: processedVideoUrl,
      videoUrlLength: processedVideoUrl?.length || 0,
      isR2: processedVideoUrl?.includes('r2.dev') || processedVideoUrl?.includes('r2.cloudflarestorage') || processedVideoUrl?.includes('pub-') || false,
      isGoogleStorage: processedVideoUrl?.includes('googleapis.com') || false,
      wasConverted: processedVideoUrl !== videoUrl
    });
  }, [listingId, videoUrl, processedVideoUrl]);

  // Log do estado do vídeo
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    console.log("VIDEO_READY_DEBUG", {
      listingId,
      readyState: video.readyState,
      paused: video.paused,
      src: video.currentSrc,
      isActive,
      isFeedReady,
    });
  }, [listingId, isActive, isFeedReady, videoUrl]);

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
    video.muted = isMuted;
    (video as any).playsInline = true;
    video.autoplay = true;

    const tryPlay = () => {
      // Forçar muted antes de tentar play (requerido por browsers)
      video.muted = true;
      
      // Garantir que o vídeo tem a URL correta
      if (video.src !== processedVideoUrl) {
        video.src = processedVideoUrl;
        video.load();
      }
      
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log("VIDEO_AUTOPLAY_OK", { listingId, readyState: video.readyState });
          // Aplicar estado de mute global após play bem sucedido
          video.muted = isMuted;
        }).catch((err) => {
          console.warn("VIDEO_AUTOPLAY_RETRY", { listingId, error: err.message });
          // Retry com delay
          setTimeout(() => {
            if (video && isActive && isFeedReady) {
              video.muted = true;
              video.play().catch(() => {});
            }
          }, 200);
        });
      }
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
      
      // Timeout fallback - tentar play mesmo se canplay não disparar
      const timeoutId = setTimeout(() => {
        video.removeEventListener("canplay", onCanPlay);
        if (video.readyState >= 1) {
          tryPlay();
        }
      }, 1000);
      
      return () => {
        video.removeEventListener("canplay", onCanPlay);
        clearTimeout(timeoutId);
      };
    }
  }, [isActive, isFeedReady, isMuted, processedVideoUrl, listingId]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <video
        ref={videoRef}
        src={processedVideoUrl}
        className="max-h-full max-w-full object-contain"
        poster={posterUrl}
        loop
        preload="auto"
        muted={isMuted}
        playsInline
        autoPlay
        disablePictureInPicture
        crossOrigin="anonymous"
      />
    </div>
  );
};
