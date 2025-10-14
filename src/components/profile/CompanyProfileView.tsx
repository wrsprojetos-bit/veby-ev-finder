import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, ExternalLink, Clock, Building2, AlertTriangle, Ban, Phone } from "lucide-react";
import { useState } from "react";
import { ReportDialog } from "./ReportDialog";
import { BlockDialog } from "./BlockDialog";

interface CompanyProfileViewProps {
  profile: {
    id: string;
    name: string;
    location: string | null;
    logo_url: string | null;
    cnpj: string | null;
    endereco: string | null;
    site_url: string | null;
    whatsapp: string | null;
    instagram_url: string | null;
    horario_funcionamento: string | null;
    rating: number;
    total_tratos: number;
    anuncios_ativos: number;
    total_vendas: number;
    tempo_medio_resposta: number | null;
    empresa_verificada: boolean;
  };
  isOwnProfile: boolean;
}

export const CompanyProfileView = ({ profile, isOwnProfile }: CompanyProfileViewProps) => {
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header da Empresa */}
      <div className="rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10 p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-24 w-24 rounded-lg">
            <AvatarImage src={profile.logo_url || ""} />
            <AvatarFallback className="text-2xl rounded-lg">
              <Building2 className="h-12 w-12" />
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">{profile.name}</h2>
              {profile.empresa_verificada && (
                <Badge className="bg-blue-500">
                  <Building2 className="h-3 w-3 mr-1" />
                  Verificada
                </Badge>
              )}
            </div>

            {profile.location && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{profile.location}</span>
              </div>
            )}

            {/* Avaliação */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{profile.rating.toFixed(1)}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                ({profile.total_tratos} {profile.total_tratos === 1 ? 'avaliação' : 'avaliações'})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Informações da Empresa */}
      {profile.cnpj && (
        <div className="space-y-1">
          <h3 className="font-semibold">CNPJ</h3>
          <p className="text-muted-foreground font-mono">{profile.cnpj}</p>
        </div>
      )}

      {profile.endereco && (
        <div className="space-y-1">
          <h3 className="font-semibold">Endereço</h3>
          <p className="text-muted-foreground">{profile.endereco}</p>
        </div>
      )}

      {profile.horario_funcionamento && (
        <div className="space-y-1">
          <h3 className="font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Horário de Funcionamento
          </h3>
          <p className="text-muted-foreground whitespace-pre-line">{profile.horario_funcionamento}</p>
        </div>
      )}

      {/* Estatísticas da Empresa */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4 text-center">
          <div className="text-2xl font-bold">{profile.anuncios_ativos}</div>
          <div className="text-xs text-muted-foreground">Anúncios Ativos</div>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <div className="text-2xl font-bold">{profile.total_vendas}</div>
          <div className="text-xs text-muted-foreground">Vendas</div>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <div className="text-2xl font-bold">{profile.total_tratos}</div>
          <div className="text-xs text-muted-foreground">Negociações</div>
        </div>
        {profile.tempo_medio_resposta !== null && (
          <div className="rounded-lg border bg-card p-4 text-center">
            <div className="text-2xl font-bold">{profile.tempo_medio_resposta}min</div>
            <div className="text-xs text-muted-foreground">Tempo Resposta</div>
          </div>
        )}
      </div>

      {/* Links e Contatos */}
      <div className="space-y-2">
        <h3 className="font-semibold">Contatos</h3>
        <div className="flex flex-wrap gap-2">
          {profile.whatsapp && (
            <Button
              variant="default"
              size="sm"
              onClick={() => window.open(`https://wa.me/${profile.whatsapp}`, '_blank')}
              className="bg-green-600 hover:bg-green-700"
            >
              <Phone className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
          )}
          {profile.site_url && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(profile.site_url!, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Site
            </Button>
          )}
          {profile.instagram_url && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(profile.instagram_url!, '_blank')}
            >
              Instagram
            </Button>
          )}
        </div>
      </div>

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
