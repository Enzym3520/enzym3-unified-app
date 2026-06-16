import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Save, Send, ExternalLink, Globe, Loader2, Eye, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { VendorPagePreview } from './VendorPagePreview';
import { DraggableBlock } from './DraggableBlock';
import { BlockPicker } from './BlockPicker';
import { Section, sectionsFromPage, sectionsToPageFields } from './blockTypes';
import { useVendorPage, useSaveVendorPage, useSubmitForReview } from '@/hooks/use-vendor-page';

interface VendorPageBuilderProps {
  vendorProfile?: {
    first_name?: string | null;
    last_name?: string | null;
    company_name?: string | null;
    vendor_type?: string | null;
    website?: string | null;
    instagram_handle?: string | null;
  } | null;
}

function generateSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const BUCKET = 'vendor-page-assets';
const MAX_GALLERY = 12;

async function uploadFile(vendorId: string, folder: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${vendorId}/${folder}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function VendorPageBuilder({ vendorProfile }: VendorPageBuilderProps) {
  const { data: page, isLoading } = useVendorPage();
  const saveMutation = useSaveVendorPage();
  const submitMutation = useSubmitForReview();
  const [showPreview, setShowPreview] = useState(false);

  const [slug, setSlug] = useState('');
  const [headline, setHeadline] = useState('');
  const [themeColor, setThemeColor] = useState('#dc2626');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(null);
  const [showPricing, setShowPricing] = useState(false);
  const [sections, setSections] = useState<Section[]>([{ type: 'hero' }, { type: 'about', body: '' }]);

  const [uploading, setUploading] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  useEffect(() => {
    if (page) {
      setSlug(page.slug || '');
      setHeadline(page.headline || '');
      setThemeColor(page.theme_color || '#dc2626');
      setProfilePhotoUrl(page.profile_photo_url ?? null);
      setCoverPhotoUrl(page.cover_photo_url ?? null);
      setShowPricing(page.show_pricing ?? false);
      setSections(sectionsFromPage({
        bio: page.bio,
        gallery_photos: (page.gallery_photos as string[]) || [],
        highlight_services: page.highlight_services ?? false,
        highlight_reviews: page.highlight_reviews ?? false,
        custom_sections: (page.custom_sections as any[]) || [],
      }));
    }
  }, [page]);

  const handleUpload = async (type: 'profile' | 'cover' | 'gallery', files: FileList | null) => {
    if (!files?.length) return;
    setUploading(type);
    try {
      if (type === 'gallery') {
        const gallerySection = sections.find(s => s.type === 'gallery') as Extract<Section, { type: 'gallery' }> | undefined;
        const currentPhotos = gallerySection?.photos || [];
        const remaining = MAX_GALLERY - currentPhotos.length;
        const toUpload = Array.from(files).slice(0, remaining);
        const urls = await Promise.all(toUpload.map(f => uploadFile('vendor', 'gallery', f)));
        setSections(prev => prev.map(s =>
          s.type === 'gallery' ? { ...s, photos: [...(s as any).photos, ...urls] } : s
        ));
        toast.success(`${urls.length} photo(s) added`);
      } else if (type === 'profile') {
        const url = await uploadFile('vendor', 'profile', files[0]);
        setProfilePhotoUrl(url);
        toast.success('Profile photo updated');
      } else {
        const url = await uploadFile('vendor', 'cover', files[0]);
        setCoverPhotoUrl(url);
        toast.success('Cover photo updated');
      }
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const removeGalleryPhoto = (photoIdx: number) => {
    setSections(prev => prev.map(s =>
      s.type === 'gallery' ? { ...s, photos: (s as any).photos.filter((_: any, i: number) => i !== photoIdx) } : s
    ));
  };

  const handleSave = () => {
    const fields = sectionsToPageFields(sections);
    saveMutation.mutate({
      pageId: page?.id,
      form: {
        slug,
        headline,
        theme_color: themeColor,
        show_pricing: showPricing,
        ...fields,
      },
    });
  };

  const handleSubmit = () => {
    if (!slug || !headline || !page?.id) return;
    submitMutation.mutate(page.id);
  };

  // Drag and drop
  const onDragStart = (idx: number) => setDragIdx(idx);
  const onDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (idx === 0) return;
    setDragOverIdx(idx);
  };
  const onDragEnd = () => { setDragIdx(null); setDragOverIdx(null); };
  const onDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === targetIdx || targetIdx === 0) return;
    setSections(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(dragIdx, 1);
      updated.splice(targetIdx, 0, moved);
      return updated;
    });
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const updateSection = (idx: number, section: Section) => {
    setSections(prev => prev.map((s, i) => i === idx ? section : s));
  };

  const removeSection = (idx: number) => {
    setSections(prev => prev.filter((_, i) => i !== idx));
  };

  const moveSection = (idx: number, direction: -1 | 1) => {
    const target = idx + direction;
    if (target < 1 || target >= sections.length) return;
    setSections(prev => {
      const updated = [...prev];
      [updated[idx], updated[target]] = [updated[target], updated[idx]];
      return updated;
    });
  };

  const addSection = (section: Section) => {
    setSections(prev => [...prev, section]);
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  const statusBadge = () => {
    const s = page?.status || 'draft';
    switch (s) {
      case 'draft': return <Badge variant="outline">Draft</Badge>;
      case 'pending_review': return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200">Pending Review</Badge>;
      case 'approved': return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Approved — Live</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="outline">{s}</Badge>;
    }
  };

  const gallerySection = sections.find(s => s.type === 'gallery') as Extract<Section, { type: 'gallery' }> | undefined;
  const previewFormData = {
    slug,
    headline,
    bio: (sections.find(s => s.type === 'about') as any)?.body || '',
    theme_color: themeColor,
    profile_photo_url: profilePhotoUrl,
    cover_photo_url: coverPhotoUrl,
    gallery_photos: gallerySection?.photos || [],
    custom_sections: sections.filter(s => s.type === 'custom').map(s => ({ title: (s as any).title, body: (s as any).body })),
    highlight_services: sections.some(s => s.type === 'services'),
    highlight_reviews: sections.some(s => s.type === 'reviews'),
    show_pricing: showPricing,
    sections,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">My Page</h2>
          {statusBadge()}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showPreview ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="gap-1.5 text-xs"
          >
            {showPreview ? <><Pencil className="h-3.5 w-3.5" /> Edit</> : <><Eye className="h-3.5 w-3.5" /> Preview</>}
          </Button>
          {page?.status === 'approved' && page.slug && (
            <a href={`/v/${page.slug}`} target="_blank" rel="noopener noreferrer"
              className="text-xs text-primary flex items-center gap-1 hover:underline">
              <ExternalLink className="h-3 w-3" /> Live
            </a>
          )}
        </div>
      </div>

      {showPreview ? (
        <VendorPagePreview formData={previewFormData} vendorProfile={vendorProfile} />
      ) : (
        <div className="max-w-4xl space-y-2">
          {sections.map((section, idx) => (
            <DraggableBlock
              key={`${section.type}-${idx}`}
              section={section}
              index={idx}
              isDragging={dragIdx === idx}
              dragOverIndex={dragOverIdx}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragEnd={onDragEnd}
              onDrop={onDrop}
              onUpdate={updateSection}
              onRemove={removeSection}
              onMoveUp={(idx) => moveSection(idx, -1)}
              onMoveDown={(idx) => moveSection(idx, 1)}
              isFirst={idx <= 1}
              isLast={idx === sections.length - 1}
              totalCount={sections.length}
              onUploadGallery={(files) => handleUpload('gallery', files)}
              onRemoveGalleryPhoto={removeGalleryPhoto}
              uploadingGallery={uploading === 'gallery'}
              onUploadProfile={(files) => handleUpload('profile', files)}
              onUploadCover={(files) => handleUpload('cover', files)}
              uploadingProfile={uploading === 'profile'}
              uploadingCover={uploading === 'cover'}
              profilePhotoUrl={profilePhotoUrl}
              coverPhotoUrl={coverPhotoUrl}
              onSetProfilePhoto={setProfilePhotoUrl}
              onSetCoverPhoto={setCoverPhotoUrl}
              themeColor={themeColor}
              onSetThemeColor={setThemeColor}
              headline={headline}
              onSetHeadline={setHeadline}
              slug={slug}
              onSetSlug={(s) => setSlug(generateSlug(s))}
              maxGallery={MAX_GALLERY}
              galleryCount={gallerySection?.photos.length || 0}
            />
          ))}
          <BlockPicker existingSections={sections} onAdd={addSection} />
        </div>
      )}

      {!showPreview && (
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saveMutation.isPending} className="gap-1.5">
            <Save className="h-3.5 w-3.5" /> Save Draft
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={submitMutation.isPending || !slug || !headline || page?.status === 'pending_review'}
            className="gap-1.5"
          >
            <Send className="h-3.5 w-3.5" /> Submit for Review
          </Button>
        </div>
      )}
    </div>
  );
}
