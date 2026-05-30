import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Upload, Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { useProcessBulkInvites } from '@/hooks/useBulkInvites';
import { BulkInviteRow } from '@/types/vendorInvite';
import { useIsMobile } from '@/hooks/use-mobile';

export function BulkInviteUploader() {
  const [csvData, setCsvData] = useState<BulkInviteRow[]>([]);
  const [validationResults, setValidationResults] = useState<any[]>([]);
  const [results, setResults] = useState<any>(null);
  const isMobile = useIsMobile();

  const processMutation = useProcessBulkInvites();

  const downloadTemplate = () => {
    const template = 'email,first_name,last_name,vendor_type,company_name,expires_in_days\njohn@example.com,John,Smith,dj,Smith Entertainment,30\n';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_invite_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      
      const data: BulkInviteRow[] = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        return {
          email: values[0] || '',
          firstName: values[1],
          lastName: values[2],
          vendorType: values[3] || '',
          companyName: values[4],
          expiresInDays: values[5] ? parseInt(values[5]) : 30,
        };
      });

      setCsvData(data);
      validateData(data);
    };
    reader.readAsText(file);
  };

  const validateData = (data: BulkInviteRow[]) => {
    const validTypes = ['dj', 'floral', 'catering', 'photography', 'videography', 'venue', 'transportation', 'bartending', 'other'];
    const emailSet = new Set();
    
    const results = data.map((row, index) => {
      const errors = [];
      
      if (!row.email) errors.push('Missing email');
      else if (!/\S+@\S+\.\S+/.test(row.email)) errors.push('Invalid email');
      else if (emailSet.has(row.email)) errors.push('Duplicate email');
      emailSet.add(row.email);
      
      if (!row.vendorType) errors.push('Missing vendor type');
      else if (!validTypes.includes(row.vendorType.toLowerCase())) errors.push('Invalid vendor type');
      
      return {
        row: index + 2,
        email: row.email,
        status: errors.length === 0 ? 'valid' : 'error',
        message: errors.join(', ') || 'Ready',
      };
    });
    
    setValidationResults(results);
  };

  const handleProcess = () => {
    processMutation.mutate(csvData, {
      onSuccess: (data) => setResults(data),
    });
  };

  const hasErrors = validationResults.some(r => r.status === 'error');
  const validCount = validationResults.filter(r => r.status === 'valid').length;

  if (results) {
    return (
      <div className="space-y-4">
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Processed {results.successful.length + results.failed.length + results.skipped.length} invites:
            {results.successful.length} successful, {results.failed.length} failed, {results.skipped.length} skipped
          </AlertDescription>
        </Alert>
        <Button onClick={() => { setCsvData([]); setValidationResults([]); setResults(null); }}>
          Upload Another File
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <Button variant="outline" onClick={downloadTemplate} className="w-full sm:w-auto">
          <Download className="mr-2 h-4 w-4" />
          Download CSV Template
        </Button>
        <Button variant="outline" asChild className="w-full sm:w-auto">
          <label className="cursor-pointer">
            <Upload className="mr-2 h-4 w-4" />
            Upload CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </Button>
      </div>

      {validationResults.length > 0 && (
        <>
          <Alert>
            <AlertDescription>
              {validCount} valid, {validationResults.length - validCount} errors
            </AlertDescription>
          </Alert>

          {isMobile ? (
            <div className="space-y-3">
              {validationResults.map((result) => (
                <Card key={result.row} className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-mono truncate">{result.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {csvData[result.row - 2]?.vendorType}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{result.message}</span>
                      </div>
                    </div>
                    {result.status === 'valid' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Row</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {validationResults.map((result) => (
                  <TableRow key={result.row}>
                    <TableCell>{result.row}</TableCell>
                    <TableCell className="font-mono text-xs">{result.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {csvData[result.row - 2]?.vendorType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {result.status === 'valid' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </TableCell>
                    <TableCell className="text-xs">{result.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          )}

          <Button
            onClick={handleProcess}
            disabled={hasErrors || processMutation.isPending}
            className="w-full"
          >
            {processMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Send ${validCount} Invites`
            )}
          </Button>
        </>
      )}
    </div>
  );
}
