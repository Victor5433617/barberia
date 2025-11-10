import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scissors } from "lucide-react";
import heroImage from "@/assets/hero-barbershop-real.jpg";

const Services = () => {
  const { data: services, isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 bg-cover bg-center" style={{
        backgroundImage: `url(${heroImage})`
      }}>
        <div className="absolute inset-0 bg-background/95"></div>
      </div>
      
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50 relative">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <Scissors className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">302 Barber</span>
          </a>
          <div className="flex gap-6">
            <a href="/" className="text-muted-foreground hover:text-foreground transition-colors">Inicio</a>
            <a href="/services" className="text-primary font-medium">Catálogo</a>
            <a href="/booking" className="text-muted-foreground hover:text-foreground transition-colors">Reservas</a>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-16 relative">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Nuestro Catálogo
          </h1>
          <p className="text-xl text-muted-foreground">
            Cortes y servicios de primera calidad
          </p>
        </div>
        {!services || services.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              Próximamente agregaremos nuestro catálogo
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <Card 
                key={service.id} 
                className="bg-card border-border hover:border-primary transition-all duration-300 overflow-hidden group hover:shadow-xl"
              >
                <div className="relative h-64 overflow-hidden bg-muted">
                  {service.image_url ? (
                    <img
                      src={service.image_url}
                      alt={service.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Scissors className="h-20 w-20 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <CardHeader>
                  <CardTitle className="text-foreground text-2xl">{service.name}</CardTitle>
                  {service.description && (
                    <CardDescription className="text-muted-foreground text-base mt-2">
                      {service.description}
                    </CardDescription>
                  )}
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Services;