import { Home, Search, PlusCircle, MessageCircle, User } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuthRequired } from "@/hooks/useAuthRequired";

const navItems = [
  { icon: Home, label: "Início", path: "/" },
  { icon: Search, label: "Explorar", path: "/explore" },
  { icon: PlusCircle, label: "Publicar", path: "/publish", highlight: true },
  { icon: MessageCircle, label: "Chat", path: "/chat" },
  { icon: User, label: "Perfil", path: "/profile" },
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { requireAuth, LoginDialog } = useAuthRequired();

  const handlePublishClick = (e: React.MouseEvent) => {
    e.preventDefault();
    requireAuth(() => {
      navigate("/publish");
    });
  };

  return (
    <>
      <LoginDialog />
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border backdrop-blur-lg bg-opacity-95">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map(({ icon: Icon, label, path, highlight }) => {
            const isActive = location.pathname === path;
            
            if (highlight) {
              return (
                <button
                  key={path}
                  onClick={handlePublishClick}
                  className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all relative"
                >
                  <div className="absolute -top-6 p-3 rounded-full bg-gradient-primary shadow-glow-primary">
                    <Icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                </button>
              );
            }
            
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all",
                  isActive && "text-primary",
                  !isActive && "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("w-6 h-6", isActive && "drop-shadow-glow-primary")} />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};
