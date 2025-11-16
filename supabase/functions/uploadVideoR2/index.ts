import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    // Importar dinamicamente AWS SDK
    const { S3Client, PutObjectCommand } = await import("npm:@aws-sdk/client-s3@3.470.0");

    // Configurar S3 Client para Cloudflare R2
    const s3Client = new S3Client({
      region: "auto",
      endpoint: Deno.env.get("R2_ENDPOINT"),
      credentials: {
        accessKeyId: Deno.env.get("R2_ACCESS_KEY_ID") || "",
        secretAccessKey: Deno.env.get("R2_SECRET_ACCESS_KEY") || "",
      },
    });

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const fileName = `${userId}/${listingId}_${timestamp}.mp4`;
    const bucketName = Deno.env.get("R2_BUCKET_NAME") || "veby-videos";

    // Converter File para ArrayBuffer
    const arrayBuffer = await videoFile.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload para R2
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: "video/mp4",
    });

    await s3Client.send(command);

    // Construir URL pública - usar endpoint customizado do R2
    const r2Domain = Deno.env.get("R2_ENDPOINT")?.replace("https://", "") || "";
    const publicUrl = `https://${r2Domain}/${fileName}`;

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
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
