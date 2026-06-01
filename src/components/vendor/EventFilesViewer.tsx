import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface EventFile {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  label: string;
  created_at: string;
}

export function EventFilesViewer({ eventId }: { eventId: string }) {
  const { data: files, isLoading } = useQuery({
    queryKey: ["event-files", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("files")
        .select("*")
        .eq("wedding_id", eventId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as EventFile[];
    },
  });

  const handleDownload = async (file: EventFile) => {
    try {
      const { data, error } = await supabase.storage.from("wedding-files").download(file.file_path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("File downloaded");
    } catch {
      toast.error("Could not download file");
    }
  };

  if (isLoading) return <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  if (!files || files.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Event Files</CardTitle>
          <CardDescription>No files have been uploaded for this event yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Files</CardTitle>
        <CardDescription>Files uploaded by the client and coordinators</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {files.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{file.file_name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">{file.label}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}</span>
                    {file.file_size && <><span>•</span><span>{(file.file_size / 1024 / 1024).toFixed(2)} MB</span></>}
                  </div>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => handleDownload(file)}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
