import { Home, Search, PlusCircle, MessageCircle, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Início", path: "/" },
  { icon: Search, label: "Explorar", path: "/explore" },
  { icon: PlusCircle, label: "Publicar", path: "/publish", highlight: true },
  { icon: MessageCircle, label: "Chat", path: "/chat" },
  { icon: User, label: "Perfil", path: "/profile" },
];

export const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border backdrop-blur-lg bg-opacity-95">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ icon: Icon, label, path, highlight }) => {
          const isActive = location.pathname === path;
          
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all",
                isActive && !highlight && "text-primary",
                !isActive && !highlight && "text-muted-foreground hover:text-foreground",
                highlight && "relative"
              )}
            >
              {highlight ? (
                <div className="absolute -top-6 p-3 rounded-full bg-gradient-primary shadow-glow-primary">
                  <Icon className="w-6 h-6 text-primary-foreground" />
                </div>
              ) : (
                <Icon className={cn("w-6 h-6", isActive && "drop-shadow-glow-primary")} />
              )}
              {!highlight && (
                <span className="text-xs font-medium">{label}</span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
