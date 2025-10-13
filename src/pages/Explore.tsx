import { BottomNav } from "@/components/BottomNav";
import { VehicleCard } from "@/components/VehicleCard";
import { Button } from "@/components/ui/button";
import { Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const categories = [
  "Todos",
  "Bike Elétrica",
  "Patinete",
  "Skate",
  "Scooter",
  "Carro",
  "Peças",
];

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

const Explore = () => {
  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="fixed top-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-3 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar veículos elétricos..."
                className="pl-10 bg-input border-border"
              />
            </div>
            <Button size="icon" variant="outline" className="border-border">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <Button
                key={category}
                variant="outline"
                size="sm"
                className="border-border whitespace-nowrap hover:bg-primary/10 hover:border-primary"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </header>

      <main className="pt-32 px-4 space-y-3">
        {vehicles.map((vehicle) => (
          <VehicleCard key={vehicle.id} {...vehicle} variant="list" />
        ))}
      </main>

      <BottomNav />
    </div>
  );
};

export default Explore;
