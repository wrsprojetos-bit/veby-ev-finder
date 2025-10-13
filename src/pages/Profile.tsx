import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { VehicleCard } from "@/components/VehicleCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Star, CheckCircle2, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";


const Profile = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [userListings, setUserListings] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUserListings();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user?.id)
      .single();
    
    if (data) setProfile(data);
  };

  const fetchUserListings = async () => {
    const { data } = await supabase
      .from("listings")
      .select("*")
      .eq("user_id", user?.id)
      .eq("status", "ativo")
      .order("created_at", { ascending: false });
    
    if (data) setUserListings(data);
  };

  if (loading || !profile) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Carregando...</p>
    </div>;
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="fixed top-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 h-16">
          <h1 className="text-xl font-bold">Perfil</h1>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="pt-16">
        {/* Profile Header */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <Avatar className="w-20 h-20 border-2 border-primary">
              <AvatarImage src={profile.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`} />
              <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold">{profile.name}</h2>
                {profile.verified && <CheckCircle2 className="w-5 h-5 text-primary" />}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                <MapPin className="w-4 h-4" />
                <span>{profile.location || "Localização não informada"}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-secondary text-secondary" />
                <span className="text-sm font-semibold">{profile.rating.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">({profile.total_tratos} tratos)</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{userListings.length}</p>
              <p className="text-xs text-muted-foreground">Anúncios</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{profile.total_tratos}</p>
              <p className="text-xs text-muted-foreground">Tratos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{profile.rating > 0 ? '95%' : '0%'}</p>
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
            {userListings.length > 0 ? (
              userListings.map((listing) => (
                <VehicleCard 
                  key={listing.id} 
                  id={listing.id}
                  title={listing.brand_model}
                  price={`R$ ${listing.price?.toFixed(2).replace('.', ',')}`}
                  location={listing.location}
                  distance="Você"
                  views={listing.views}
                  likes={listing.likes}
                  image={listing.thumbnail_url || listing.images?.[0] || "https://images.unsplash.com/photo-1558981852-426c6c22a060?w=800&q=80"}
                  category={listing.category}
                  acceptsTrade={listing.accepts_trade}
                  variant="list" 
                />
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>Nenhum anúncio ativo</p>
              </div>
            )}
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
