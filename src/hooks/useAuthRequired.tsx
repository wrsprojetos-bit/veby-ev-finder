import { useState } from "react";
import { useAuth } from "./useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const useAuthRequired = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  const requireAuth = (action: () => void) => {
    if (!user) {
      setShowLoginDialog(true);
      return false;
    }
    action();
    return true;
  };

  const LoginDialog = () => (
    <AlertDialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
      <AlertDialogContent className="relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowLoginDialog(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </Button>
        <AlertDialogHeader>
          <AlertDialogTitle>Login necessário</AlertDialogTitle>
          <AlertDialogDescription>
            Faça login para continuar e negociar no VEBY 🚀
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => {
            setShowLoginDialog(false);
            navigate("/auth");
          }}>
            Entrar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { user, requireAuth, LoginDialog };
};
