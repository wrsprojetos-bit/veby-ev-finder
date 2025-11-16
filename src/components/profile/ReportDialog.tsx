import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportedUserId: string;
}

const reportReasons = [
  "Conteúdo impróprio",
  "Fraude ou golpe",
  "Spam",
  "Informações falsas",
  "Assédio ou abuso",
  "Outro"
];

export const ReportDialog = ({ open, onOpenChange, reportedUserId }: ReportDialogProps) => {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      toast.error("Por favor, selecione um motivo");
      return;
    }

    // Validate report data
    try {
      const { reportSchema } = await import("@/schemas/validation");
      const validationResult = reportSchema.safeParse({
        reason,
        description: description.trim() || null,
      });

      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast.error(firstError.message);
        return;
      }
    } catch (validationError: any) {
      toast.error(validationError.message || "Erro de validação");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Você precisa estar logado");
        return;
      }

      const { error } = await supabase.from("reports").insert({
        reporter_id: user.id,
        reported_user_id: reportedUserId,
        reason,
        description: description.trim() || null,
      });

      if (error) throw error;

      toast.success("Denúncia enviada com sucesso");
      onOpenChange(false);
      setReason("");
      setDescription("");
    } catch (error) {
      console.error("Erro ao enviar denúncia:", error);
      toast.error("Erro ao enviar denúncia");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Denunciar Perfil</DialogTitle>
          <DialogDescription>
            Selecione o motivo da denúncia e forneça detalhes adicionais se necessário.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            <Label>Motivo da denúncia</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {reportReasons.map((reasonOption) => (
                <div key={reasonOption} className="flex items-center space-x-2">
                  <RadioGroupItem value={reasonOption} id={reasonOption} />
                  <Label htmlFor={reasonOption} className="font-normal cursor-pointer">
                    {reasonOption}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Forneça mais detalhes sobre a denúncia..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Enviando..." : "Enviar Denúncia"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
