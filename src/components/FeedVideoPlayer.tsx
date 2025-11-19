import React, { useEffect, useRef } from "react";

type FeedVideoPlayerProps = {
  listingId: string;
  videoUrl: string;
  posterUrl?: string;
  isActive: boolean;     // true quando é o vídeo atual do feed
  isFeedReady: boolean;  // true quando o feed já decidiu qual vídeo mostrar
  muted?: boolean;       // estado global de mute (por enquanto pode deixar sempre true)
};

export const FeedVideoPlayer: React.FC<FeedVideoPlayerProps> = ({
  listingId,
  videoUrl,
  posterUrl,
  isActive,
  isFeedReady,
  muted = true,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Debug mobile
  useEffect(() => {
    console.log("MOBILE_FEED_DEBUG", {
      userAgent: navigator.userAgent,
      isMobile: window.innerWidth < 768,
      listingId,
      videoUrl,
      isActive,
      isFeedReady,
    });
  }, [listingId, videoUrl, isActive, isFeedReady]);

  // Tentativa de autoplay segura
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
    video.muted = muted;
    (video as any).playsInline = true;
    video.autoplay = true;

    const tryPlay = () => {
      const p = video.play();
      if (p !== undefined) {
        p.then(() => {
          console.log("VIDEO_AUTOPLAY_OK", { listingId, src: video.src });
        }).catch((err) => {
          console.error("VIDEO_AUTOPLAY_ERR", { listingId, err, readyState: video.readyState, src: video.currentSrc });
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
  }, [isActive, isFeedReady, videoUrl, muted, listingId]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-cover"
        poster={posterUrl}
        loop
        preload="auto"
        muted={muted}
        playsInline
        autoPlay
        disablePictureInPicture
        crossOrigin="anonymous"
        onLoadedMetadata={() => {
          console.log("VIDEO_LOADED_METADATA", { 
            listingId, 
            readyState: videoRef.current?.readyState,
            videoWidth: videoRef.current?.videoWidth,
            videoHeight: videoRef.current?.videoHeight,
          });
        }}
        onError={(e) => {
          console.error("VIDEO_ERROR", { 
            listingId, 
            error: videoRef.current?.error,
            src: videoUrl,
          });
        }}
      />
    </div>
  );
};
