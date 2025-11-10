import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scissors, Clock, Star, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-barbershop-real.jpg";
const Index = () => {
  const navigate = useNavigate();
  return <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scissors className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">302 Barber</span>
          </div>
          <div className="flex gap-6">
            <a href="/" className="text-primary font-medium">Inicio</a>
            <a href="/services" className="text-muted-foreground hover:text-foreground transition-colors">Catálogo
          </a>
            <a href="/booking" className="text-muted-foreground hover:text-foreground transition-colors">Reservas</a>
            <a href="/auth" className="text-muted-foreground hover:text-foreground transition-colors">Admin</a>
          </div>
        </div>
      </nav>

      <section className="relative h-[600px] overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{
        backgroundImage: `url(${heroImage})`
      }}>
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-background/60"></div>
        </div>
        <div className="relative container mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 animate-fade-in">
              Estilo y Elegancia
              <span className="block text-primary">en Cada Corte</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 animate-fade-in">Servicio profesional de barbería .Reserva tu cita y vive la experiencia 302 Barber.</p>
            <div className="flex gap-4 animate-fade-in">
              <Button size="lg" onClick={() => navigate("/booking")}>
                <Calendar className="mr-2 h-5 w-5" />
                Reservar Cita
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/services")}>
                Ver Catálogo
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              ¿Por Qué Elegirnos?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Calidad, profesionalismo y atención personalizada en cada visita
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-card border-border hover:border-primary transition-all duration-300">
              <CardHeader>
                <Star className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-foreground">Experiencia</CardTitle>
                <CardDescription>
                  Más de 5 años perfeccionando el arte de la barbería profesional
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

      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Reserva Tu Próxima Cita
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Sistema de reservas en línea disponible 24/7. Selecciona tu fecha y hora preferida.
          </p>
          <Button size="lg" onClick={() => navigate("/booking")}>
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