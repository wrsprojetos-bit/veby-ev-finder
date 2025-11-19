import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { S3Bucket } from "https://deno.land/x/s3@0.5.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user from JWT token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado. Token de autenticação necessário." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Não autorizado. Token inválido." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const formData = await req.formData();
    const videoFile = formData.get("video") as File;
    const listingId = formData.get("listingId") as string;

    if (!videoFile || !listingId) {
      return new Response(
        JSON.stringify({ error: "Arquivo e listingId são obrigatórios" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Note: Não verificamos se o listing existe aqui pois o vídeo é enviado ANTES 
    // de criar o listing no banco. O listing será criado logo após o upload com o mesmo ID.

    // Validate file type
    const allowedMimeTypes = ["video/mp4", "video/quicktime", "video/webm"];
    if (!allowedMimeTypes.includes(videoFile.type)) {
      return new Response(
        JSON.stringify({ error: "Tipo de arquivo inválido. Apenas MP4, MOV e WebM são permitidos." }),
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

    // Para o S3 client, precisamos do endpoint sem o protocolo
    const s3Endpoint = endpoint.replace("https://", "").replace("http://", "");

    // Configurar bucket S3 (R2 é compatível com S3)
    const bucket = new S3Bucket({
      accessKeyID: accessKeyId,
      secretKey: secretAccessKey,
      bucket: bucketName,
      region: "auto",
      endpointURL: `https://${s3Endpoint}`,
    });

    // Gerar chave previsível sob o prefixo público (ex.: videos/)
    const timestamp = Date.now();
    const pathPrefix = (Deno.env.get("R2_PUBLIC_PATH_PREFIX") || "videos").replace(/^\/+|\/+$/g, "");
    const baseName = `${listingId}_${timestamp}.mp4`;
    const key = `${pathPrefix}/${baseName}`;

    // Converter File para Uint8Array
    const arrayBuffer = await videoFile.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    console.log("Iniciando upload:", { key, size: videoFile.size });

    // Fazer upload para R2 com Content-Type explícito (video/mp4)
    // IMPORTANTE: Content-Type correto é essencial para autoplay funcionar
    // ATENÇÃO: CORS deve ser configurado no bucket R2 via Cloudflare Dashboard
    // Sem CORS, o navegador bloqueia autoplay de vídeos cross-origin
    await bucket.putObject(key, buffer, {
      contentType: "video/mp4",
    });

    // Construir URL pública usando BASE opcional de CDN
    const publicBase = (Deno.env.get("R2_PUBLIC_BASE_URL") || "").replace(/\/$/, "");
    const publicUrl = publicBase ? `${publicBase}/${key}` : `${endpoint}/${bucketName}/${key}`;

    console.log("✅ Upload R2 concluído:", { 
      key, 
      size: videoFile.size, 
      publicUrl, 
      contentType: "video/mp4",
      cors: "⚠️ Se autoplay não funcionar, configure CORS no bucket R2 (veja CONFIGURAR-CORS-R2.md)"
    });

    return new Response(
      JSON.stringify({
        success: true,
        video_url: publicUrl,
        file_key: key,
        size: videoFile.size,
        content_type: "video/mp4",
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
