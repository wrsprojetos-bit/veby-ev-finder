import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Video, X, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useVideoUpload } from "@/hooks/useVideoUpload";
import { toast } from "sonner";
import { VEHICLE_TYPES, CONSERVATION_STATES } from "@/data/categories";

const Publish = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { uploadVideoWithAssets, uploading, progress } = useVideoUpload();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>("");
  const [formData, setFormData] = useState({
    type: "",
    tipo_veiculo: "",
    title: "",
    price: "",
    brand: "",
    model: "",
    ano: "",
    quilometragem_km: "",
    capacidade_bateria: "",
    autonomia_km: "",
    potencia_motor: "",
    tempo_carga_horas: "",
    estado_conservacao: "",
    description: "",
    acceptsTrade: false,
    documentacao_em_dia: false,
    licenciado: false,
    unico_dono: false,
    bairro: "",
    inclui_carregador: false,
    inclui_segunda_bateria: false,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const validateVideoFile = (file: File): Promise<{ ok: boolean; url?: string; reason?: string }> => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const vid = document.createElement('video');
      vid.preload = 'metadata';
      vid.src = url;
      vid.onloadedmetadata = () => {
        const duration = vid.duration;
        const w = vid.videoWidth;
        const h = vid.videoHeight;
        const ratio = w / h;
        const target = 9 / 16;
        const within = Math.abs(ratio - target) < 0.06;
        URL.revokeObjectURL(url);
        if (duration > 60.5) {
          resolve({ ok: false, reason: 'Vídeo deve ter no máximo 60 segundos (1 minuto)' });
        } else if (!within) {
          resolve({ ok: false, reason: 'Vídeo deve estar no formato vertical 9:16 (ex: 720x1280)' });
        } else {
          resolve({ ok: true });
        }
      };
      vid.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ ok: false, reason: 'Não foi possível ler o vídeo. Tente outro arquivo.' });
      };
    });
  };

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        toast.error('Vídeo muito grande! Máximo 100MB');
        return;
      }
      const result = await validateVideoFile(file);
      if (!result.ok) {
        toast.error(result.reason || 'Vídeo inválido');
        return;
      }
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
    }
  };

  const removeVideo = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoFile(null);
    setVideoPreview("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Você precisa estar logado");
      return;
    }

    if (!videoFile) {
      toast.error("Adicione um vídeo ao seu anúncio");
      return;
    }

    // VALIDAÇÃO CLIENT-SIDE ANTES DO ZOD
    const requiredFields = [
      { field: formData.type, name: "Tipo de anúncio" },
      { field: formData.tipo_veiculo, name: "Tipo de veículo" },
      { field: formData.title, name: "Título" },
      { field: formData.brand, name: "Marca" },
      { field: formData.model, name: "Modelo" },
      { field: formData.ano, name: "Ano" },
      { field: formData.capacidade_bateria, name: "Capacidade da bateria" },
      { field: formData.potencia_motor, name: "Potência do motor" },
      { field: formData.estado_conservacao, name: "Estado de conservação" },
      { field: formData.price, name: "Preço" },
    ];

    for (const { field, name } of requiredFields) {
      if (!field || field === "") {
        toast.error(`${name} é obrigatório`);
        return;
      }
    }

    try {
      const { publishSchema } = await import("@/schemas/validation");
      const validationData = {
        type: formData.type,
        tipo_veiculo: formData.tipo_veiculo,
        title: formData.title,
        price: formData.price ? parseFloat(formData.price) : 0,
        brand: formData.brand,
        model: formData.model,
        ano: formData.ano ? parseInt(formData.ano) : new Date().getFullYear(),
        quilometragem_km: formData.quilometragem_km ? parseInt(formData.quilometragem_km) : null,
        capacidade_bateria: formData.capacidade_bateria,
        autonomia_km: formData.autonomia_km ? parseInt(formData.autonomia_km) : null,
        potencia_motor: formData.potencia_motor,
        tempo_carga_horas: formData.tempo_carga_horas || null,
        estado_conservacao: formData.estado_conservacao,
        description: formData.description || null,
        acceptsTrade: formData.acceptsTrade,
        documentacao_em_dia: formData.documentacao_em_dia || null,
        licenciado: formData.licenciado || null,
        unico_dono: formData.unico_dono || null,
        bairro: formData.bairro || null,
        inclui_carregador: formData.inclui_carregador,
        inclui_segunda_bateria: formData.inclui_segunda_bateria,
      };
      
      const validatedData = publishSchema.parse(validationData);

      const { data: profile } = await supabase
        .from("profiles")
        .select("location_state, location_city")
        .eq("id", user.id)
        .maybeSingle();

      // PASSO 2: Capturar localização GPS ao criar anúncio
      let latitude: number | null = null;
      let longitude: number | null = null;

      try {
        // Primeiro, tentar pegar GPS do navegador
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error("GPS não disponível"));
            return;
          }
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            maximumAge: 300000,
            enableHighAccuracy: false
          });
        });

        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
        console.log("📍 GPS capturado:", { latitude, longitude });
      } catch (gpsError) {
        console.warn("⚠️ GPS negado, usando geocoding por cidade/estado");
        
        // Se GPS falhar, usar geocoding aproximado por cidade/estado
        if (profile?.location_city && profile?.location_state) {
          try {
            const query = `${profile.location_city}, ${profile.location_state}, Brasil`;
            const response = await fetch(
              `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
              { headers: { 'User-Agent': 'VEBY-App/1.0' } }
            );
            const geocodeData = await response.json();
            
            if (geocodeData && geocodeData.length > 0) {
              latitude = parseFloat(geocodeData[0].lat);
              longitude = parseFloat(geocodeData[0].lon);
              console.log("📍 Geocoding aproximado:", { latitude, longitude });
            }
          } catch (geocodeError) {
            console.error("Erro no geocoding:", geocodeError);
          }
        }
      }

      const { data: listing, error: listingError } = await supabase
        .from("listings")
        .insert({
          user_id: user.id,
          type: validatedData.type,
          tipo_veiculo: validatedData.tipo_veiculo,
          brand_model: `${validatedData.brand} ${validatedData.model}`,
          marca: validatedData.brand,
          modelo: validatedData.model,
          ano: validatedData.ano,
          quilometragem_km: validatedData.quilometragem_km,
          capacidade_bateria: validatedData.capacidade_bateria,
          autonomia_km: validatedData.autonomia_km,
          potencia_motor: validatedData.potencia_motor,
          tempo_carga_horas: validatedData.tempo_carga_horas,
          estado_conservacao: validatedData.estado_conservacao,
          price: validatedData.price,
          description: validatedData.description,
          accepts_trade: validatedData.acceptsTrade,
          documentacao_em_dia: validatedData.documentacao_em_dia,
          licenciado: validatedData.licenciado,
          unico_dono: validatedData.unico_dono,
          bairro: validatedData.bairro,
          inclui_carregador: validatedData.inclui_carregador,
          inclui_segunda_bateria: validatedData.inclui_segunda_bateria,
          state: profile?.location_state || '',
          city: profile?.location_city || '',
          location: `${profile?.location_city || ''}, ${profile?.location_state || ''}`,
          status: "ativo",
          category: "Veículos Elétricos",
          // NOVOS CAMPOS: latitude e longitude
          latitude: latitude,
          longitude: longitude,
        })
        .select()
        .single();

      if (listingError) throw listingError;

      const uploadResult = await uploadVideoWithAssets(
        videoFile,
        listing.id
      );

      if (!uploadResult) {
        await supabase.from("listings").delete().eq("id", listing.id);
        throw new Error("Erro ao fazer upload do vídeo");
      }

      const { error: updateError } = await supabase
        .from("listings")
        .update({
          video_url: uploadResult.videoUrl,
          video_thumbnail: uploadResult.thumbnailUrl,
          video_preview: uploadResult.previewUrl,
        })
        .eq("id", listing.id);

      if (updateError) throw updateError;

      toast.success("Anúncio publicado com sucesso!");
      navigate("/");
    } catch (error: any) {
      console.error("Erro ao publicar anúncio:", error);
      
      // Se for erro de validação do Zod, mostre o erro específico do campo
      if (error?.issues && Array.isArray(error.issues)) {
        const firstError = error.issues[0];
        const fieldPath = firstError.path.join(".");
        toast.error(`${fieldPath}: ${firstError.message}`);
      } else if (error?.message) {
        toast.error(error.message);
      } else {
        toast.error("Erro ao publicar anúncio. Verifique os campos.");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-14 flex items-center">
          <h1 className="text-lg font-semibold text-foreground">Publicar Veículo Elétrico</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="bg-muted/30 rounded-lg p-4 mb-6 border border-border">
          <p className="text-sm text-muted-foreground">
            <strong>Anuncie aqui apenas veículos elétricos ou híbridos plug-in.</strong>
            <br />
            Ex: bikes, patinetes, scooters, motos e carros elétricos.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Upload de Vídeo */}
          <div className="space-y-2">
            <Label htmlFor="video" className="text-base font-semibold">
              Vídeo do veículo *
            </Label>
            <p className="text-sm text-muted-foreground">
              Vídeo vertical (9:16), máximo 60 segundos
            </p>
            {!videoPreview ? (
              <label
                htmlFor="video"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors"
              >
                <Video className="w-12 h-12 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Clique para selecionar</span>
                <input
                  id="video"
                  type="file"
                  accept="video/*"
                  onChange={handleVideoSelect}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative w-full max-w-xs mx-auto">
                <video
                  src={videoPreview}
                  className="w-full rounded-lg"
                  controls
                />
                <button
                  type="button"
                  onClick={removeVideo}
                  className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-2 rounded-full hover:bg-destructive/90"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Tipo de Anúncio */}
          <div className="space-y-2">
            <Label htmlFor="type" className="text-base font-semibold">
              Tipo de anúncio <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
              required
            >
              <SelectTrigger className={!formData.type ? "border-destructive/50" : ""}>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vendo">Vendo</SelectItem>
                <SelectItem value="troco">Troco</SelectItem>
                <SelectItem value="procuro">Procuro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Veículo */}
          <div className="space-y-2">
            <Label htmlFor="tipo_veiculo" className="text-base font-semibold">
              Tipo de veículo <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.tipo_veiculo}
              onValueChange={(value) => setFormData({ ...formData, tipo_veiculo: value })}
              required
            >
              <SelectTrigger className={!formData.tipo_veiculo ? "border-destructive/50" : ""}>
                <SelectValue placeholder="Selecione o tipo de veículo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(VEHICLE_TYPES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estado de Conservação */}
          <div className="space-y-2">
            <Label htmlFor="estado_conservacao" className="text-base font-semibold">
              Estado de conservação <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.estado_conservacao}
              onValueChange={(value) => setFormData({ ...formData, estado_conservacao: value })}
              required
            >
              <SelectTrigger className={!formData.estado_conservacao ? "border-destructive/50" : ""}>
                <SelectValue placeholder="Selecione o estado" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CONSERVATION_STATES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-semibold">
              Título do anúncio <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Bike elétrica Sense 2023 como nova"
              className={!formData.title ? "border-destructive/50" : ""}
              required
            />
          </div>

          {/* Marca e Modelo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand" className="text-base font-semibold">
                Marca <span className="text-destructive">*</span>
              </Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="Ex: Sense"
                className={!formData.brand ? "border-destructive/50" : ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model" className="text-base font-semibold">
                Modelo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="Ex: E-Urban"
                className={!formData.model ? "border-destructive/50" : ""}
                required
              />
            </div>
          </div>

          {/* Ano e Quilometragem */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ano" className="text-base font-semibold">
                Ano <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ano"
                type="number"
                value={formData.ano}
                onChange={(e) => setFormData({ ...formData, ano: e.target.value })}
                placeholder="2023"
                min="1990"
                max={new Date().getFullYear() + 1}
                className={!formData.ano ? "border-destructive/50" : ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quilometragem_km">Quilometragem (km)</Label>
              <Input
                id="quilometragem_km"
                type="number"
                value={formData.quilometragem_km}
                onChange={(e) => setFormData({ ...formData, quilometragem_km: e.target.value })}
                placeholder="5000"
                min="0"
              />
            </div>
          </div>

          {/* Bateria e Autonomia */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacidade_bateria" className="text-base font-semibold">
                Capacidade da bateria <span className="text-destructive">*</span>
              </Label>
              <Input
                id="capacidade_bateria"
                value={formData.capacidade_bateria}
                onChange={(e) => setFormData({ ...formData, capacidade_bateria: e.target.value })}
                placeholder="48V 20Ah ou 75 kWh"
                className={!formData.capacidade_bateria ? "border-destructive/50" : ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="autonomia_km">Autonomia estimada (km)</Label>
              <Input
                id="autonomia_km"
                type="number"
                value={formData.autonomia_km}
                onChange={(e) => setFormData({ ...formData, autonomia_km: e.target.value })}
                placeholder="60"
                min="1"
              />
            </div>
          </div>

          {/* Potência e Tempo de Carga */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="potencia_motor" className="text-base font-semibold">
                Potência do motor <span className="text-destructive">*</span>
              </Label>
              <Input
                id="potencia_motor"
                value={formData.potencia_motor}
                onChange={(e) => setFormData({ ...formData, potencia_motor: e.target.value })}
                placeholder="350W, 3kW ou 150cv"
                className={!formData.potencia_motor ? "border-destructive/50" : ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tempo_carga_horas">Tempo de carga (horas)</Label>
              <Input
                id="tempo_carga_horas"
                value={formData.tempo_carga_horas}
                onChange={(e) => setFormData({ ...formData, tempo_carga_horas: e.target.value })}
                placeholder="4-6"
              />
            </div>
          </div>

          {/* Preço */}
          <div className="space-y-2">
            <Label htmlFor="price" className="text-base font-semibold">
              Preço (R$) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="5000.00"
              step="0.01"
              min="0"
              className={!formData.price ? "border-destructive/50" : ""}
              required
            />
          </div>

          {/* Bairro */}
          <div className="space-y-2">
            <Label htmlFor="bairro">Bairro</Label>
            <Input
              id="bairro"
              value={formData.bairro}
              onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
              placeholder="Centro"
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva seu veículo..."
              rows={4}
            />
          </div>

          {/* Checkboxes - Documentação (para carros/motos) */}
          {(formData.tipo_veiculo === 'carro_eletrico_ou_hibrido_plug_in' || formData.tipo_veiculo === 'moto_eletrica') && (
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border">
              <p className="text-sm font-semibold text-foreground">Documentação e Histórico</p>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="documentacao_em_dia"
                  checked={formData.documentacao_em_dia}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, documentacao_em_dia: checked as boolean })
                  }
                />
                <Label htmlFor="documentacao_em_dia" className="text-sm cursor-pointer">
                  Documentação em dia
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="licenciado"
                  checked={formData.licenciado}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, licenciado: checked as boolean })
                  }
                />
                <Label htmlFor="licenciado" className="text-sm cursor-pointer">
                  Licenciado
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="unico_dono"
                  checked={formData.unico_dono}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, unico_dono: checked as boolean })
                  }
                />
                <Label htmlFor="unico_dono" className="text-sm cursor-pointer">
                  Único dono
                </Label>
              </div>
            </div>
          )}

          {/* Checkboxes - Extras */}
          <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border">
            <p className="text-sm font-semibold text-foreground">Extras Inclusos</p>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="inclui_carregador"
                checked={formData.inclui_carregador}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, inclui_carregador: checked as boolean })
                }
              />
              <Label htmlFor="inclui_carregador" className="text-sm cursor-pointer">
                Inclui carregador
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="inclui_segunda_bateria"
                checked={formData.inclui_segunda_bateria}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, inclui_segunda_bateria: checked as boolean })
                }
              />
              <Label htmlFor="inclui_segunda_bateria" className="text-sm cursor-pointer">
                Inclui segunda bateria
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="acceptsTrade"
                checked={formData.acceptsTrade}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, acceptsTrade: checked as boolean })
                }
              />
              <Label htmlFor="acceptsTrade" className="text-sm cursor-pointer">
                Aceito trocas
              </Label>
            </div>
          </div>

          {/* Botão de Envio */}
          <Button
            type="submit"
            disabled={uploading}
            className="w-full h-12 text-base font-semibold"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publicando... {Math.round((progress.video + progress.thumbnail + progress.preview) / 3)}%
              </>
            ) : (
              "Publicar Anúncio"
            )}
          </Button>
        </form>
      </main>

      <BottomNav />
    </div>
  );
};

export default Publish;
