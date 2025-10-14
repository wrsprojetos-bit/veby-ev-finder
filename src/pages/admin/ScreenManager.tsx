import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ScreenConfig {
  id: string;
  name: string;
  path: string;
  type: "public" | "private";
  active: boolean;
  title?: string;
  description?: string;
  backgroundColor?: string;
  textColor?: string;
  buttonColor?: string;
}

const initialScreens: ScreenConfig[] = [
  { id: "1", name: "Tela Inicial", path: "/", type: "public", active: true, title: "VEBY", description: "Marketplace de veículos leves" },
  { id: "2", name: "Explorar", path: "/explore", type: "public", active: true, title: "Explorar Anúncios" },
  { id: "3", name: "Publicar", path: "/publish", type: "private", active: true, title: "Publicar Anúncio" },
  { id: "4", name: "Chat", path: "/chat", type: "private", active: true, title: "Mensagens" },
  { id: "5", name: "Perfil", path: "/profile", type: "private", active: true, title: "Meu Perfil" },
  { id: "6", name: "Autenticação", path: "/auth", type: "public", active: true, title: "Login / Cadastro" },
];

export default function ScreenManager() {
  const [screens, setScreens] = useState<ScreenConfig[]>(initialScreens);
  const [selectedScreen, setSelectedScreen] = useState<ScreenConfig | null>(null);
  const [editedScreen, setEditedScreen] = useState<ScreenConfig | null>(null);

  const handleToggleActive = async (screenId: string) => {
    const screen = screens.find(s => s.id === screenId);
    if (!screen) return;

    const newStatus = !screen.active;
    
    setScreens(screens.map(s => 
      s.id === screenId ? { ...s, active: newStatus } : s
    ));

    // Log da ação
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("admin_logs").insert([{
        admin_id: user.id,
        action: newStatus ? "screen_activated" : "screen_deactivated",
        target_type: "screen",
        target_id: screenId,
        details: { screen_name: screen.name, screen_path: screen.path }
      }]);
    }

    toast.success(`Tela ${screen.name} ${newStatus ? "ativada" : "desativada"}`);
  };

  const handleSaveChanges = async () => {
    if (!editedScreen) return;

    setScreens(screens.map(s => 
      s.id === editedScreen.id ? editedScreen : s
    ));

    // Log da ação
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("admin_logs").insert([{
        admin_id: user.id,
        action: "screen_updated",
        target_type: "screen",
        target_id: editedScreen.id,
        details: { 
          screen_name: editedScreen.name,
          title: editedScreen.title || "",
          description: editedScreen.description || "",
          backgroundColor: editedScreen.backgroundColor || "",
          textColor: editedScreen.textColor || "",
          buttonColor: editedScreen.buttonColor || ""
        }
      }]);
    }

    toast.success("Alterações salvas com sucesso!");
    setSelectedScreen(null);
    setEditedScreen(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gerenciar Telas do App</h1>
        <p className="text-muted-foreground">Controle visual e de conteúdo de todas as páginas</p>
      </div>

      <div className="grid gap-4">
        {screens.map((screen) => (
          <Card key={screen.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {screen.name}
                    {!screen.active && <EyeOff className="h-4 w-4 text-muted-foreground" />}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Caminho: {screen.path} • {screen.type === "public" ? "Pública" : "Privada"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`active-${screen.id}`} className="text-sm">
                      {screen.active ? "Ativa" : "Inativa"}
                    </Label>
                    <Switch
                      id={`active-${screen.id}`}
                      checked={screen.active}
                      onCheckedChange={() => handleToggleActive(screen.id)}
                    />
                  </div>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedScreen(screen);
                          setEditedScreen({ ...screen });
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Editar {screen.name}</DialogTitle>
                      </DialogHeader>
                      
                      {editedScreen && (
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="title">Título da Tela</Label>
                            <Input
                              id="title"
                              value={editedScreen.title || ""}
                              onChange={(e) => setEditedScreen({ ...editedScreen, title: e.target.value })}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="description">Descrição</Label>
                            <Textarea
                              id="description"
                              value={editedScreen.description || ""}
                              onChange={(e) => setEditedScreen({ ...editedScreen, description: e.target.value })}
                              rows={3}
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="bg-color">Cor de Fundo</Label>
                              <Input
                                id="bg-color"
                                type="color"
                                value={editedScreen.backgroundColor || "#ffffff"}
                                onChange={(e) => setEditedScreen({ ...editedScreen, backgroundColor: e.target.value })}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="text-color">Cor do Texto</Label>
                              <Input
                                id="text-color"
                                type="color"
                                value={editedScreen.textColor || "#000000"}
                                onChange={(e) => setEditedScreen({ ...editedScreen, textColor: e.target.value })}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="button-color">Cor dos Botões</Label>
                              <Input
                                id="button-color"
                                type="color"
                                value={editedScreen.buttonColor || "#000000"}
                                onChange={(e) => setEditedScreen({ ...editedScreen, buttonColor: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="pt-4 border-t">
                            <h4 className="font-semibold mb-2">Preview</h4>
                            <div 
                              className="p-6 rounded-lg border"
                              style={{
                                backgroundColor: editedScreen.backgroundColor,
                                color: editedScreen.textColor
                              }}
                            >
                              <h2 className="text-2xl font-bold mb-2">{editedScreen.title}</h2>
                              <p className="mb-4">{editedScreen.description}</p>
                              <Button style={{ backgroundColor: editedScreen.buttonColor }}>
                                Botão de Exemplo
                              </Button>
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={() => {
                              setSelectedScreen(null);
                              setEditedScreen(null);
                            }}>
                              Cancelar
                            </Button>
                            <Button onClick={handleSaveChanges}>
                              Salvar Alterações
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
