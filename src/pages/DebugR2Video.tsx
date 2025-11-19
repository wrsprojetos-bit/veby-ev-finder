import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function DebugR2Video() {
  const [videoUrls, setVideoUrls] = useState<{ id: string; url: string; title: string }[]>([]);
  const [selectedUrl, setSelectedUrl] = useState<string>("");
  const [videoInfo, setVideoInfo] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadR2Videos();
  }, []);

  const loadR2Videos = async () => {
    // Buscar vídeos do R2 (que começam com pub- ou contém r2.dev ou r2.cloudflarestorage)
    const { data, error } = await supabase
      .from("listings")
      .select("id, brand_model, video_url")
      .or("video_url.like.%r2.dev%,video_url.like.%r2.cloudflarestorage%,video_url.like.%pub-%")
      .eq("status", "ativo")
      .limit(10);

    if (data && !error) {
      const urls = data.map((listing) => ({
        id: listing.id,
        url: listing.video_url || "",
        title: listing.brand_model || "Sem título",
      }));
      setVideoUrls(urls);
      if (urls.length > 0) {
        setSelectedUrl(urls[0].url);
      }
    }
  };

  const handleVideoEvent = (event: string, details?: any) => {
    console.log(`DEBUG_R2_${event.toUpperCase()}`, details);
    setVideoInfo((prev: any) => ({ ...prev, [event]: details }));
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold">Debug R2 Video Autoplay</h1>
        </div>

        {/* Seletor de vídeo */}
        <div className="space-y-2">
          <label className="text-sm text-white/70">Vídeos do R2 no banco:</label>
          <select
            value={selectedUrl}
            onChange={(e) => setSelectedUrl(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
          >
            {videoUrls.map((video) => (
              <option key={video.id} value={video.url}>
                {video.title} - {video.url.substring(0, 50)}...
              </option>
            ))}
          </select>
        </div>

        {/* URL atual */}
        <div className="space-y-2">
          <label className="text-sm text-white/70">URL testada:</label>
          <div className="bg-white/5 border border-white/10 rounded p-3 break-all text-sm">
            {selectedUrl || "Nenhuma URL selecionada"}
          </div>
        </div>

        {/* Player de teste */}
        <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
          <div className="relative aspect-[9/16] max-h-[600px] mx-auto bg-black flex items-center justify-center">
            {selectedUrl ? (
              <video
                key={selectedUrl}
                src={selectedUrl}
                muted
                playsInline
                autoPlay
                loop
                preload="auto"
                crossOrigin="anonymous"
                className="max-h-full max-w-full object-contain"
                onLoadedMetadata={(e) => {
                  const video = e.currentTarget;
                  handleVideoEvent("loadedmetadata", {
                    readyState: video.readyState,
                    videoWidth: video.videoWidth,
                    videoHeight: video.videoHeight,
                    duration: video.duration,
                  });
                }}
                onCanPlay={(e) => {
                  handleVideoEvent("canplay", {
                    readyState: e.currentTarget.readyState,
                  });
                }}
                onPlay={() => handleVideoEvent("play", { timestamp: Date.now() })}
                onPause={() => handleVideoEvent("pause", { timestamp: Date.now() })}
                onError={(e) => {
                  const video = e.currentTarget;
                  handleVideoEvent("error", {
                    error: video.error?.message,
                    code: video.error?.code,
                    src: video.currentSrc,
                  });
                }}
                onStalled={() => handleVideoEvent("stalled")}
                onWaiting={() => handleVideoEvent("waiting")}
              />
            ) : (
              <p className="text-white/50">Selecione um vídeo</p>
            )}
          </div>
        </div>

        {/* Info do vídeo */}
        <div className="space-y-2">
          <label className="text-sm text-white/70">Eventos do vídeo:</label>
          <div className="bg-white/5 border border-white/10 rounded p-4">
            <pre className="text-xs overflow-auto max-h-96">
              {JSON.stringify(videoInfo, null, 2)}
            </pre>
          </div>
        </div>

        {/* Instruções */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-2">
          <h3 className="font-semibold text-blue-400">Como testar:</h3>
          <ul className="text-sm text-white/80 space-y-1 list-disc list-inside">
            <li>Selecione um vídeo do R2 na lista</li>
            <li>Verifique se o vídeo toca automaticamente (autoplay)</li>
            <li>Observe os eventos no console do navegador (F12)</li>
            <li>Compare com vídeos que funcionam vs que não funcionam</li>
            <li>Se o vídeo não tocar, veja o erro no painel "Eventos do vídeo"</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
