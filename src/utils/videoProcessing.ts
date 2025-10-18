// Utilitários para processamento de vídeo e geração de thumbnails

/**
 * Extrai um frame do vídeo em um tempo específico e gera thumbnail
 */
export const extractVideoThumbnail = async (
  videoFile: File,
  timeInSeconds: number = 1
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Não foi possível criar contexto do canvas'));
      return;
    }

    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      // Definir dimensões do canvas (9:16 - 480x852)
      canvas.width = 480;
      canvas.height = 852;

      // Buscar frame no tempo especificado
      video.currentTime = Math.min(timeInSeconds, video.duration);
    };

    video.onseeked = () => {
      try {
        // Calcular proporções para centralizar e preencher
        const videoRatio = video.videoWidth / video.videoHeight;
        const canvasRatio = canvas.width / canvas.height;

        let drawWidth = canvas.width;
        let drawHeight = canvas.height;
        let offsetX = 0;
        let offsetY = 0;

        if (videoRatio > canvasRatio) {
          // Vídeo mais largo - ajustar pela altura
          drawWidth = canvas.height * videoRatio;
          offsetX = (canvas.width - drawWidth) / 2;
        } else {
          // Vídeo mais alto - ajustar pela largura
          drawHeight = canvas.width / videoRatio;
          offsetY = (canvas.height - drawHeight) / 2;
        }

        // Desenhar o frame no canvas
        ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);

        // Converter canvas para blob (JPEG com qualidade 85%)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              URL.revokeObjectURL(video.src);
              resolve(blob);
            } else {
              reject(new Error('Falha ao gerar thumbnail'));
            }
          },
          'image/jpeg',
          0.85
        );
      } catch (error) {
        URL.revokeObjectURL(video.src);
        reject(error);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Erro ao carregar vídeo'));
    };

    // Carregar o vídeo
    video.src = URL.createObjectURL(videoFile);
  });
};

/**
 * Gera um preview curto do vídeo (3 segundos)
 * Nota: Esta é uma versão simplificada. Para produção, considere usar FFmpeg.wasm
 * ou processar no servidor
 */
export const generateVideoPreview = async (
  videoFile: File
): Promise<Blob> => {
  // Para preview real, seria necessário usar FFmpeg.wasm ou processar server-side
  // Por enquanto, retornamos o vídeo original reduzido
  // Em produção, isso deve ser feito server-side com FFmpeg
  
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    
    video.onloadedmetadata = () => {
      // Se o vídeo já tem menos de 3 segundos, retorna o original
      if (video.duration <= 3) {
        resolve(videoFile);
        return;
      }
      
      // Para vídeos maiores, em produção deveria processar server-side
      // Por enquanto retorna o original
      // TODO: Implementar processamento server-side com FFmpeg
      resolve(videoFile);
    };

    video.onerror = () => reject(new Error('Erro ao processar vídeo'));
    video.src = URL.createObjectURL(videoFile);
  });
};

/**
 * Valida se o arquivo é um vídeo válido
 */
export const isValidVideo = (file: File): boolean => {
  const validTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
  return validTypes.includes(file.type);
};

/**
 * Gera um nome único para o arquivo
 */
export const generateUniqueFileName = (
  userId: string,
  listingId: string,
  suffix: string,
  extension: string
): string => {
  return `${userId}/${listingId}_${suffix}.${extension}`;
};
