import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Trash2, CheckCircle, XCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

const Reservations = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
      else setUser(session.user);
    });
  }, [navigate]);

  const { data: reservations, isLoading } = useQuery({
    queryKey: ["admin-reservations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .order("reservation_date", { ascending: true })
        .order("reservation_time", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "pending" | "confirmed" | "completed" | "cancelled" }) => {
      const { error } = await supabase
        .from("reservations")
        .update({ status })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Estado actualizado");
      queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
    },
  });

  const deleteReservation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("reservations")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reserva eliminada");
      queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
    },
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/admin")} size="sm" className="text-xs md:text-sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Volver al Dashboard</span>
            <span className="sm:hidden">Volver</span>
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6 md:py-8">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl text-foreground">Gestión de Reservas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : !reservations || reservations.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm md:text-base">No hay reservas registradas</p>
            ) : (
              <div className="overflow-x-auto -mx-4 md:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">Cliente</TableHead>
                        <TableHead className="min-w-[100px]">Teléfono</TableHead>
                        <TableHead className="min-w-[140px]">Fecha</TableHead>
                        <TableHead className="min-w-[80px]">Hora</TableHead>
                        <TableHead className="min-w-[100px]">Estado</TableHead>
                        <TableHead className="text-right min-w-[140px]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reservations.map((reservation) => (
                        <TableRow key={reservation.id}>
                          <TableCell className="font-medium text-sm">{reservation.client_name}</TableCell>
                          <TableCell className="text-sm">{reservation.client_phone || "-"}</TableCell>
                          <TableCell className="text-sm">
                            {format(parseISO(reservation.reservation_date + 'T00:00:00'), "d 'de' MMM, yyyy", { locale: es })}
                          </TableCell>
                          <TableCell className="text-sm">{reservation.reservation_time}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                reservation.status === "completed"
                                  ? "default"
                                  : reservation.status === "confirmed"
                                  ? "secondary"
                                  : reservation.status === "cancelled"
                                  ? "destructive"
                                  : "outline"
                              }
                              className="text-xs"
                            >
                              {reservation.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 md:gap-2 justify-end">
                              {reservation.status === "pending" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateStatus.mutate({ id: reservation.id, status: "confirmed" })}
                                  className="h-8 w-8 p-0"
                                >
                                  <CheckCircle className="h-3 w-3 md:h-4 md:w-4" />
                                </Button>
                              )}
                              {reservation.status !== "cancelled" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateStatus.mutate({ id: reservation.id, status: "cancelled" })}
                                  className="h-8 w-8 p-0"
                                >
                                  <XCircle className="h-3 w-3 md:h-4 md:w-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteReservation.mutate(reservation.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Reservations;