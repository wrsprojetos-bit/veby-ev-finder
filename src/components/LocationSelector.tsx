import { useState, useEffect } from "react";
import { MapPin, Navigation, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BRAZILIAN_STATES } from "@/data/categories";
import { useCities } from "@/hooks/useCities";
import { useGeolocation } from "@/hooks/useGeolocation";
import { toast } from "sonner";

interface LocationSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLocationChange?: (state: string, city: string) => void;
}

export const LocationSelector = ({ open, onOpenChange, onLocationChange }: LocationSelectorProps) => {
  const { location, loading, requestLocation, updateLocation } = useGeolocation();
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const cities = useCities(selectedState);

  useEffect(() => {
    if (location.state && location.city) {
      setSelectedState(location.state);
      setSelectedCity(location.city);
    }
  }, [location]);

  const handleAutoLocation = async () => {
    await requestLocation();
    toast.success("Localização detectada!");
  };

  const handleManualSave = () => {
    if (!selectedState || !selectedCity) {
      toast.error("Selecione estado e cidade");
      return;
    }

    updateLocation(selectedState, selectedCity);
    onLocationChange?.(selectedState, selectedCity);
    toast.success(`Localização atualizada: ${selectedCity}, ${selectedState}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <MapPin className="w-5 h-5 text-[#00FF7F]" />
            Sua Localização
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Detecção automática */}
          <div className="space-y-2">
            <p className="text-sm text-white/70">
              Permitir acesso à sua localização para ver anúncios próximos
            </p>
            <Button
              onClick={handleAutoLocation}
              disabled={loading}
              className="w-full bg-[#00FF7F] text-black hover:bg-[#00FF7F]/90"
            >
              <Navigation className="w-4 h-4 mr-2" />
              {loading ? "Detectando..." : "Detectar Automaticamente"}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/50">OU</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Seleção manual */}
          <div className="space-y-3">
            <p className="text-sm text-white/70">Escolher manualmente</p>
            
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Selecione o Estado" />
              </SelectTrigger>
              <SelectContent className="bg-black border-white/20">
                {BRAZILIAN_STATES.map((state) => (
                  <SelectItem key={state.uf} value={state.uf} className="text-white">
                    {state.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedState && (
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Selecione a Cidade" />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/20">
                  {cities.map((city) => (
                    <SelectItem key={city} value={city} className="text-white">
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button
              onClick={handleManualSave}
              disabled={!selectedState || !selectedCity}
              className="w-full bg-white/10 text-white hover:bg-white/20 border border-white/20"
            >
              Salvar Localização
            </Button>
          </div>

          {/* Localização atual */}
          {location.state && location.city && (
            <div className="mt-4 p-3 rounded-lg bg-[#00FF7F]/10 border border-[#00FF7F]/20">
              <p className="text-xs text-white/70 mb-1">Localização atual:</p>
              <p className="text-sm font-semibold text-[#00FF7F]">
                {location.city}, {location.state}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
