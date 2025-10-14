import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Ban } from "lucide-react";

interface BlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blockedUserId: string;
  blockedUserName: string;
}

export const BlockDialog = ({ open, onOpenChange, blockedUserId, blockedUserName }: BlockDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBlock = async () => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Você precisa estar logado");
        return;
      }

      const { error } = await supabase.from("blocks").insert({
        blocker_id: user.id,
        blocked_id: blockedUserId,
      });

      if (error) {
        if (error.code === '23505') {
          toast.error("Você já bloqueou este usuário");
        } else {
          throw error;
        }
        return;
      }

      toast.success(`${blockedUserName} foi bloqueado`);
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao bloquear usuário:", error);
      toast.error("Erro ao bloquear usuário");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-destructive" />
            Bloquear {blockedUserName}?
          </DialogTitle>
          <DialogDescription>
            Ao bloquear este usuário:
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Você não verá mais os anúncios dele</li>
              <li>Ele não poderá entrar em contato com você</li>
              <li>Você pode desbloquear depois se quiser</li>
            </ul>
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleBlock}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? "Bloqueando..." : "Bloquear"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
