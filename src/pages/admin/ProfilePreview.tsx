import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PersonalProfileView } from "@/components/profile/PersonalProfileView";
import { CompanyProfileView } from "@/components/profile/CompanyProfileView";

const fakePersonalProfile = {
  id: "fake-personal-id",
  name: "Carlos Silva",
  location: "São Paulo, SP",
  photo_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos",
  bio: "Entusiasta de veículos e motos. Compro e vendo há mais de 10 anos. Sempre busco os melhores negócios e gosto de compartilhar minha paixão por veículos clássicos.",
  rating: 4.8,
  anuncios_ativos: 5,
  total_vendas: 23,
  total_tratos: 45,
  instagram_url: "https://instagram.com/carlossilva",
  whatsapp: "+55 11 98765-4321",
  verified: true,
  account_type: "pessoa_fisica" as const,
  created_at: "2023-01-15T10:00:00Z",
};

const fakeCompanyProfile = {
  id: "fake-company-id",
  name: "AutoMaster Veículos",
  location: "Rio de Janeiro, RJ",
  logo_url: "https://api.dicebear.com/7.x/initials/svg?seed=AutoMaster",
  bio: "Loja especializada em veículos seminovos e motos de alta performance. Atendimento personalizado e garantia em todos os veículos.",
  rating: 4.9,
  anuncios_ativos: 15,
  total_vendas: 156,
  total_tratos: 320,
  instagram_url: "https://instagram.com/automasterveiculos",
  whatsapp: "+55 21 99876-5432",
  site_url: "https://automasterveiculos.com.br",
  cnpj: "12.345.678/0001-90",
  endereco: "Av. Brasil, 1500 - Centro, Rio de Janeiro - RJ, 20040-020",
  horario_funcionamento: "Seg-Sex: 9h às 18h | Sáb: 9h às 14h",
  empresa_verificada: true,
  tempo_medio_resposta: 15,
  verified: true,
  account_type: "pessoa_juridica" as const,
  created_at: "2022-06-10T08:00:00Z",
};

export default function ProfilePreview() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Preview de Perfis</h1>
        <p className="text-muted-foreground mt-2">
          Visualize a experiência do cliente em diferentes tipos de perfil
        </p>
      </div>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="personal">Pessoa Física</TabsTrigger>
          <TabsTrigger value="company">Pessoa Jurídica</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Perfil Pessoa Física</CardTitle>
              <CardDescription>
                Visualização de como um perfil de pessoa física aparece para outros usuários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-background rounded-lg border p-6">
                <PersonalProfileView profile={fakePersonalProfile} isOwnProfile={false} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Perfil Pessoa Jurídica</CardTitle>
              <CardDescription>
                Visualização de como um perfil de empresa aparece para outros usuários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-background rounded-lg border p-6">
                <CompanyProfileView profile={fakeCompanyProfile} isOwnProfile={false} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
