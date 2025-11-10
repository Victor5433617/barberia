import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Scissors, LogOut, DollarSign, Calendar as CalendarIcon, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const workSchema = z.object({
  service_date: z.string().min(1, "La fecha es requerida"),
  client_id: z.string().nullable(),
  client_name: z.string().trim().max(100, "El nombre es muy largo").nullable(),
  service_description: z.string().trim().min(1, "La descripción es requerida").max(500, "La descripción es muy larga"),
  amount_charged: z.string().min(1, "El monto es requerido"),
  notes: z.string().trim().max(500, "Las notas son muy largas").nullable(),
});

interface WorkFormData {
  service_date: string;
  client_id: string | null;
  client_name: string | null;
  service_description: string;
  amount_charged: string;
  notes: string | null;
}

const WorkRegistry = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<any>(null);
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "month" | "custom">("all");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [formData, setFormData] = useState<WorkFormData>({
    service_date: format(new Date(), "yyyy-MM-dd"),
    client_id: null,
    client_name: null,
    service_description: "",
    amount_charged: "",
    notes: null,
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof WorkFormData, string>>>({});

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: works, isLoading } = useQuery({
    queryKey: ["work_registry", dateFilter, dateRange],
    queryFn: async () => {
      let query = supabase
        .from("work_registry")
        .select("*, clients(name, id_number)")
        .order("service_date", { ascending: false });

      if (dateFilter === "today") {
        const today = format(new Date(), "yyyy-MM-dd");
        query = query.eq("service_date", today);
      } else if (dateFilter === "month") {
        const start = format(startOfMonth(new Date()), "yyyy-MM-dd");
        const end = format(endOfMonth(new Date()), "yyyy-MM-dd");
        query = query.gte("service_date", start).lte("service_date", end);
      } else if (dateFilter === "custom" && dateRange.from) {
        const start = format(dateRange.from, "yyyy-MM-dd");
        const end = dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : start;
        query = query.gte("service_date", start).lte("service_date", end);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const stats = {
    total: works?.reduce((sum, work) => sum + Number(work.amount_charged || 0), 0) || 0,
    count: works?.length || 0,
    average: works?.length ? (works.reduce((sum, work) => sum + Number(work.amount_charged || 0), 0) / works.length) : 0,
  };

  const validateForm = (): boolean => {
    try {
      workSchema.parse(formData);
      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Partial<Record<keyof WorkFormData, string>> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as keyof WorkFormData] = err.message;
          }
        });
        setFormErrors(errors);
      }
      return false;
    }
  };

  const createWork = useMutation({
    mutationFn: async (data: WorkFormData) => {
      const { error } = await supabase.from("work_registry").insert([{
        service_date: data.service_date,
        client_id: data.client_id || null,
        client_name: data.client_name || null,
        service_description: data.service_description,
        amount_charged: parseFloat(data.amount_charged),
        notes: data.notes || null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Trabajo registrado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["work_registry"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error("Error al registrar trabajo: " + error.message);
    },
  });

  const updateWork = useMutation({
    mutationFn: async (data: WorkFormData & { id: string }) => {
      const { id, ...updateData } = data;
      const { error } = await supabase
        .from("work_registry")
        .update({
          service_date: updateData.service_date,
          client_id: updateData.client_id || null,
          client_name: updateData.client_name || null,
          service_description: updateData.service_description,
          amount_charged: parseFloat(updateData.amount_charged),
          notes: updateData.notes || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Trabajo actualizado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["work_registry"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error("Error al actualizar trabajo: " + error.message);
    },
  });

  const deleteWork = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("work_registry").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Trabajo eliminado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["work_registry"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (error: Error) => {
      toast.error("Error al eliminar trabajo: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (editingWork) {
      updateWork.mutate({ ...formData, id: editingWork.id });
    } else {
      createWork.mutate(formData);
    }
  };

  const resetForm = () => {
    setFormData({
      service_date: format(new Date(), "yyyy-MM-dd"),
      client_id: null,
      client_name: null,
      service_description: "",
      amount_charged: "",
      notes: null,
    });
    setFormErrors({});
    setEditingWork(null);
  };

  const handleEdit = (work: any) => {
    setEditingWork(work);
    setFormData({
      service_date: work.service_date,
      client_id: work.client_id,
      client_name: work.client_name,
      service_description: work.service_description,
      amount_charged: work.amount_charged.toString(),
      notes: work.notes,
    });
    setIsDialogOpen(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleDownloadPDF = () => {
    if (!works || works.length === 0) {
      toast.error("No hay datos para descargar");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Encabezado con diseño elegante
    doc.setFillColor(25, 25, 35);
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    // Título principal
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text("302 BARBER", pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text("Registro de Trabajos", pageWidth / 2, 30, { align: 'center' });
    
    // Fecha del reporte
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 200);
    doc.text(`Generado: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}`, pageWidth / 2, 38, { align: 'center' });
    
    // Línea decorativa
    doc.setDrawColor(132, 189, 0);
    doc.setLineWidth(1);
    doc.line(14, 48, pageWidth - 14, 48);
    
    // Sección de filtro aplicado
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    let filterText = "Período: ";
    doc.setFont('helvetica', 'normal');
    if (dateFilter === "today") filterText += "Hoy";
    else if (dateFilter === "month") filterText += "Este mes";
    else if (dateFilter === "custom" && dateRange.from) {
      filterText += `${format(dateRange.from, "dd/MM/yyyy")} - ${dateRange.to ? format(dateRange.to, "dd/MM/yyyy") : format(dateRange.from, "dd/MM/yyyy")}`;
    } else filterText += "Todos los registros";
    doc.text(filterText, 14, 58);
    
    // Tarjetas de estadísticas con diseño moderno
    const cardY = 68;
    const cardWidth = (pageWidth - 42) / 3;
    const cardHeight = 24;
    
    // Card 1 - Total trabajos
    doc.setFillColor(240, 240, 245);
    doc.roundedRect(14, cardY, cardWidth, cardHeight, 3, 3, 'F');
    doc.setTextColor(100, 100, 120);
    doc.setFontSize(8);
    doc.text("TRABAJOS REALIZADOS", 14 + cardWidth / 2, cardY + 8, { align: 'center' });
    doc.setTextColor(25, 25, 35);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(stats.count.toString(), 14 + cardWidth / 2, cardY + 18, { align: 'center' });
    
    // Card 2 - Total ganancias
    doc.setFillColor(132, 189, 0);
    doc.roundedRect(14 + cardWidth + 7, cardY, cardWidth, cardHeight, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text("TOTAL GANANCIAS", 14 + cardWidth * 1.5 + 7, cardY + 8, { align: 'center' });
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`₲${stats.total.toLocaleString('es-PY')}`, 14 + cardWidth * 1.5 + 7, cardY + 18, { align: 'center' });
    
    // Card 3 - Promedio
    doc.setFillColor(240, 240, 245);
    doc.roundedRect(14 + cardWidth * 2 + 14, cardY, cardWidth, cardHeight, 3, 3, 'F');
    doc.setTextColor(100, 100, 120);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text("PROMEDIO", 14 + cardWidth * 2.5 + 14, cardY + 8, { align: 'center' });
    doc.setTextColor(25, 25, 35);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`₲${stats.average.toLocaleString('es-PY', { maximumFractionDigits: 0 })}`, 14 + cardWidth * 2.5 + 14, cardY + 18, { align: 'center' });
    
    // Título de la tabla
    doc.setTextColor(25, 25, 35);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("Detalle de Trabajos", 14, 105);
    
    // Tabla con diseño mejorado
    const tableData = works.map(work => [
      format(new Date(work.service_date), "dd/MM/yyyy", { locale: es }),
      work.clients ? `${work.clients.name}\n${work.clients.id_number}` : work.client_name || "Sin cliente",
      work.service_description,
      `₲${Number(work.amount_charged).toLocaleString('es-PY')}`
    ]);
    
    autoTable(doc, {
      head: [['Fecha', 'Cliente', 'Servicio', 'Monto']],
      body: tableData,
      startY: 110,
      theme: 'striped',
      styles: { 
        fontSize: 9,
        cellPadding: 5,
        lineColor: [220, 220, 220],
        lineWidth: 0.1,
        textColor: [40, 40, 40],
        font: 'helvetica'
      },
      headStyles: { 
        fillColor: [25, 25, 35],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'left',
        cellPadding: 6
      },
      alternateRowStyles: {
        fillColor: [248, 248, 250]
      },
      columnStyles: {
        0: { cellWidth: 28, halign: 'left' },
        1: { cellWidth: 50, halign: 'left' },
        2: { cellWidth: 72, halign: 'left' },
        3: { cellWidth: 36, halign: 'right', fontStyle: 'bold', textColor: [132, 189, 0] }
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        // Pie de página en cada página
        const pageNumber = doc.internal.pages.length - 1;
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Página ${pageNumber}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
        doc.text(
          '302 Barber - Sistema de Gestión',
          14,
          pageHeight - 10
        );
      }
    });
    
    // Guardar
    const fileName = `302-barber-registro-${format(new Date(), "yyyy-MM-dd-HHmm")}.pdf`;
    doc.save(fileName);
    toast.success("PDF descargado exitosamente");
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scissors className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">302 Barber Admin</span>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate("/admin")}>
              Dashboard
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Ganancias
              </CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">₲{stats.total.toLocaleString('es-PY')}</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Trabajos Realizados
              </CardTitle>
              <CalendarIcon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.count}</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Promedio por Trabajo
              </CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">₲{stats.average.toLocaleString('es-PY', { maximumFractionDigits: 0 })}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle className="text-foreground">Registro de Trabajos</CardTitle>
              <div className="flex gap-2 flex-wrap">
                <Select value={dateFilter} onValueChange={(value: any) => {
                  setDateFilter(value);
                  if (value !== "custom") {
                    setDateRange({ from: undefined, to: undefined });
                  }
                }}>
                  <SelectTrigger className="w-[180px] bg-background border-border">
                    <SelectValue placeholder="Filtrar por fecha" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="today">Hoy</SelectItem>
                    <SelectItem value="month">Este mes</SelectItem>
                    <SelectItem value="custom">Rango personalizado</SelectItem>
                  </SelectContent>
                </Select>
                
                {dateFilter === "custom" && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                            </>
                          ) : (
                            format(dateRange.from, "dd/MM/yyyy")
                          )
                        ) : (
                          <span>Selecciona un rango</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange.from}
                        selected={{ from: dateRange.from, to: dateRange.to }}
                        onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                        numberOfMonths={2}
                        locale={es}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                )}
                
                <Button variant="outline" onClick={handleDownloadPDF} disabled={!works || works.length === 0}>
                  <Download className="mr-2 h-4 w-4" />
                  Descargar PDF
                </Button>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                  setIsDialogOpen(open);
                  if (!open) resetForm();
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Registrar Trabajo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-foreground">
                        {editingWork ? "Editar Trabajo" : "Registrar Nuevo Trabajo"}
                      </DialogTitle>
                      <DialogDescription>
                        {editingWork ? "Modifica los datos del trabajo" : "Ingresa los datos del trabajo realizado"}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="service_date">Fecha del servicio *</Label>
                        <Input
                          id="service_date"
                          type="date"
                          value={formData.service_date}
                          onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
                          className="bg-background border-border"
                        />
                        {formErrors.service_date && (
                          <p className="text-sm text-destructive">{formErrors.service_date}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="client_id">Cliente (opcional)</Label>
                        <Select 
                          value={formData.client_id || "none"} 
                          onValueChange={(value) => {
                            if (value === "none") {
                              setFormData({ ...formData, client_id: null, client_name: null });
                            } else {
                              setFormData({ ...formData, client_id: value, client_name: null });
                            }
                          }}
                        >
                          <SelectTrigger className="bg-background border-border">
                            <SelectValue placeholder="Selecciona un cliente" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sin cliente registrado</SelectItem>
                            {clients?.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name} - {client.id_number}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {!formData.client_id && (
                        <div className="space-y-2">
                          <Label htmlFor="client_name">Nombre del cliente (si no está registrado)</Label>
                          <Input
                            id="client_name"
                            value={formData.client_name || ""}
                            onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                            className="bg-background border-border"
                            maxLength={100}
                            placeholder="Nombre del cliente"
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="service_description">Descripción del servicio *</Label>
                        <Textarea
                          id="service_description"
                          value={formData.service_description}
                          onChange={(e) => setFormData({ ...formData, service_description: e.target.value })}
                          className="bg-background border-border"
                          maxLength={500}
                          rows={3}
                          placeholder="Ej: Corte de cabello y barba"
                        />
                        {formErrors.service_description && (
                          <p className="text-sm text-destructive">{formErrors.service_description}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="amount_charged">Monto cobrado (₲) *</Label>
                        <Input
                          id="amount_charged"
                          type="number"
                          step="1"
                          min="0"
                          value={formData.amount_charged}
                          onChange={(e) => setFormData({ ...formData, amount_charged: e.target.value })}
                          className="bg-background border-border"
                          placeholder="0"
                        />
                        {formErrors.amount_charged && (
                          <p className="text-sm text-destructive">{formErrors.amount_charged}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Notas adicionales</Label>
                        <Textarea
                          id="notes"
                          value={formData.notes || ""}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          className="bg-background border-border"
                          maxLength={500}
                          rows={2}
                          placeholder="Observaciones opcionales"
                        />
                      </div>

                      <div className="flex gap-2 justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsDialogOpen(false);
                            resetForm();
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          disabled={createWork.isPending || updateWork.isPending}
                        >
                          {editingWork ? "Actualizar" : "Registrar"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">Cargando trabajos...</p>
            ) : works && works.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Servicio</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {works.map((work) => (
                      <TableRow key={work.id}>
                        <TableCell className="font-medium">
                          {format(new Date(work.service_date), "dd/MM/yyyy", { locale: es })}
                        </TableCell>
                        <TableCell>
                          {work.clients ? (
                            <div>
                              <div>{work.clients.name}</div>
                              <div className="text-xs text-muted-foreground">{work.clients.id_number}</div>
                            </div>
                          ) : (
                            work.client_name || <span className="text-muted-foreground">Sin cliente</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate" title={work.service_description}>
                            {work.service_description}
                          </div>
                          {work.notes && (
                            <div className="text-xs text-muted-foreground mt-1" title={work.notes}>
                              {work.notes}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold text-primary">
                          ₲{Number(work.amount_charged).toLocaleString('es-PY')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(work)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                if (confirm("¿Estás seguro de eliminar este registro?")) {
                                  deleteWork.mutate(work.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No hay trabajos registrados
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default WorkRegistry;
