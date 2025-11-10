import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scissors, Clock, Star, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MobileNav } from "@/components/MobileNav";
import heroImage from "@/assets/hero-barbershop-real.jpg";

const Index = () => {
  const navigate = useNavigate();
  
  const navLinks = [
    { href: "/", label: "Inicio", isActive: true },
    { href: "/services", label: "Catálogo" },
    { href: "/booking", label: "Reservas" },
    { href: "/auth", label: "Admin" },
  ];

  return <div className="min-h-screen bg-background">
      <MobileNav links={navLinks} />

      <section className="relative h-[400px] md:h-[600px] overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{
        backgroundImage: `url(${heroImage})`
      }}>
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-background/60"></div>
        </div>
        <div className="relative container mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 md:mb-6 animate-fade-in">
              Estilo y Elegancia
              <span className="block text-primary">en Cada Corte</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 md:mb-8 animate-fade-in">Servicio profesional de barbería. Reserva tu cita y vive la experiencia 302 Barber.</p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 animate-fade-in">
              <Button size="lg" onClick={() => navigate("/booking")} className="w-full sm:w-auto">
                <Calendar className="mr-2 h-5 w-5" />
                Reservar Cita
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/services")} className="w-full sm:w-auto">
                Ver Catálogo
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-20 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 md:mb-4">
              ¿Por Qué Elegirnos?
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Calidad, profesionalismo y atención personalizada en cada visita
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-card border-border hover:border-primary transition-all duration-300">
              <CardHeader>
                <Star className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-foreground">Experiencia</CardTitle>
                <CardDescription>
                  Más de 15 años perfeccionando el arte de la barbería profesional
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border hover:border-primary transition-all duration-300">
              <CardHeader>
                <Clock className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-foreground">Puntualidad</CardTitle>
                <CardDescription>
                  Sistema de reservas que respeta tu tiempo y agenda
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border hover:border-primary transition-all duration-300">
              <CardHeader>
                <Scissors className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-foreground">Calidad</CardTitle>
                <CardDescription>
                  Productos premium y técnicas modernas para resultados excepcionales
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4 md:mb-6">
            Reserva Tu Próxima Cita
          </h2>
          <p className="text-base md:text-lg text-muted-foreground mb-6 md:mb-8 max-w-2xl mx-auto px-4">
            Sistema de reservas en línea disponible 24/7. Selecciona tu fecha y hora preferida.
          </p>
          <Button size="lg" onClick={() => navigate("/booking")} className="w-full sm:w-auto">
            <Calendar className="mr-2 h-5 w-5" />
            Hacer Reserva Ahora
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8 bg-card/50">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            © 2025 302 Barber. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>;
};
export default Index;