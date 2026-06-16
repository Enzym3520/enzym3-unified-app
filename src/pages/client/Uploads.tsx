import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useClientEvent } from "@/hooks/useClientEvent";
import { logAction } from "@/lib/activityLogger";
import { toast } from "sonner";
import { Upload, FileText, Trash2, Download, Loader2, Link2, ExternalLink, Image, Cloud, Share2, Send, CheckCircle2 } from "lucide-react";

interface FileItem {
  id: string;
  wedding_id: string;
  label: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  created_at: string;
  sent_to_coordinator: boolean | null;
  sent_at: string | null;
}

interface LinkItem {
  id: string;
  wedding_id: string;
  label: string;
  url: string;
  link_type: string;
  created_at: string;
  sent_to_coordinator: boolean | null;
  sent_at: string | null;
}

const LINK_TYPES = [
  { value: 'google_drive', label: 'Google Drive', icon: Cloud },
  { value: 'dropbox', label: 'Dropbox', icon: Cloud },
  { value: 'icloud', label: 'iCloud', icon: Cloud },
  { value: 'instagram', label: 'Instagram', icon: Share2 },
  { value: 'pinterest', label: 'Pinterest', icon: Image },
  { value: 'other', label: 'Other', icon: Link2 },
];

const getLinkIcon = (linkType: string) => {
  const type = LINK_TYPES.find(t => t.value === linkType);
  return type?.icon || Link2;
};

