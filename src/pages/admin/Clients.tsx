import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Trash2, UserPlus, Scissors, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

const clientSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido").max(100, "El nombre es muy largo"),
  id_number: z.string().trim().min(1, "La cédula/RUC es requerida").max(20, "El número es muy largo"),
  phone: z.string().trim().min(1, "El teléfono es requerido").max(20, "El teléfono es muy largo"),
});

interface ClientFormData {
  name: string;
  id_number: string;
  phone: string;
}

const Clients = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<ClientFormData>({
    name: "",
    id_number: "",
    phone: "",
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ClientFormData, string>>>({});

  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const filteredClients = clients?.filter((client) => {
    const search = searchTerm.toLowerCase();
    return (
      client.name.toLowerCase().includes(search) ||
      client.id_number.toLowerCase().includes(search) ||
      client.phone.toLowerCase().includes(search)
    );
  });

  const validateForm = (): boolean => {
    try {
      clientSchema.parse(formData);
      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Partial<Record<keyof ClientFormData, string>> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as keyof ClientFormData] = err.message;
          }
        });
        setFormErrors(errors);
      }
      return false;
    }
  };

  const createClient = useMutation({
    mutationFn: async (data: ClientFormData) => {
      const { error } = await supabase.from("clients").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cliente agregado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      if (error.code === "23505") {
        toast.error("Ya existe un cliente con esa cédula/RUC");
      } else {
        toast.error("Error al agregar cliente: " + error.message);
      }
    },
  });

  const updateClient = useMutation({
    mutationFn: async (data: ClientFormData & { id: string }) => {
      const { id, ...updateData } = data;
      const { error } = await supabase
        .from("clients")
        .update(updateData)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cliente actualizado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      if (error.code === "23505") {
        toast.error("Ya existe un cliente con esa cédula/RUC");
      } else {
        toast.error("Error al actualizar cliente: " + error.message);
      }
    },
  });

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cliente eliminado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (error: Error) => {
      toast.error("Error al eliminar cliente: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (editingClient) {
      updateClient.mutate({ ...formData, id: editingClient.id });
    } else {
      createClient.mutate(formData);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", id_number: "", phone: "" });
    setFormErrors({});
    setEditingClient(null);
  };

  const handleEdit = (client: any) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      id_number: client.id_number,
      phone: client.phone,
    });
    setIsDialogOpen(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
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
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground">Gestión de Clientes</CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Agregar Cliente
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle className="text-foreground">
                      {editingClient ? "Editar Cliente" : "Agregar Nuevo Cliente"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingClient ? "Modifica los datos del cliente" : "Ingresa los datos del nuevo cliente"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre completo *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="bg-background border-border"
                        maxLength={100}
                      />
                      {formErrors.name && (
                        <p className="text-sm text-destructive">{formErrors.name}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="id_number">Cédula / RUC *</Label>
                      <Input
                        id="id_number"
                        value={formData.id_number}
                        onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                        className="bg-background border-border"
                        maxLength={20}
                      />
                      {formErrors.id_number && (
                        <p className="text-sm text-destructive">{formErrors.id_number}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="bg-background border-border"
                        maxLength={20}
                      />
                      {formErrors.phone && (
                        <p className="text-sm text-destructive">{formErrors.phone}</p>
                      )}
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
                        disabled={createClient.isPending || updateClient.isPending}
                      >
                        {editingClient ? "Actualizar" : "Agregar"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                placeholder="Buscar por nombre, cédula o RUC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-background border-border"
              />
            </div>
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">Cargando clientes...</p>
            ) : filteredClients && filteredClients.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Cédula / RUC</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.id_number}</TableCell>
                      <TableCell>{client.phone}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(client)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm("¿Estás seguro de eliminar este cliente?")) {
                                deleteClient.mutate(client.id);
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
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {searchTerm ? "No se encontraron clientes" : "No hay clientes registrados"}
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Clients;
