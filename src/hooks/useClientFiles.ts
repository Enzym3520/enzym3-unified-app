import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientFile {
  id: string;
  wedding_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  label: string;
  created_at: string;
  sent_to_coordinator: boolean | null;
  sent_at: string | null;
}

export const useClientFiles = (weddingId?: string) => {
  return useQuery({
    queryKey: ['client-files', weddingId],
    queryFn: async () => {
      if (!weddingId) return [];
      
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('wedding_id', weddingId)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      return data as ClientFile[];
    },
    enabled: !!weddingId,
  });
};

export const downloadClientFile = async (filePath: string, fileName: string) => {
  const { data, error } = await supabase.storage
    .from('wedding-files')
    .download(filePath);

  if (error) throw error;

  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