const Uploads = () => {
  const { event: wedding, loading: eventLoading, user } = useClientEvent<any>('id, couple_name, event_type');
  const [filesLoading, setFilesLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [addingLink, setAddingLink] = useState(false);
  const [sendingNotification, setSendingNotification] = useState<string | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [label, setLabel] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Link form state
  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkType, setLinkType] = useState('other');

  const loadFilesAndLinks = useCallback(async () => {
    if (!wedding) return;
    try {
      const [filesResult, linksResult] = await Promise.all([
        supabase.from('files').select('*').eq('wedding_id', wedding.id).order('created_at', { ascending: false }),
        supabase.from('links').select('*').eq('wedding_id', wedding.id).order('created_at', { ascending: false })
      ]);
      setFiles((filesResult.data as FileItem[]) || []);
      setLinks((linksResult.data as LinkItem[]) || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setFilesLoading(false);
    }
  }, [wedding]);

  useEffect(() => {
    if (eventLoading) return;
    if (wedding) loadFilesAndLinks();
    else setFilesLoading(false);
  }, [wedding, eventLoading, loadFilesAndLinks]);

  const loading = eventLoading || filesLoading;

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || !label || !wedding) {
      toast.error('Please select a file and provide a label');
      return;
    }

    setUploading(true);
    try {
      const filePath = `${wedding.id}/${Date.now()}_${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('wedding-files')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('files')
        .insert([{
          wedding_id: wedding.id,
          label,
          file_name: selectedFile.name,
          file_path: filePath,
          file_size: selectedFile.size,
          file_type: selectedFile.type
        }]);

      if (dbError) throw dbError;

      toast.success('File uploaded successfully!');
      if (user) {
        await logAction(wedding.id, `uploaded file: ${selectedFile.name}`, user.id, user.email || "Unknown", "Uploads");
      }
      setLabel('');
      setSelectedFile(null);
      await loadFilesAndLinks();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!linkLabel || !linkUrl || !wedding) {
      toast.error('Please provide a label and URL');
      return;
    }

    // Validate URL
    try {
      new URL(linkUrl);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }

    setAddingLink(true);
    try {
      const { error } = await supabase
        .from('links')
        .insert([{
          wedding_id: wedding.id,
          label: linkLabel,
          url: linkUrl,
          link_type: linkType
        }]);

      if (error) throw error;

      toast.success('Link added successfully!');
      setLinkLabel('');
      setLinkUrl('');
      setLinkType('other');
      await loadFilesAndLinks();
    } catch (error) {
      console.error('Error adding link:', error);
      toast.error('Failed to add link');
    } finally {
      setAddingLink(false);
    }
  };

  const handleSendNotification = async (itemId: string, itemType: 'file' | 'link') => {
    setSendingNotification(itemId);
    try {
      const { error } = await supabase.functions.invoke('send-file-notification', {
        body: { item_id: itemId, item_type: itemType }
      });

      if (error) throw error;

      toast.success('Coordinator notified successfully!');
      
      // Update local state
      if (itemType === 'file') {
        setFiles(prev => prev.map(f => 
          f.id === itemId ? { ...f, sent_to_coordinator: true, sent_at: new Date().toISOString() } : f
        ));
      } else {
        setLinks(prev => prev.map(l => 
          l.id === itemId ? { ...l, sent_to_coordinator: true, sent_at: new Date().toISOString() } : l
        ));
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to notify coordinator');
    } finally {
      setSendingNotification(null);
    }
  };

  const handleDownload = async (file: FileItem) => {
    try {
      const { data, error } = await supabase.storage
        .from('wedding-files')
        .download(file.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const handleDeleteFile = async (file: FileItem) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const { error: storageError } = await supabase.storage
        .from('wedding-files')
        .remove([file.file_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', file.id);

      if (dbError) throw dbError;

      toast.success('File deleted successfully');
      await loadFilesAndLinks();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  const handleDeleteLink = async (link: LinkItem) => {
    if (!confirm('Are you sure you want to delete this link?')) return;

    try {
      const { error } = await supabase
        .from('links')
        .delete()
        .eq('id', link.id);

      if (error) throw error;

      toast.success('Link deleted successfully');
      await loadFilesAndLinks();
    } catch (error) {
      console.error('Error deleting link:', error);
      toast.error('Failed to delete link');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!wedding) {
    return <div className="text-center py-12">No event found</div>;
  }

  return (
    // Tour step: portalTourSteps.ts — "Upload Files & Links"
    <div className="container mx-auto px-4 space-y-6" data-tour="uploads-intro">
      <div>
        <h1 className="font-display text-3xl font-bold">Files & Links</h1>
        <p className="text-muted-foreground mt-1">
          Share documents, photos, and links securely with your DJ
        </p>
      </div>

      <Tabs defaultValue="files" className="w-full">
        {/* Tour step: portalTourSteps.ts — "Files & Links Tabs" */}
        <TabsList data-tour="uploads-tabs" className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="files" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Files ({files.length})
          </TabsTrigger>
          <TabsTrigger value="links" className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Links ({links.length})
          </TabsTrigger>
        </TabsList>

        {/* Files Tab */}
        <TabsContent value="files" className="space-y-6 mt-6">
          {/* Tour step: portalTourSteps.ts — "Drop or Click to Upload" */}
          <Card data-tour="file-upload">
            <CardHeader>
              <CardTitle>Upload a File</CardTitle>
              <CardDescription>
                Share important documents like floor plans, photo lists, or special song files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFileUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="label">File Label / Description</Label>
                  <Input
                    id="label"
                    placeholder="e.g., Venue Floor Plan, Must-Play Songs"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">Select File</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    required
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                <Button type="submit" disabled={uploading}>
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload File
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Uploaded Files</CardTitle>
              <CardDescription>
                {files.length} file{files.length !== 1 ? 's' : ''} uploaded
              </CardDescription>
            </CardHeader>
            <CardContent>
              {files.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <Upload className="h-12 w-12 text-muted-foreground/40 mx-auto" />
                  <h3 className="font-semibold text-foreground">No files uploaded yet</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    Share photos, playlists, Pinterest boards, or any inspiration files with your coordinator.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ideas: Inspiration photos · Song lists · Venue maps · Special request notes
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {files.map((file) => (
                    <div 
                      key={file.id} 
                      className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg gap-4"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <FileText className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{file.label}</p>
                            {file.sent_to_coordinator && (
                              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Sent
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{file.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(file.created_at).toLocaleDateString()} • 
                            {file.file_size ? ` ${(file.file_size / 1024 / 1024).toFixed(2)} MB` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {!file.sent_to_coordinator && (
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleSendNotification(file.id, 'file')}
                            disabled={sendingNotification === file.id}
                          >
                            {sendingNotification === file.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <Send className="h-4 w-4 mr-1" />
                            )}
                            Send to Coordinator
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownload(file)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteFile(file)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Links Tab */}
        <TabsContent value="links" className="space-y-6 mt-6">
          {/* Tour step: portalTourSteps.ts — "Add External Links" */}
          <Card data-tour="add-link-form">
            <CardHeader>
              <CardTitle>Add a Link</CardTitle>
              <CardDescription>
                Share links to slideshows, videos, or galleries on Google Drive, Dropbox, YouTube, or any other platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddLink} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="linkLabel">Link Label / Description</Label>
                  <Input
                    id="linkLabel"
                    placeholder="e.g., Wedding Photos Album, Engagement Pics"
                    value={linkLabel}
                    onChange={(e) => setLinkLabel(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkUrl">URL</Label>
                  <Input
                    id="linkUrl"
                    type="url"
                    placeholder="https://drive.google.com/..."
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkType">Platform (Optional)</Label>
                  <Select value={linkType} onValueChange={setLinkType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {LINK_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" disabled={addingLink}>
                  {addingLink ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Link2 className="mr-2 h-4 w-4" />
                      Add Link
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Tour step: portalTourSteps.ts — "Your Saved Links" */}
          <Card data-tour="links-list">
            <CardHeader>
              <CardTitle>Your Saved Links</CardTitle>
              <CardDescription>
                {links.length} link{links.length !== 1 ? 's' : ''} saved
              </CardDescription>
            </CardHeader>
            <CardContent>
              {links.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Link2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No links added yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {links.map((link) => {
                    const LinkIcon = getLinkIcon(link.link_type);
                    return (
                      <div 
                        key={link.id} 
                        className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg gap-4"
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <LinkIcon className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">{link.label}</p>
                              {link.sent_to_coordinator && (
                                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Sent
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{link.url}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(link.created_at).toLocaleDateString()} • {LINK_TYPES.find(t => t.value === link.link_type)?.label || 'Link'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {!link.sent_to_coordinator && (
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => handleSendNotification(link.id, 'link')}
                              disabled={sendingNotification === link.id}
                            >
                              {sendingNotification === link.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : (
                                <Send className="h-4 w-4 mr-1" />
                              )}
                              Send to Coordinator
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(link.url, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Open
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteLink(link)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-background border border-border shadow-md">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Supported file types include PDF, DOC, DOCX, images, and audio files. 
            Maximum file size is 50MB. For large photo albums, we recommend sharing a link instead.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Uploads;
