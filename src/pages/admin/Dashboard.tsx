import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, Package, LogOut, Scissors } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [reservations, services, workRegistry] = await Promise.all([
        supabase.from("reservations").select("*", { count: "exact" }),
        supabase.from("services").select("*", { count: "exact" }),
        supabase.from("work_registry").select("amount_charged"),
      ]);

      const totalEarnings = workRegistry.data?.reduce(
        (sum, record) => sum + Number(record.amount_charged || 0),
        0
      ) || 0;

      return {
        reservations: reservations.count || 0,
        services: services.count || 0,
        earnings: totalEarnings,
      };
    },
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scissors className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            <span className="text-base md:text-xl font-bold text-foreground">302 Barber Admin</span>
          </div>
          <Button variant="outline" onClick={handleLogout} size="sm" className="text-xs md:text-sm">
            <LogOut className="mr-0 md:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
            <span className="sm:hidden">Salir</span>
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground">Bienvenido al panel de administración</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Reservas
              </CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats?.reservations || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Catálogo
              </CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats?.services || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ganancias Totales
              </CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ₲{stats?.earnings.toLocaleString('es-PY') || "0"}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <Button
            onClick={() => navigate("/admin/reservations")}
            variant="outline"
            className="h-20 md:h-24 text-base md:text-lg flex-col md:flex-row gap-2"
          >
            <Calendar className="h-5 w-5 md:h-6 md:w-6" />
            <span>Gestionar Reservas</span>
          </Button>

          <Button
            onClick={() => navigate("/admin/services")}
            variant="outline"
            className="h-20 md:h-24 text-base md:text-lg flex-col md:flex-row gap-2"
          >
            <Package className="h-5 w-5 md:h-6 md:w-6" />
            <span>Gestionar Catálogo</span>
          </Button>

          <Button
            onClick={() => navigate("/admin/clients")}
            variant="outline"
            className="h-20 md:h-24 text-base md:text-lg flex-col md:flex-row gap-2"
          >
            <Package className="h-5 w-5 md:h-6 md:w-6" />
            <span>Gestionar Clientes</span>
          </Button>

          <Button
            onClick={() => navigate("/admin/work-registry")}
            variant="outline"
            className="h-20 md:h-24 text-base md:text-lg flex-col md:flex-row gap-2"
          >
            <DollarSign className="h-5 w-5 md:h-6 md:w-6" />
            <span>Registro de Trabajos</span>
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;