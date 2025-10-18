import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import {
  extractVideoThumbnail,
  generateVideoPreview,
  isValidVideo,
  validateVideoDuration,
  validateAspectRatio,
  generateUniqueFileName,
} from "@/utils/videoProcessing";

interface UploadProgress {
  video: number;
  thumbnail: number;
  preview: number;
}

export const useVideoUpload = () => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({
    video: 0,
    thumbnail: 0,
    preview: 0,
  });

  const uploadVideoWithAssets = async (
    videoFile: File,
    listingId: string
  ): Promise<{
    videoUrl: string;
    thumbnailUrl: string;
    previewUrl: string;
    duration: number;
    size: number;
  } | null> => {
    if (!user) {
      toast.error("Você precisa estar logado para fazer upload");
      return null;
    }

    // 1. Validar formato e tamanho
    if (!isValidVideo(videoFile)) {
      toast.error("Formato inválido ou arquivo muito grande (máx. 100MB). Use MP4, MOV ou WebM");
      return null;
    }

    // 2. Validar duração
    toast.info("Validando vídeo...");
    const durationCheck = await validateVideoDuration(videoFile);
    if (!durationCheck.valid) {
      toast.error(`Vídeo muito longo! Duração máxima: 60 segundos (seu vídeo: ${durationCheck.duration}s)`);
      return null;
    }

    // 3. Validar aspect ratio 9:16
    const aspectCheck = await validateAspectRatio(videoFile);
    if (!aspectCheck.valid) {
      toast.error("O vídeo precisa estar no formato vertical 9:16");
      return null;
    }

    setUploading(true);
    setProgress({ video: 0, thumbnail: 0, preview: 0 });

    // Criar log de upload
    const { data: logData } = await supabase
      .from("storage_logs")
      .insert([{
        user_id: user.id,
        listing_id: listingId,
        video_id: listingId,
        size_mb: parseFloat((videoFile.size / (1024 * 1024)).toFixed(2)),
        duration_seconds: durationCheck.duration,
        status: "uploading",
      }])
      .select()
      .single();

    try {
      // 4. Gerar thumbnail
      toast.info("Gerando thumbnail do vídeo...");
      const thumbnailBlob = await extractVideoThumbnail(videoFile, 1);
      setProgress((p) => ({ ...p, thumbnail: 100 }));

      // 5. Gerar preview
      toast.info("Processando preview...");
      const previewBlob = await generateVideoPreview(videoFile);
      setProgress((p) => ({ ...p, preview: 50 }));

      // 3. Upload do vídeo original
      toast.info("Enviando vídeo...");
      const videoPath = generateUniqueFileName(
        user.id,
        listingId,
        "video",
        "mp4"
      );

      const { data: videoData, error: videoError } = await supabase.storage
        .from("videos")
        .upload(videoPath, videoFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (videoError) throw videoError;
      setProgress((p) => ({ ...p, video: 100 }));

      // 4. Upload da thumbnail
      const thumbPath = generateUniqueFileName(
        user.id,
        listingId,
        "thumb",
        "jpg"
      );

      const { data: thumbData, error: thumbError } = await supabase.storage
        .from("videos")
        .upload(thumbPath, thumbnailBlob, {
          cacheControl: "3600",
          upsert: false,
          contentType: "image/jpeg",
        });

      if (thumbError) throw thumbError;

      // 5. Upload do preview
      const previewPath = generateUniqueFileName(
        user.id,
        listingId,
        "preview",
        "mp4"
      );

      const { data: previewData, error: previewError } = await supabase.storage
        .from("videos")
        .upload(previewPath, previewBlob, {
          cacheControl: "3600",
          upsert: false,
          contentType: "video/mp4",
        });

      if (previewError) throw previewError;
      setProgress((p) => ({ ...p, preview: 100 }));

      // 6. Obter URLs públicas
      const { data: videoUrlData } = supabase.storage
        .from("videos")
        .getPublicUrl(videoPath);

      const { data: thumbUrlData } = supabase.storage
        .from("videos")
        .getPublicUrl(thumbPath);

      const { data: previewUrlData } = supabase.storage
        .from("videos")
        .getPublicUrl(previewPath);

      // Atualizar log de sucesso
      if (logData) {
        await supabase
          .from("storage_logs")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", logData.id);
      }

      toast.success("Upload concluído com sucesso!");

      return {
        videoUrl: videoUrlData.publicUrl,
        thumbnailUrl: thumbUrlData.publicUrl,
        previewUrl: previewUrlData.publicUrl,
        duration: durationCheck.duration,
        size: videoFile.size,
      };
    } catch (error) {
      console.error("Erro no upload:", error);
      
      // Atualizar log de erro
      if (logData) {
        await supabase
          .from("storage_logs")
          .update({
            status: "failed",
            error_message: error instanceof Error ? error.message : "Erro desconhecido",
            completed_at: new Date().toISOString(),
          })
          .eq("id", logData.id);
      }
      
      toast.error("Erro ao fazer upload do vídeo");
      return null;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadVideoWithAssets,
    uploading,
    progress,
  };
};
