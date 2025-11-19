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
      const p = video.play();
      if (p !== undefined) {
        p.then(() => {
          console.log("VIDEO_AUTOPLAY_OK", { listingId, src: video.currentSrc });
        }).catch((err) => {
          console.error("VIDEO_AUTOPLAY_ERR", {
            listingId,
            err,
            readyState: video.readyState,
            src: video.currentSrc,
          });
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
  }, [isActive, isFeedReady, isMuted, videoUrl, listingId]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <video
        ref={videoRef}
        src={videoUrl}
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
