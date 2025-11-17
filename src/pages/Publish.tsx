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
    type: "vendo",
    category: "",
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
    estado: "",
    cidade: "",
    bairro: "",
    acceptsTrade: false,
    documentacao_em_dia: false,
    licenciado: false,
    unico_dono: false,
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

    // ===== ETAPA 1: VALIDAÇÕES INICIAIS (UI) =====
    if (!user) {
      toast.error("Você precisa estar logado para publicar");
      navigate("/auth");
      return;
    }

    if (!videoFile) {
      toast.error("Selecione um vídeo para o anúncio");
      return;
    }

    // Apenas os campos visíveis na UI
    const requiredFields: Record<string, string> = {
      category: "Categoria",
      title: "Título",
      price: "Preço",
      description: "Descrição",
      estado: "Estado",
      cidade: "Cidade",
    };

    for (const [field, label] of Object.entries(requiredFields)) {
      const value = (formData as any)[field];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        toast.error(`Campo obrigatório: ${label}`);
        return;
      }
    }

    try {
      // ===== ETAPA 2: UPLOAD DO VÍDEO (ANTES DA VALIDAÇÃO ZOD) =====
      toast.info("Fazendo upload do vídeo...");
      const tempListingId = crypto.randomUUID();
      const uploadResult = await uploadVideoWithAssets(videoFile, tempListingId);
      if (!uploadResult) {
        toast.error("Não foi possível enviar o vídeo. Tente novamente.");
        return;
      }

      // ===== ETAPA 3: VALIDAÇÃO ZOD (APENAS CAMPOS DA UI) =====
      const { publishSchema } = await import("@/schemas/validation");
      const zodInput = {
        type: formData.type,
        category: formData.category,
        title: formData.title,
        price: formData.price ? parseFloat(formData.price) : 0,
        description: formData.description,
        location_state: formData.estado || "SP",
        location_city: formData.cidade || "São Paulo",
        video_url: uploadResult.videoUrl,
        brand: formData.brand || "",
        model: formData.model || "",
        year: formData.ano ? parseInt(formData.ano) : null,
        acceptsTrade: formData.acceptsTrade ?? false,
      };
      console.log("🔎 Zod input:", zodInput);

      const validatedData = publishSchema.parse(zodInput);
      console.log("✅ Zod validado:", validatedData);

      // ===== ETAPA 4: VERIFICAR/CRIAR PERFIL =====
      let profile = await supabase
        .from("profiles")
        .select("location_state, location_city")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile.data) {
        console.log("⚠️ Criando perfil automaticamente...");
        const { error: createError } = await supabase
          .from("profiles")
          .insert([
            {
              id: user.id,
              name: user.email?.split("@")[0] || "Usuário",
              location: `${validatedData.location_city}, ${validatedData.location_state}`,
              location_city: validatedData.location_city,
              location_state: validatedData.location_state,
            },
          ]);

        if (createError) {
          console.error("❌ Erro ao criar perfil:", createError);
          toast.error("Erro ao criar perfil. Tente novamente.");
          return;
        }
      }

      // ===== ETAPA 5: (OPCIONAL) GPS =====
      let latitude: number | null = null;
      let longitude: number | null = null;
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              maximumAge: 300000,
              enableHighAccuracy: false,
            });
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
          console.log("📍 GPS capturado:", { latitude, longitude });
        } catch {
          console.log("GPS não disponível");
        }
      }

      // ===== ETAPA 6: INSERIR NO BANCO (PAYLOAD ALINHADO À TABELA) =====
      const listingPayload = {
        id: tempListingId,
        user_id: user.id,
        type: validatedData.type,
        category: validatedData.category,
        brand_model: validatedData.title, // mapeia title -> brand_model (coluna requerida)
        marca: validatedData.brand || null,
        modelo: validatedData.model || null,
        ano: validatedData.year ?? null,
        price: validatedData.price,
        description: validatedData.description,
        state: validatedData.location_state,
        city: validatedData.location_city,
        location: `${validatedData.location_city}, ${validatedData.location_state}`,
        latitude,
        longitude,
        video_url: validatedData.video_url,
        thumbnail_url: uploadResult.thumbnailUrl,
        preview_url: uploadResult.previewUrl,
        video_duration: uploadResult.duration,
        video_size: uploadResult.size,
        accepts_trade: validatedData.acceptsTrade ?? false,
        status: "ativo",
        approved: true,
      } as const;

      console.log("📝 Insert payload (listings):", listingPayload);
      console.log("🧩 Insert columns:", Object.keys(listingPayload));
      console.log("🧪 Insert values:", Object.values(listingPayload));

      const { data: listing, error: listingError } = await supabase
        .from("listings")
        .insert([listingPayload])
        .select()
        .single();

      if (listingError) {
        console.error("❌ Erro ao criar listing (Supabase):", listingError);
        toast.error(`Erro ao publicar anúncio: ${listingError.message}`);
        return;
      }

      // ===== ETAPA 7: SUCESSO =====
      toast.success("Anúncio publicado com sucesso!");

      setFormData({
        type: "vendo",
        category: "",
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
        estado: "",
        cidade: "",
        bairro: "",
        acceptsTrade: false,
        documentacao_em_dia: false,
        licenciado: false,
        unico_dono: false,
        inclui_carregador: false,
        inclui_segunda_bateria: false,
      });
      setVideoFile(null);
      setVideoPreview("");

      setTimeout(() => navigate("/"), 1500);
    } catch (error: any) {
      console.error("❌ Erro no processo de publicação:", error);
      if (error.name === "ZodError") {
        console.error("🧩 Zod issues:", error.issues);
        const first = error.issues?.[0]?.message || "Preencha todos os campos obrigatórios corretamente";
        toast.error(first);
      } else {
        toast.error(`Erro ao publicar: ${error.message || "Erro desconhecido"}`);
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

          {/* Categoria */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-base font-semibold">
              Categoria <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
              required
            >
              <SelectTrigger className={!formData.category ? "border-destructive/50" : ""}>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Bike">Bike</SelectItem>
                <SelectItem value="Patinete">Patinete</SelectItem>
                <SelectItem value="Scooter">Scooter</SelectItem>
                <SelectItem value="Moto">Moto</SelectItem>
                <SelectItem value="Carro">Carro</SelectItem>
                <SelectItem value="Outros">Outros</SelectItem>
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
