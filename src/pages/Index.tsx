import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { VehicleCard } from "@/components/VehicleCard";
import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";

// Mock data
const vehicles = [
  {
    id: 1,
    title: "Bike Elétrica SuperCharge Pro",
    price: "R$ 4.500",
    location: "São Paulo, SP",
    distance: "2.3 km",
    views: 1234,
    likes: 89,
    image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&q=80",
    category: "Bike Elétrica",
    acceptsTrade: true,
  },
  {
    id: 2,
    title: "Patinete Xiaomi Mi Pro 2",
    price: "R$ 2.800",
    location: "Rio de Janeiro, RJ",
    distance: "5.1 km",
    views: 856,
    likes: 45,
    image: "https://images.unsplash.com/photo-1621544402532-7a86ed81d07a?w=800&q=80",
    category: "Patinete",
    acceptsTrade: false,
  },
  {
    id: 3,
    title: "Scooter Elétrica Voltz EV1",
    price: "R$ 8.900",
    location: "Curitiba, PR",
    distance: "1.8 km",
    views: 2341,
    likes: 156,
    image: "https://images.unsplash.com/photo-1558981852-426c6c22a060?w=800&q=80",
    category: "Scooter",
    acceptsTrade: true,
  },
];

const Index = () => {
  const [viewMode, setViewMode] = useState<"feed" | "list">("feed");

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-black/40 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 h-14">
          <button className="text-sm px-3 py-1.5 border border-white/20 rounded-md">
            LIVE
          </button>
          <div className="flex items-center gap-6 flex-1 justify-center">
            <button className="text-sm text-white/70">Explorar</button>
            <button className="text-sm text-white/70">A seguir</button>
            <button className="text-base font-semibold text-white border-b-2 border-white pb-1">
              Para Ti
            </button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode(viewMode === "feed" ? "list" : "feed")}
            className="hover:bg-white/10"
          >
            {viewMode === "feed" ? (
              <List className="w-5 h-5" />
            ) : (
              <LayoutGrid className="w-5 h-5" />
            )}
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="pt-0">
        {viewMode === "feed" ? (
          <div className="snap-y snap-mandatory overflow-y-scroll h-screen">
            {vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} {...vehicle} variant="feed" />
            ))}
          </div>
        ) : (
          <div className="space-y-3 p-4 pt-20">
            {vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} {...vehicle} variant="list" />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
