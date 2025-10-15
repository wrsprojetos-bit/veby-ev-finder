import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Package, Users, AlertCircle, Bell, Monitor, FileText, LogOut, Eye } from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { isAdmin, isSuperAdmin, loading } = useAdminRole();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground mb-4">Você não tem permissão para acessar esta página.</p>
          <Button onClick={() => navigate("/")}>Voltar ao Início</Button>
        </div>
      </div>
    );
  }

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
    { icon: Eye, label: "Preview Perfis", path: "/admin/profile-preview" },
    { icon: Package, label: "Anúncios", path: "/admin/listings" },
    { icon: Users, label: "Usuários", path: "/admin/users" },
    { icon: AlertCircle, label: "Denúncias", path: "/admin/reports" },
    { icon: Bell, label: "Notificações", path: "/admin/notifications" },
    { icon: Monitor, label: "Gerenciar Telas", path: "/admin/screens", superAdminOnly: true },
    { icon: FileText, label: "Logs", path: "/admin/logs" },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border p-4 flex flex-col">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">VEBY Admin</h1>
          <p className="text-sm text-muted-foreground">Painel Administrativo</p>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => {
            if (item.superAdminOnly && !isSuperAdmin) return null;
            
            return (
              <Button
                key={item.path}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => navigate(item.path)}
              >
                <item.icon className="h-4 w-4 mr-2" />
                {item.label}
              </Button>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={async () => {
              await signOut();
              navigate("/auth");
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
