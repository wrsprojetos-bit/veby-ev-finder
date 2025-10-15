import { useState } from "react";
import { useAuth } from "./useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

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
      <AlertDialogContent>
        <AlertDialogCancel className="absolute right-4 top-4 border-0 hover:bg-transparent p-0 h-auto">
          <X className="h-4 w-4" />
        </AlertDialogCancel>
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
