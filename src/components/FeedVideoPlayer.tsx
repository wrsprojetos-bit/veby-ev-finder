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
      try {
        video.pause();
        video.currentTime = 0;
      } catch {}
      return;
    }

    // Configurações obrigatórias pra autoplay mobile/desktop
    video.muted = isMuted;
    (video as any).playsInline = true;
    video.autoplay = true;

    const tryPlay = () => {
      // Forçar muted antes de tentar play
      video.muted = true;
      
      const p = video.play();
      if (p !== undefined) {
        p.then(() => {
          console.log("VIDEO_AUTOPLAY_OK", { 
            listingId, 
            src: video.currentSrc,
            readyState: video.readyState,
            paused: video.paused,
            muted: video.muted,
            playsInline: (video as any).playsInline,
          });
        }).catch((err) => {
          console.error("VIDEO_AUTOPLAY_ERR", {
            listingId,
            err: err.message,
            name: err.name,
            readyState: video.readyState,
            src: video.currentSrc,
            paused: video.paused,
            muted: video.muted,
          });
          
          // Tentar novamente após 100ms
          setTimeout(() => {
            if (video && isActive && isFeedReady) {
              console.log("VIDEO_RETRY_PLAY", { listingId });
              video.muted = true;
              video.play().catch(console.error);
            }
          }, 100);
        });
      }
    };

    if (video.readyState >= 2) {
      // Já tem metadata suficiente
      tryPlay();
    } else {
      const onLoaded = () => {
        tryPlay();
        video.removeEventListener("loadedmetadata", onLoaded);
      };
      video.addEventListener("loadedmetadata", onLoaded);
      return () => {
        video.removeEventListener("loadedmetadata", onLoaded);
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
