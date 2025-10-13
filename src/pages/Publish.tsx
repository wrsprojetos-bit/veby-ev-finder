import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Video, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Publish = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

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

      <main className="pt-20 px-4 pb-8 space-y-6">
        {/* Media Upload */}
        <div className="space-y-3">
          <Label>Mídia</Label>
          <div className="grid grid-cols-2 gap-3">
            <button className="aspect-video rounded-xl border-2 border-dashed border-border bg-card hover:border-primary/50 transition-all flex flex-col items-center justify-center gap-2">
              <Video className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Gravar vídeo</span>
            </button>
            <button className="aspect-video rounded-xl border-2 border-dashed border-border bg-card hover:border-primary/50 transition-all flex flex-col items-center justify-center gap-2">
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Adicionar fotos</span>
            </button>
          </div>
        </div>

        {/* Type */}
        <div className="space-y-2">
          <Label>Tipo de anúncio</Label>
          <Select>
            <SelectTrigger className="bg-card border-border">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sale">Venda</SelectItem>
              <SelectItem value="trade">Troca</SelectItem>
              <SelectItem value="looking">Procurando</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select>
            <SelectTrigger className="bg-card border-border">
              <SelectValue placeholder="Selecione a categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bike">Bike Elétrica</SelectItem>
              <SelectItem value="scooter">Patinete</SelectItem>
              <SelectItem value="skateboard">Skate</SelectItem>
              <SelectItem value="moped">Scooter</SelectItem>
              <SelectItem value="car">Carro</SelectItem>
              <SelectItem value="parts">Peças/Acessórios</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label>Título</Label>
          <Input
            placeholder="Ex: Bike Elétrica SuperCharge Pro"
            className="bg-card border-border"
          />
        </div>

        {/* Price */}
        <div className="space-y-2">
          <Label>Preço</Label>
          <Input
            type="number"
            placeholder="R$ 0,00"
            className="bg-card border-border"
          />
        </div>

        {/* Brand and Model */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Marca</Label>
            <Input placeholder="Marca" className="bg-card border-border" />
          </div>
          <div className="space-y-2">
            <Label>Modelo</Label>
            <Input placeholder="Modelo" className="bg-card border-border" />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label>Descrição</Label>
          <Textarea
            placeholder="Descreva seu veículo..."
            className="bg-card border-border min-h-32 resize-none"
          />
        </div>

        {/* Trade option */}
        <div className="flex items-center space-x-2">
          <Checkbox id="trade" />
          <label
            htmlFor="trade"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Aceita troca?
          </label>
        </div>

        {/* Submit Button */}
        <Button className="w-full bg-gradient-primary text-primary-foreground font-semibold h-12 shadow-glow-primary hover:scale-[1.02] transition-transform">
          Publicar Agora
        </Button>
      </main>

      <BottomNav />
    </div>
  );
};

export default Publish;
