import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { VehicleCard } from "@/components/VehicleCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { PersonalProfileView } from "@/components/profile/PersonalProfileView";
import { CompanyProfileView } from "@/components/profile/CompanyProfileView";
import { EditProfileDialog } from "@/components/profile/EditProfileDialog";

const LikedListings = () => {
  const { user } = useAuth();
  const [likedListings, setLikedListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchLikedListings = async () => {
      const { data } = await supabase
        .from("likes")
        .select(`
          listing_id,
          listings (
            *,
            profiles:user_id (
              name,
              photo_url
            )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        const listings = data.map((item: any) => item.listings).filter(Boolean);
        setLikedListings(listings);
      }
      setLoading(false);
    };

    fetchLikedListings();
  }, [user]);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Carregando...</div>;
  }

  if (likedListings.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">Nenhum anúncio curtido</div>;
  }

  return (
    <>
      {likedListings.map((listing) => (
        <VehicleCard 
          key={listing.id}
          id={listing.id}
          title={listing.brand_model}
          price={`R$ ${listing.price?.toFixed(2).replace('.', ',')}`}
          location={listing.location}
          distance="--"
          views={listing.views}
          image={listing.thumbnail_url || listing.images?.[0] || ""}
          category={listing.category}
          acceptsTrade={listing.accepts_trade}
          variant="list"
          sellerId={listing.user_id}
          listingId={listing.id}
          sellerName={listing.profiles?.name}
          sellerAvatar={listing.profiles?.photo_url}
        />
      ))}
    </>
  );
};

const FavoritedListings = () => {
  const { user } = useAuth();
  const [favoritedListings, setFavoritedListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchFavoritedListings = async () => {
      const { data } = await supabase
        .from("favorites")
        .select(`
          listing_id,
          listings (
            *,
            profiles:user_id (
              name,
              photo_url
            )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        const listings = data.map((item: any) => item.listings).filter(Boolean);
        setFavoritedListings(listings);
      }
      setLoading(false);
    };

    fetchFavoritedListings();
  }, [user]);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Carregando...</div>;
  }

  if (favoritedListings.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">Nenhum anúncio favoritado</div>;
  }

  return (
    <>
      {favoritedListings.map((listing) => (
        <VehicleCard 
          key={listing.id}
          id={listing.id}
          title={listing.brand_model}
          price={`R$ ${listing.price?.toFixed(2).replace('.', ',')}`}
          location={listing.location}
          distance="--"
          views={listing.views}
          image={listing.thumbnail_url || listing.images?.[0] || ""}
          category={listing.category}
          acceptsTrade={listing.accepts_trade}
          variant="list"
          sellerId={listing.user_id}
          listingId={listing.id}
          sellerName={listing.profiles?.name}
          sellerAvatar={listing.profiles?.photo_url}
        />
      ))}
    </>
  );
};


const Profile = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [userListings, setUserListings] = useState<any[]>([]);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    // Redirect only if trying to access own profile without auth
    if (!loading && !user) {
      navigate("/");
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
    
    if (data) {
      setProfile(data);
    }
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
        {/* Profile View */}
        <div className="p-6 space-y-4">
          {profile.account_type === 'empresa' ? (
            <CompanyProfileView profile={profile} isOwnProfile={true} />
          ) : (
            <PersonalProfileView profile={profile} isOwnProfile={true} />
          )}

          <Button 
            onClick={() => setIsEditOpen(true)}
            className="w-full"
          >
            Editar Perfil
          </Button>
        </div>

        <EditProfileDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          profile={profile}
          onProfileUpdated={fetchProfile}
        />

        {/* Tabs */}
        <Tabs defaultValue="active" className="px-4">
          <TabsList className="w-full grid grid-cols-3 bg-card">
            <TabsTrigger value="active">Ativos</TabsTrigger>
            <TabsTrigger value="liked">Curtidos</TabsTrigger>
            <TabsTrigger value="favorites">Favoritos</TabsTrigger>
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
                  image={listing.thumbnail_url || listing.images?.[0] || "https://images.unsplash.com/photo-1558981852-426c6c22a060?w=800&q=80"}
                  category={listing.category}
                  acceptsTrade={listing.accepts_trade}
                  variant="list"
                  sellerId={listing.user_id}
                  listingId={listing.id}
                />
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>Nenhum anúncio ativo</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="liked" className="space-y-3 mt-4">
            <LikedListings />
          </TabsContent>

          <TabsContent value="favorites" className="space-y-3 mt-4">
            <FavoritedListings />
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;
