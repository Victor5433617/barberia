import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Edit } from "lucide-react";

const ServicesManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image_url: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
      else setUser(session.user);
    });
  }, [navigate]);

  const { data: services, isLoading } = useQuery({
    queryKey: ["admin-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const saveService = useMutation({
    mutationFn: async () => {
      const serviceData = {
        name: formData.name,
        description: formData.description || null,
        price: null,
        duration_minutes: null,
        image_url: formData.image_url || null,
      };

      if (editingService) {
        const { error } = await supabase
          .from("services")
          .update(serviceData)
          .eq("id", editingService.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("services")
          .insert(serviceData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingService ? "Elemento del catálogo actualizado" : "Elemento del catálogo creado");
      setIsDialogOpen(false);
      setEditingService(null);
      setFormData({ name: "", description: "", image_url: "" });
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
    },
    onError: (error: any) => {
      toast.error("Error al guardar elemento del catálogo", { description: error.message });
    },
  });

  const deleteService = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Elemento del catálogo eliminado");
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
    },
  });

  const handleEdit = (service: any) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || "",
      image_url: service.image_url || "",
    });
    setIsDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingService(null);
      setFormData({ name: "", description: "", image_url: "" });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor selecciona una imagen válida");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no debe superar los 5MB");
      return;
    }

    setUploadingImage(true);
    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('service-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('service-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      toast.success("Imagen subida exitosamente");
    } catch (error: any) {
      toast.error("Error al subir imagen: " + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => navigate("/admin")} size="sm" className="text-xs md:text-sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Volver al Dashboard</span>
            <span className="sm:hidden">Volver</span>
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Elemento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-card">
              <DialogHeader>
                <DialogTitle>{editingService ? "Editar Elemento" : "Nuevo Elemento"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-background"
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">Foto del elemento</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="bg-background cursor-pointer"
                  />
                  {uploadingImage && (
                    <p className="text-sm text-muted-foreground">Subiendo imagen...</p>
                  )}
                  {formData.image_url && (
                    <div className="mt-2">
                      <img 
                        src={formData.image_url} 
                        alt="Preview" 
                        className="w-full h-32 object-cover rounded border border-border"
                      />
                    </div>
                  )}
                </div>
                <Button
                  onClick={() => saveService.mutate()}
                  disabled={!formData.name || saveService.isPending}
                  className="w-full"
                >
                  {saveService.isPending ? "Guardando..." : editingService ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6 md:py-8">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl text-foreground">Gestión de Catálogo</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : !services || services.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm md:text-base">No hay elementos en el catálogo</p>
            ) : (
              <div className="overflow-x-auto -mx-4 md:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">Nombre</TableHead>
                        <TableHead className="min-w-[200px]">Descripción</TableHead>
                        <TableHead className="text-right min-w-[100px]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {services.map((service) => (
                        <TableRow key={service.id}>
                          <TableCell className="font-medium text-sm">{service.name}</TableCell>
                          <TableCell className="max-w-xs truncate text-sm">{service.description || "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 md:gap-2 justify-end">
                              <Button size="sm" variant="outline" onClick={() => handleEdit(service)} className="h-8 w-8 p-0">
                                <Edit className="h-3 w-3 md:h-4 md:w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteService.mutate(service.id)}
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

export default ServicesManagement;