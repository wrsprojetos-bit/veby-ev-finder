import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Instagram, MapPin, Star, AlertTriangle, Ban } from "lucide-react";
import { useState } from "react";
import { ReportDialog } from "./ReportDialog";
import { BlockDialog } from "./BlockDialog";

interface PersonalProfileViewProps {
  profile: {
    id: string;
    name: string;
    location: string | null;
    photo_url: string | null;
    bio: string | null;
    instagram_url: string | null;
    whatsapp: string | null;
    rating: number;
    total_tratos: number;
    anuncios_ativos: number;
    total_vendas: number;
  };
  isOwnProfile: boolean;
}

export const PersonalProfileView = ({ profile, isOwnProfile }: PersonalProfileViewProps) => {
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header do Perfil */}
      <div className="flex items-start gap-4">
        <Avatar className="h-24 w-24">
          <AvatarImage src={profile.photo_url || ""} />
          <AvatarFallback className="text-2xl">
            {profile.name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          <div>
            <h2 className="text-2xl font-bold">{profile.name}</h2>
            {profile.location && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{profile.location}</span>
              </div>
            )}
          </div>

          {/* Avaliação */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{profile.rating.toFixed(1)}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              ({profile.total_tratos} {profile.total_tratos === 1 ? 'trato' : 'tratos'})
            </span>
          </div>
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <div className="space-y-1">
          <h3 className="font-semibold">Sobre</h3>
          <p className="text-muted-foreground">{profile.bio}</p>
        </div>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-4 rounded-lg border bg-card p-4">
        <div className="text-center">
          <div className="text-2xl font-bold">{profile.anuncios_ativos}</div>
          <div className="text-xs text-muted-foreground">Anúncios Ativos</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{profile.total_vendas}</div>
          <div className="text-xs text-muted-foreground">Vendidos</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{profile.total_tratos}</div>
          <div className="text-xs text-muted-foreground">Negociações</div>
        </div>
      </div>

      {/* Links de Redes Sociais */}
      {(profile.instagram_url || profile.whatsapp) && (
        <div className="space-y-2">
          <h3 className="font-semibold">Contatos</h3>
          <div className="flex gap-2">
            {profile.instagram_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(profile.instagram_url!, '_blank')}
              >
                <Instagram className="h-4 w-4 mr-2" />
                Instagram
              </Button>
            )}
            {profile.whatsapp && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://wa.me/${profile.whatsapp}`, '_blank')}
              >
                WhatsApp
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Ações - Denunciar e Bloquear */}
      {!isOwnProfile && (
        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReportDialog(true)}
            className="flex-1"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Denunciar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowBlockDialog(true)}
            className="flex-1"
          >
            <Ban className="h-4 w-4 mr-2" />
            Bloquear
          </Button>
        </div>
      )}

      <ReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        reportedUserId={profile.id}
      />
      <BlockDialog
        open={showBlockDialog}
        onOpenChange={setShowBlockDialog}
        blockedUserId={profile.id}
        blockedUserName={profile.name}
      />
    </div>
  );
};
