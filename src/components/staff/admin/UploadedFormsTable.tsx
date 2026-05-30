import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Download, Trash2, Search, FileText, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { parseLocalDate } from '@/utils/dateHelpers';
import { capitalizeNames } from '@/utils/contactHelpers';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface UploadedForm {
  id: string;
  wedding_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  uploaded_by: string;
  notes: string | null;
  uploaded_at: string;
  couple_name?: string;
  event_date?: string;
}

export const UploadedFormsTable = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const { data: uploadedForms = [], isLoading } = useQuery({
    queryKey: ['uploaded-details-forms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('uploaded_details_forms')
        .select(`*, event_notification_history!wedding_id (couple_name, event_date)`)
        .order('uploaded_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []).map((form: any) => ({
        ...form,
        couple_name: form.event_notification_history?.couple_name,
        event_date: form.event_notification_history?.event_date,
      })) as UploadedForm[];
    },
  });

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage.from('wedding-uploads').download(filePath);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url; a.download = fileName;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: 'Download Started', description: `Downloading ${fileName}` });
    } catch {
      toast({ title: 'Download Failed', description: 'Failed to download file', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string, filePath: string) => {
    try {
      const { error: storageError } = await supabase.storage.from('wedding-uploads').remove([filePath]);
      if (storageError) throw storageError;
      const { error: dbError } = await supabase.from('uploaded_details_forms').delete().eq('id', id);
      if (dbError) throw dbError;
      toast({ title: 'Form Deleted', description: 'Details form has been deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['uploaded-details-forms'] });
    } catch {
      toast({ title: 'Delete Failed', description: 'Failed to delete form', variant: 'destructive' });
    }
  };

  const filteredForms = useMemo(() =>
    uploadedForms.filter((form) =>
      (form.couple_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (form.file_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (form.uploaded_by || '').toLowerCase().includes(searchTerm.toLowerCase())
    ), [uploadedForms, searchTerm]);

  const totalPages = Math.ceil(filteredForms.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginated = filteredForms.slice(startIndex, startIndex + pageSize);

  if (isLoading) {
    return <div className="text-center py-8">Loading uploaded forms...</div>;
  }

  const ActionButtons = ({ form }: { form: UploadedForm }) => (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDownload(form.file_path, form.file_name); }}>
        <Download className="h-4 w-4" />
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Upload?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{form.file_name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDelete(form.id, form.file_path)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Search + Page Size */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-auto sm:flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by client name, file name, or uploader..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show</span>
          <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(parseInt(v)); setCurrentPage(1); }}>
            <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">entries</span>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredForms.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + pageSize, filteredForms.length)} of {filteredForms.length} forms
      </div>

      {filteredForms.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No uploaded forms found</p>
        </div>
      ) : isMobile ? (
        /* Mobile Card View */
        <div className="space-y-2">
          {paginated.map((form) => (
            <Card key={form.id}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2 min-w-0">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{capitalizeNames(form.couple_name || '') || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground truncate">{form.file_name}</p>
                  </div>
                  <ActionButtons form={form} />
                </div>
                <div className="flex items-center justify-between mt-2 flex-wrap gap-1">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {form.event_date ? format(parseLocalDate(form.event_date), 'MMM dd, yyyy') : 'N/A'}
                  </span>
                  <Badge variant="outline" className="text-xs">{form.uploaded_by}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Uploaded {format(new Date(form.uploaded_at), 'MMM dd, yyyy h:mm a')}
                </p>
                {form.notes && <p className="text-xs text-muted-foreground mt-1 truncate">Note: {form.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Desktop Table */
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Event Date</TableHead>
                    <TableHead>File Name</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((form) => (
                    <TableRow key={form.id}>
                      <TableCell className="font-medium">{capitalizeNames(form.couple_name || '') || 'Unknown'}</TableCell>
                      <TableCell>{form.event_date ? format(parseLocalDate(form.event_date), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                      <TableCell className="max-w-xs truncate">{form.file_name}</TableCell>
                      <TableCell>{form.uploaded_by}</TableCell>
                      <TableCell>{format(new Date(form.uploaded_at), 'MMM dd, yyyy h:mm a')}</TableCell>
                      <TableCell className="max-w-xs truncate">{form.notes || '-'}</TableCell>
                      <TableCell className="text-right"><ActionButtons form={form} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (pageNum > totalPages) return null;
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink onClick={() => setCurrentPage(pageNum)} isActive={currentPage === pageNum} className="cursor-pointer">
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};
