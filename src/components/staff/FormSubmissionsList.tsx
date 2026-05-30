import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useFormSubmissions } from '@/hooks/useFormSubmissions';
import { FormSubmission } from '@/types/contact';
import { Search, FileText, Mail, Calendar, User, Plus, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { createPrePopulationUrls } from '@/utils/prePopulationHelpers';

export const FormSubmissionsList: React.FC = () => {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { getSubmissions } = useFormSubmissions();
  const { toast } = useToast();

  const handleCreatePrePopulatedForm = (submission: FormSubmission) => {
    const url = createPrePopulationUrls.fromFormSubmission(submission.id);
    window.open(url, '_blank');
  };

  const handleCopyPrePopulatedLink = async (submission: FormSubmission) => {
    try {
      const url = createPrePopulationUrls.fromFormSubmission(submission.id);
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link Copied",
        description: "Pre-populated form link copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const data = await getSubmissions();
      setSubmissions(data);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch =
      (submission.wedding_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (submission.contact_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (submission.contact_email || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !statusFilter || submission.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary';
      case 'processed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'email':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'draft':
        return 'bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4 mb-6">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-40" />
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-3 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by Wedding ID, contact name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="status-filter">Status</Label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex h-10 w-40 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="processed">Processed</option>
            <option value="emailed">Emailed</option>
          </select>
        </div>
      </div>

      {filteredSubmissions.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {searchTerm || statusFilter ? 'No submissions match your filters' : 'No form submissions yet'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredSubmissions.map((submission) => (
            <Card key={submission.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">
                    {submission.wedding_id}
                  </CardTitle>
                  <Badge className={getStatusColor(submission.status)}>
                    {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{submission.contact_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{submission.contact_email}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Submitted: {format(new Date(submission.created_at), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    {submission.email_sent_at && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600">
                          Email sent: {format(new Date(submission.email_sent_at), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Form Data Preview */}
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Form Data:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    {Object.entries(submission.form_data)
                      .filter(([_, value]) => value && typeof value === 'string')
                      .slice(0, 4)
                      .map(([key, value]) => (
                        <div key={key}>
                          <span className="text-muted-foreground">
                            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                          </span>{' '}
                          <span>{String(value)}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Pre-population Actions */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCreatePrePopulatedForm(submission)}
                    className="text-xs text-primary hover:text-primary border-primary/30 hover:border-primary/50"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    New Form
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyPrePopulatedLink(submission)}
                    className="text-xs text-primary hover:text-primary border-primary/30 hover:border-primary/50"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
