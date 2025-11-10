-- Add client_id column to work_registry and make it reference clients table
ALTER TABLE public.work_registry 
ADD COLUMN client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_work_registry_client_id ON public.work_registry(client_id);
CREATE INDEX idx_work_registry_service_date ON public.work_registry(service_date);