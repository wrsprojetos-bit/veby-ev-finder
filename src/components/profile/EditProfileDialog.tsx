import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Building2, User } from "lucide-react";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: any;
  onProfileUpdated: () => void;
}

export const EditProfileDialog = ({ open, onOpenChange, profile, onProfileUpdated }: EditProfileDialogProps) => {
  const [accountType, setAccountType] = useState<'pessoa_fisica' | 'empresa'>(profile?.account_type || 'pessoa_fisica');
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    photo_url: '',
    bio: '',
    instagram_url: '',
    whatsapp: '',
    // Empresa
    cnpj: '',
    logo_url: '',
    endereco: '',
    site_url: '',
    horario_funcionamento: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      setAccountType(profile.account_type || 'pessoa_fisica');
      setFormData({
        name: profile.name || '',
        location: profile.location || '',
        photo_url: profile.photo_url || '',
        bio: profile.bio || '',
        instagram_url: profile.instagram_url || '',
        whatsapp: profile.whatsapp || '',
        cnpj: profile.cnpj || '',
        logo_url: profile.logo_url || '',
        endereco: profile.endereco || '',
        site_url: profile.site_url || '',
        horario_funcionamento: profile.horario_funcionamento || '',
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (accountType === 'empresa' && !formData.cnpj) {
      toast.error("CNPJ é obrigatório para empresas");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updateData: any = {
        account_type: accountType,
        name: formData.name,
        location: formData.location || null,
        instagram_url: formData.instagram_url || null,
        whatsapp: formData.whatsapp || null,
      };

      if (accountType === 'pessoa_fisica') {
        updateData.photo_url = formData.photo_url || null;
        updateData.bio = formData.bio || null;
        // Limpar campos de empresa
        updateData.cnpj = null;
        updateData.logo_url = null;
        updateData.endereco = null;
        updateData.site_url = null;
        updateData.horario_funcionamento = null;
      } else {
        updateData.logo_url = formData.logo_url || null;
        updateData.cnpj = formData.cnpj;
        updateData.endereco = formData.endereco || null;
        updateData.site_url = formData.site_url || null;
        updateData.horario_funcionamento = formData.horario_funcionamento || null;
        // Limpar campos de pessoa física
        updateData.photo_url = null;
        updateData.bio = null;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Perfil atualizado com sucesso!");
      onProfileUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      toast.error("Erro ao atualizar perfil");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de Conta */}
          <div className="space-y-3">
            <Label>Tipo de Conta</Label>
            <RadioGroup value={accountType} onValueChange={(v) => setAccountType(v as any)}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="pessoa_fisica" id="pessoa_fisica" />
                <Label htmlFor="pessoa_fisica" className="flex items-center gap-2 cursor-pointer flex-1">
                  <User className="h-5 w-5" />
                  <div>
                    <div className="font-semibold">Pessoa Física</div>
                    <div className="text-xs text-muted-foreground">Perfil pessoal para compra e venda</div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="empresa" id="empresa" />
                <Label htmlFor="empresa" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Building2 className="h-5 w-5" />
                  <div>
                    <div className="font-semibold">Empresa / Loja</div>
                    <div className="text-xs text-muted-foreground">Perfil comercial com CNPJ</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Campos Comuns */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                {accountType === 'empresa' ? 'Nome da Empresa' : 'Nome Completo'} *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Cidade e Estado *</Label>
              <Input
                id="location"
                placeholder="Ex: São Paulo, SP"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="instagram_url">Instagram</Label>
                <Input
                  id="instagram_url"
                  placeholder="https://instagram.com/..."
                  value={formData.instagram_url}
                  onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  placeholder="5511999999999"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Campos de Pessoa Física */}
          {accountType === 'pessoa_fisica' && (
            <div className="space-y-4 p-4 border rounded-lg bg-accent/50">
              <h3 className="font-semibold">Informações Pessoais</h3>
              
              <div className="space-y-2">
                <Label htmlFor="photo_url">URL da Foto de Perfil</Label>
                <Input
                  id="photo_url"
                  placeholder="https://..."
                  value={formData.photo_url}
                  onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio (máx. 120 caracteres)</Label>
                <Textarea
                  id="bio"
                  placeholder="Conte um pouco sobre você..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value.slice(0, 120) })}
                  maxLength={120}
                  rows={3}
                />
                <div className="text-xs text-muted-foreground text-right">
                  {formData.bio.length}/120
                </div>
              </div>
            </div>
          )}

          {/* Campos de Empresa */}
          {accountType === 'empresa' && (
            <div className="space-y-4 p-4 border rounded-lg bg-accent/50">
              <h3 className="font-semibold">Informações da Empresa</h3>
              
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input
                  id="cnpj"
                  placeholder="00.000.000/0000-00"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  required={accountType === 'empresa'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo_url">URL do Logo</Label>
                <Input
                  id="logo_url"
                  placeholder="https://..."
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço Completo</Label>
                <Input
                  id="endereco"
                  placeholder="Rua, número, bairro..."
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="site_url">Site</Label>
                <Input
                  id="site_url"
                  placeholder="https://..."
                  value={formData.site_url}
                  onChange={(e) => setFormData({ ...formData, site_url: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="horario_funcionamento">Horário de Funcionamento</Label>
                <Textarea
                  id="horario_funcionamento"
                  placeholder="Ex: Seg-Sex: 9h-18h&#10;Sáb: 9h-13h"
                  value={formData.horario_funcionamento}
                  onChange={(e) => setFormData({ ...formData, horario_funcionamento: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
