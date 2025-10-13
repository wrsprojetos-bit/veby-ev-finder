import { BottomNav } from "@/components/BottomNav";
import { VehicleCard } from "@/components/VehicleCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Star, CheckCircle2, Settings } from "lucide-react";

const userAds = [
  {
    id: 1,
    title: "Bike Elétrica SuperCharge Pro",
    price: "R$ 4.500",
    location: "São Paulo, SP",
    distance: "Você",
    views: 1234,
    likes: 89,
    image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&q=80",
    category: "Bike Elétrica",
    acceptsTrade: true,
  },
];

const Profile = () => {
  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="fixed top-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 h-16">
          <h1 className="text-xl font-bold">Perfil</h1>
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="pt-16">
        {/* Profile Header */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <Avatar className="w-20 h-20 border-2 border-primary">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=User" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold">Usuário Demo</h2>
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                <MapPin className="w-4 h-4" />
                <span>São Paulo, SP</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-secondary text-secondary" />
                <span className="text-sm font-semibold">4.8</span>
                <span className="text-sm text-muted-foreground">(24 avaliações)</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">12</p>
              <p className="text-xs text-muted-foreground">Anúncios</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">8</p>
              <p className="text-xs text-muted-foreground">Vendidos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">95%</p>
              <p className="text-xs text-muted-foreground">Positivas</p>
            </div>
          </div>

          <Button className="w-full bg-gradient-primary text-primary-foreground font-semibold shadow-glow-primary">
            Editar Perfil
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="active" className="px-4">
          <TabsList className="w-full grid grid-cols-2 bg-card">
            <TabsTrigger value="active">Ativos</TabsTrigger>
            <TabsTrigger value="sold">Vendidos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="space-y-3 mt-4">
            {userAds.map((ad) => (
              <VehicleCard key={ad.id} {...ad} variant="list" />
            ))}
          </TabsContent>
          
          <TabsContent value="sold" className="mt-4">
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhum item vendido ainda</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;
