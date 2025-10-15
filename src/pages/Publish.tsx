import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Video, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Publish = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>("");
  const [formData, setFormData] = useState({
    type: "",
    category: "",
    title: "",
    price: "",
    brand: "",
    model: "",
    description: "",
    acceptsTrade: false,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Validação de vídeo: máx 30s e formato vertical 9:16
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
        const ratio = w / h; // 9:16 ~ 0.5625
        const target = 9 / 16;
        const within = Math.abs(ratio - target) < 0.06; // tolerância ~±0.06
        URL.revokeObjectURL(url);
        if (duration > 30.5) {
          resolve({ ok: false, reason: 'Vídeo deve ter no máximo 30 segundos' });
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
      if (file.size > 100 * 1024 * 1024) { // 100MB
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

    if (!formData.category || !formData.title || !formData.price) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setUploading(true);

    try {
      // Upload video to Supabase Storage
      const fileExt = videoFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data: videoData, error: videoError } = await supabase.storage
        .from('videos')
        .upload(fileName, videoFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (videoError) throw videoError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);

      // Create listing
      const { error: listingError } = await supabase
        .from('listings')
        .insert({
          user_id: user.id,
          type: formData.type,
          category: formData.category,
          brand_model: `${formData.brand} ${formData.model}`.trim() || formData.title,
          price: parseFloat(formData.price),
          description: formData.description,
          video_url: publicUrl,
          accepts_trade: formData.acceptsTrade,
          status: 'ativo',
          location: 'São Paulo, SP', // You can add location field later
        });

      if (listingError) throw listingError;

      toast.success("Anúncio publicado com sucesso!");
      navigate("/");
      
    } catch (error: any) {
      console.error('Error publishing:', error);
      toast.error(error.message || "Erro ao publicar anúncio");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="fixed top-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 h-16">
          <h1 className="text-xl font-bold">Publicar Anúncio</h1>
        </div>
      </header>

      <main className="pt-20 px-4 pb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Video Upload */}
          <div className="space-y-3">
            <Label>Vídeo do Anúncio *</Label>
            {!videoPreview ? (
              <div className="relative">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoSelect}
                  className="hidden"
                  id="video-upload"
                />
                <label
                  htmlFor="video-upload"
                  className="aspect-[9/16] rounded-xl border-2 border-dashed border-border bg-card hover:border-primary/50 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer"
                >
                  <Video className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Adicionar vídeo</span>
                  <span className="text-xs text-muted-foreground">Máx 30s • Vertical 9:16 (720x1280 recomendado) • até 100MB</span>
                </label>
              </div>
            ) : (
              <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-black">
                <video
                  src={videoPreview}
                  className="w-full h-full object-cover"
                  controls
                />
                <button
                  type="button"
                  onClick={removeVideo}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>Tipo de anúncio *</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
              <SelectTrigger className="bg-card border-border">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="venda">Venda</SelectItem>
                <SelectItem value="troca">Troca</SelectItem>
                <SelectItem value="procurando">Procurando</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Categoria *</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
              <SelectTrigger className="bg-card border-border">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bike">Bike Elétrica</SelectItem>
                <SelectItem value="patinete">Patinete</SelectItem>
                <SelectItem value="skate">Skate</SelectItem>
                <SelectItem value="scooter">Scooter</SelectItem>
                <SelectItem value="carro">Carro</SelectItem>
                <SelectItem value="pecas">Peças/Acessórios</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Ex: Bike Elétrica SuperCharge Pro"
              className="bg-card border-border"
              required
            />
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label>Preço *</Label>
            <Input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              placeholder="0.00"
              className="bg-card border-border"
              step="0.01"
              required
            />
          </div>

          {/* Brand and Model */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Marca</Label>
              <Input 
                value={formData.brand}
                onChange={(e) => setFormData({...formData, brand: e.target.value})}
                placeholder="Marca" 
                className="bg-card border-border" 
              />
            </div>
            <div className="space-y-2">
              <Label>Modelo</Label>
              <Input 
                value={formData.model}
                onChange={(e) => setFormData({...formData, model: e.target.value})}
                placeholder="Modelo" 
                className="bg-card border-border" 
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Descreva seu veículo..."
              className="bg-card border-border min-h-32 resize-none"
            />
          </div>

          {/* Trade option */}
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="trade"
              checked={formData.acceptsTrade}
              onCheckedChange={(checked) => setFormData({...formData, acceptsTrade: checked as boolean})}
            />
            <label
              htmlFor="trade"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Aceita troca?
            </label>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit"
            disabled={uploading}
            className="w-full bg-gradient-primary text-primary-foreground font-semibold h-12 shadow-glow-primary hover:scale-[1.02] transition-transform disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Publicando...
              </>
            ) : (
              'Publicar Agora'
            )}
          </Button>
        </form>
      </main>

      <BottomNav />
    </div>
  );
};

export default Publish;