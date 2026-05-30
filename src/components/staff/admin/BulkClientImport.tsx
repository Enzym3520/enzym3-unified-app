import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Upload, CheckCircle, XCircle, AlertCircle, FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatEventType } from '@/utils/notificationHelpers';
import { useIsMobile } from '@/hooks/use-mobile';

// ... keep existing code (interfaces, CSV_HEADERS, CSV_EXAMPLE, parseCSV)
interface ImportRow {
  couple_name: string;
  event_date: string;
  event_type: string;
  contact_email: string;
  venue?: string;
  coordinator_name?: string;
  package_type?: string;
  guest_count?: string;
  contact_phone?: string;
  bride_email?: string;
  groom_email?: string;
  notes?: string;
}

interface ImportResult {
  row: number;
  couple_name: string;
  success: boolean;
  wedding_id?: string;
  couple_code?: string;
  error?: string;
}

interface BulkClientImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

const CSV_HEADERS = [
  'couple_name', 'event_date', 'event_type', 'contact_email',
  'venue', 'coordinator_name', 'package_type', 'guest_count',
  'contact_phone', 'bride_email', 'groom_email', 'notes'
];

const CSV_EXAMPLE = [
  'Maria & Jose Rodriguez', '2025-09-20', 'wedding', 'maria@email.com',
  'Saguaro Buttes', 'Cece', 'Premium', '150',
  '520-555-0100', 'maria@email.com', 'jose@email.com', 'First dance: Perfect by Ed Sheeran'
];

function parseCSV(text: string): ImportRow[] {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
  const rows: ImportRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const char of lines[i]) {
      if (char === '"') { inQuotes = !inQuotes; }
      else if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
      else { current += char; }
    }
    values.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
    rows.push(row as unknown as ImportRow);
  }
  return rows;
}

