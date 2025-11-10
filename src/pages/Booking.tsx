import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MobileNav } from "@/components/MobileNav";
import heroImage from "@/assets/hero-barbershop-real.jpg";

const Booking = () => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const queryClient = useQueryClient();

  const timeSlots = [
    "09:00", "10:00", "11:00", "12:00", "13:00", 
    "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"
  ];

  const { data: reservations } = useQuery({
    queryKey: ["reservations", selectedDate],
    queryFn: async () => {
      if (!selectedDate) return [];
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .eq("reservation_date", format(selectedDate, "yyyy-MM-dd"));
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedDate,
  });

  const createReservation = useMutation({
    mutationFn: async () => {
      if (!selectedDate || !selectedTime || !clientName) {
        throw new Error("Por favor completa todos los campos");
      }

      const { error } = await supabase
        .from("reservations")
        .insert({
          client_name: clientName,
          client_phone: clientPhone,
          reservation_date: format(selectedDate, "yyyy-MM-dd"),
          reservation_time: selectedTime,
          status: "pending",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("¡Reserva confirmada!", {
        description: `Tu cita para el ${format(selectedDate!, "d 'de' MMMM", { locale: es })} a las ${selectedTime} ha sido registrada.`,
      });
      setClientName("");
      setClientPhone("");
      setSelectedTime(undefined);
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
    onError: (error: Error) => {
      toast.error("Error al crear reserva", {
        description: error.message,
      });
    },
  });

  const bookedTimes = reservations?.map((r) => r.reservation_time.substring(0, 5)) || [];

  const navLinks = [
    { href: "/", label: "Inicio" },
    { href: "/services", label: "Catálogo" },
    { href: "/booking", label: "Reservas", isActive: true },
  ];

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 bg-cover bg-center" style={{
        backgroundImage: `url(${heroImage})`
      }}>
        <div className="absolute inset-0 bg-background/95"></div>
      </div>
      
      <div className="relative">
        <MobileNav links={navLinks} />
      </div>

      <main className="container mx-auto px-4 py-8 md:py-16 relative">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 md:mb-4">
            Reserva tu Cita
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Selecciona fecha y horario disponible
          </p>
        </div>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Selecciona una Fecha</CardTitle>
              <CardDescription>Elige el día de tu cita</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date()}
                className="rounded-md border border-border"
              />
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Horarios Disponibles</CardTitle>
              <CardDescription>
                {selectedDate
                  ? `${format(selectedDate, "d 'de' MMMM", { locale: es })}`
                  : "Selecciona una fecha primero"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDate ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3">
                  {timeSlots.map((time) => {
                    const isBooked = bookedTimes.includes(time);
                    return (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        onClick={() => !isBooked && setSelectedTime(time)}
                        disabled={isBooked}
                        className="h-12 flex flex-col items-center justify-center text-sm"
                      >
                        <div className="flex items-center">
                          <Clock className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                          {time}
                        </div>
                        {isBooked && (
                          <span className="text-xs text-muted-foreground">Reservado</span>
                        )}
                      </Button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8 text-sm md:text-base">
                  Selecciona una fecha para ver los horarios
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {selectedDate && selectedTime && (
          <Card className="max-w-md mx-auto mt-8 bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Confirma tu Reserva</CardTitle>
              <CardDescription>Ingresa tus datos de contacto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input
                  id="name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Tu nombre"
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono (opcional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="Tu teléfono"
                  className="bg-background border-border"
                />
              </div>
              <Button
                onClick={() => createReservation.mutate()}
                disabled={!clientName || createReservation.isPending}
                className="w-full"
              >
                {createReservation.isPending ? "Confirmando..." : "Confirmar Reserva"}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Booking;