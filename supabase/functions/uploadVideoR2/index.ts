import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { S3Bucket } from "https://deno.land/x/s3@0.5.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const videoFile = formData.get("video") as File;
    const userId = formData.get("userId") as string;
    const listingId = formData.get("listingId") as string;

    if (!videoFile || !userId || !listingId) {
      return new Response(
        JSON.stringify({ error: "Arquivo, userId e listingId são obrigatórios" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Validação de tamanho (100 MB)
    const MAX_SIZE = 100 * 1024 * 1024;
    if (videoFile.size > MAX_SIZE) {
      return new Response(
        JSON.stringify({ error: "Vídeo muito grande. Máximo 100MB" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID") || "";
    const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY") || "";
    const bucketName = Deno.env.get("R2_BUCKET_NAME") || "veby-videos";
    const endpoint = Deno.env.get("R2_ENDPOINT") || "";

    // Remover https:// do endpoint
    const cleanEndpoint = endpoint.replace("https://", "").replace("http://", "");

    // Configurar bucket S3 (R2 é compatível com S3)
    const bucket = new S3Bucket({
      accessKeyID: accessKeyId,
      secretKey: secretAccessKey,
      bucket: bucketName,
      region: "auto",
      endpointURL: `https://${cleanEndpoint}`,
    });

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const fileName = `${userId}/${listingId}_${timestamp}.mp4`;

    // Converter File para Uint8Array
    const arrayBuffer = await videoFile.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    console.log("Iniciando upload:", { fileName, size: videoFile.size });

    // Fazer upload para R2
    await bucket.putObject(fileName, buffer, {
      contentType: "video/mp4",
    });

    // URL pública do vídeo
    const publicUrl = `https://${cleanEndpoint}/${bucketName}/${fileName}`;

    console.log("Upload concluído:", { fileName, size: videoFile.size, publicUrl });

    return new Response(
      JSON.stringify({
        success: true,
        video_url: publicUrl,
        file_name: fileName,
        size: videoFile.size,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erro no upload R2:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro no upload",
        details: error instanceof Error ? error.stack : undefined,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