export default function BulkClientImport({ open, onOpenChange, onImportComplete }: BulkClientImportProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewRows, setPreviewRows] = useState<ImportRow[]>([]);
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'results'>('upload');
  const isMobile = useIsMobile();

  const handleDownloadTemplate = () => {
    const content = [CSV_HEADERS.join(','), CSV_EXAMPLE.map(v => v.includes(',') ? `"${v}"` : v).join(',')].join('\n');
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'client_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length === 0) {
        toast({ title: 'No data found', description: 'Make sure the CSV has a header row and at least one data row.', variant: 'destructive' });
        return;
      }
      setPreviewRows(rows);
      setStep('preview');
    };
    reader.readAsText(file);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData('text');
    const rows = parseCSV(text);
    if (rows.length > 0) {
      setPreviewRows(rows);
      setStep('preview');
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('bulk-import-clients', {
        body: { rows: previewRows },
      });

      if (error) throw error;

      setResults(data.results);
      setStep('results');

      const { summary } = data;
      if (summary.success > 0) {
        toast({
          title: `Import complete`,
          description: `${summary.success} imported successfully${summary.failed > 0 ? `, ${summary.failed} failed` : ''}.`,
        });
        onImportComplete?.();
      }
    } catch (err: any) {
      toast({ title: 'Import failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setPreviewRows([]);
    setResults(null);
    setStep('upload');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const successCount = results?.filter(r => r.success).length ?? 0;
  const failCount = results?.filter(r => !r.success).length ?? 0;

  const renderPreviewContent = () => {
    if (isMobile) {
      return (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {previewRows.map((row, idx) => (
            <Card key={idx} className="p-3">
              <div className="min-w-0">
                <p className="font-medium truncate">{row.couple_name || <span className="text-destructive">Missing!</span>}</p>
                <p className="text-sm text-muted-foreground">{row.event_date || <span className="text-destructive">Missing!</span>}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">{row.event_type ? formatEventType(row.event_type) : <span className="text-destructive">Missing</span>}</Badge>
                  <span className="text-xs text-muted-foreground truncate">{row.venue || '—'}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      );
    }
    return (
      <div className="border rounded-lg overflow-auto max-h-96">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">#</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead>Coordinator</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {previewRows.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                <TableCell className="font-medium">{row.couple_name || <span className="text-destructive">Missing!</span>}</TableCell>
                <TableCell>{row.event_date || <span className="text-destructive">Missing!</span>}</TableCell>
                <TableCell>
                  <Badge variant="outline">{row.event_type ? formatEventType(row.event_type) : <span className="text-destructive">Missing</span>}</Badge>
                </TableCell>
                <TableCell className="text-sm">{row.contact_email || row.bride_email || row.groom_email || <span className="text-destructive">Missing!</span>}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{row.venue || '—'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{row.coordinator_name || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderResultsContent = () => {
    if (!results) return null;
    if (isMobile) {
      return (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {results.map((r) => (
            <Card key={r.row} className={`p-3 ${r.success ? '' : 'border-destructive/30'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{r.couple_name}</p>
                  {r.couple_code && (
                    <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{r.couple_code}</span>
                  )}
                  {r.error && <p className="text-xs text-destructive mt-0.5">{r.error}</p>}
                </div>
                {r.success
                  ? <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                  : <XCircle className="h-4 w-4 text-destructive shrink-0" />}
              </div>
            </Card>
          ))}
        </div>
      );
    }
    return (
      <div className="border rounded-lg overflow-auto max-h-80">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">#</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Couple Code</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((r) => (
              <TableRow key={r.row} className={r.success ? '' : 'bg-destructive/5'}>
                <TableCell className="text-muted-foreground text-xs">{r.row}</TableCell>
                <TableCell className="font-medium">{r.couple_name}</TableCell>
                <TableCell>
                  {r.success
                    ? <Badge className="bg-green-500/10 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Imported</Badge>
                    : <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>}
                </TableCell>
                <TableCell>
                  {r.couple_code
                    ? <span className="font-mono text-sm bg-muted px-2 py-0.5 rounded">{r.couple_code}</span>
                    : '—'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.error || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleReset(); onOpenChange(v); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Import Existing Clients
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk-import couples. Each row creates a record in the system with a couple code.
          </DialogDescription>
        </DialogHeader>

        {/* Step: Upload */}
        {step === 'upload' && (
          <div className="space-y-6">
            <div className="flex items-start gap-4 p-4 rounded-lg border bg-muted/30">
              <FileText className="h-8 w-8 text-primary mt-1 shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Step 1 — Download the template</p>
                <p className="text-sm text-muted-foreground mb-3">
                  The CSV template has all required and optional columns pre-filled with an example row.
                </p>
                <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV Template
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="font-medium">Step 2 — Upload your filled CSV</p>
              <div
                className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="font-medium">Click to upload a CSV file</p>
                <p className="text-sm text-muted-foreground">or paste your CSV data below</p>
                <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileUpload} />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">or paste CSV text</span></div>
              </div>

              <textarea
                className="w-full h-32 p-3 rounded-md border bg-background text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder={`couple_name,event_date,event_type,contact_email,...\n${CSV_EXAMPLE.join(',')}`}
                onPaste={handlePaste}
              />
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Required columns:</p>
              <div className="flex flex-wrap gap-1">
                {['couple_name', 'event_date', 'event_type', 'contact_email (or bride/groom email)'].map(c => (
                  <Badge key={c} variant="secondary" className="font-mono">{c}</Badge>
                ))}
              </div>
              <p className="font-medium text-foreground mt-2">Valid event types:</p>
              <div className="flex flex-wrap gap-1">
                {['wedding', 'quince', 'birthday', 'banquet', 'graduation', 'sweet16'].map(t => (
                  <Badge key={t} variant="outline" className="font-mono">{t}</Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step: Preview */}
        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="font-medium">{previewRows.length} records ready to import</p>
                <p className="text-sm text-muted-foreground">Review the data below before importing</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" size="sm" onClick={handleReset} className="flex-1 sm:flex-none">Start Over</Button>
                <Button size="sm" onClick={handleImport} disabled={isImporting} className="flex-1 sm:flex-none">
                  {isImporting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importing...</> : `Import ${previewRows.length} Records`}
                </Button>
              </div>
            </div>

            {isImporting && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Processing records...</p>
                <Progress value={undefined} className="h-2" />
              </div>
            )}

            {renderPreviewContent()}
          </div>
        )}

        {/* Step: Results */}
        {step === 'results' && results && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <CheckCircle className="h-8 w-8 text-primary shrink-0" />
                <div>
                  <p className="text-2xl font-bold">{successCount}</p>
                  <p className="text-sm text-muted-foreground">Imported</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <XCircle className="h-8 w-8 text-destructive shrink-0" />
                <div>
                  <p className="text-2xl font-bold text-destructive">{failCount}</p>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
              </div>
            </div>

            {renderResultsContent()}

            {successCount > 0 && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-700">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <p>All imported couples now appear in <strong>Contacts</strong> and <strong>Calendar</strong>.</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset}>Import More</Button>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
