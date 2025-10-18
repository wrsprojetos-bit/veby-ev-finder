import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import {
  extractVideoThumbnail,
  generateVideoPreview,
  isValidVideo,
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
  } | null> => {
    if (!user) {
      toast.error("Você precisa estar logado para fazer upload");
      return null;
    }

    if (!isValidVideo(videoFile)) {
      toast.error("Formato de vídeo inválido. Use MP4, MOV ou WebM");
      return null;
    }

    setUploading(true);
    setProgress({ video: 0, thumbnail: 0, preview: 0 });

    try {
      // 1. Gerar thumbnail
      toast.info("Gerando thumbnail do vídeo...");
      const thumbnailBlob = await extractVideoThumbnail(videoFile, 1);
      setProgress((p) => ({ ...p, thumbnail: 100 }));

      // 2. Gerar preview (simplificado - em produção usar server-side)
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

      toast.success("Upload concluído com sucesso!");

      return {
        videoUrl: videoUrlData.publicUrl,
        thumbnailUrl: thumbUrlData.publicUrl,
        previewUrl: previewUrlData.publicUrl,
      };
    } catch (error) {
      console.error("Erro no upload:", error);
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
