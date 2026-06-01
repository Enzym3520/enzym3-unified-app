import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  GripVertical, ChevronDown, ChevronRight, Trash2, Camera, Image, Upload,
  Loader2, Plus, X, FileText, Star, Music, Type, ArrowUp, ArrowDown
} from 'lucide-react';
import { Section } from './blockTypes';

interface DraggableBlockProps {
  section: Section;
  index: number;
  isDragging: boolean;
  dragOverIndex: number | null;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onUpdate: (index: number, section: Section) => void;
  onRemove: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  isFirst: boolean;
  isLast: boolean;
  totalCount: number;
  onUploadGallery: (files: FileList | null) => void;
  onRemoveGalleryPhoto: (photoIdx: number) => void;
  uploadingGallery: boolean;
  onUploadProfile: (files: FileList | null) => void;
  onUploadCover: (files: FileList | null) => void;
  uploadingProfile: boolean;
  uploadingCover: boolean;
  profilePhotoUrl: string | null;
  coverPhotoUrl: string | null;
  onSetProfilePhoto: (url: string | null) => void;
  onSetCoverPhoto: (url: string | null) => void;
  themeColor: string;
  onSetThemeColor: (c: string) => void;
  headline: string;
  onSetHeadline: (h: string) => void;
  slug: string;
  onSetSlug: (s: string) => void;
  maxGallery: number;
  galleryCount: number;
}

const BLOCK_ICONS: Record<Section['type'], any> = {
  hero: Camera,
  about: FileText,
  gallery: Image,
  services: Music,
  reviews: Star,
  custom: Type,
};

const BLOCK_LABELS: Record<Section['type'], string> = {
  hero: 'Hero & Branding',
  about: 'About',
  gallery: 'Gallery',
  services: 'Services',
  reviews: 'Reviews',
  custom: 'Custom Section',
};

export function DraggableBlock({
  section, index, isDragging, dragOverIndex,
  onDragStart, onDragOver, onDragEnd, onDrop,
  onUpdate, onRemove, onMoveUp, onMoveDown, isFirst, isLast,
  onUploadGallery, onRemoveGalleryPhoto, uploadingGallery,
  onUploadProfile, onUploadCover, uploadingProfile, uploadingCover,
  profilePhotoUrl, coverPhotoUrl, onSetProfilePhoto, onSetCoverPhoto,
  themeColor, onSetThemeColor, headline, onSetHeadline,
  slug, onSetSlug, maxGallery, galleryCount,
}: DraggableBlockProps) {
  const [open, setOpen] = useState(section.type === 'hero');
  const profileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const isHero = section.type === 'hero';
  const isDraggable = !isHero;
  const isRemovable = !isHero && section.type !== 'about';
  const Icon = BLOCK_ICONS[section.type];
  const label = section.type === 'custom' && (section as any).title
    ? (section as any).title
    : BLOCK_LABELS[section.type];

  const showDropIndicator = dragOverIndex === index && !isHero;

  return (
    <div
      className="relative"
      draggable={isDraggable}
      onDragStart={isDraggable ? () => onDragStart(index) : undefined}
      onDragOver={isDraggable ? (e) => onDragOver(e, index) : undefined}
      onDragEnd={onDragEnd}
      onDrop={isDraggable ? (e) => onDrop(e, index) : undefined}
    >
      {showDropIndicator && (
        <div className="absolute -top-1 left-0 right-0 h-0.5 bg-primary rounded-full z-10" />
      )}
      <Card className={`transition-all ${isDragging ? 'opacity-50' : ''}`}>
        <Collapsible open={open} onOpenChange={setOpen}>
          <div className="flex items-center gap-1 px-3 py-2">
            {isDraggable ? (
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab hidden sm:block" />
                <div className="flex flex-col sm:hidden">
                  <Button variant="ghost" size="icon" className="h-5 w-5" disabled={isFirst}
                    onClick={(e) => { e.stopPropagation(); onMoveUp(index); }}>
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-5 w-5" disabled={isLast}
                    onClick={(e) => { e.stopPropagation(); onMoveDown(index); }}>
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="w-4" />
            )}
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 flex-1 text-left text-sm font-medium hover:text-primary transition-colors">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{label}</span>
                {open ? <ChevronDown className="h-3.5 w-3.5 ml-auto" /> : <ChevronRight className="h-3.5 w-3.5 ml-auto" />}
              </button>
            </CollapsibleTrigger>
            {isRemovable && (
              <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={() => onRemove(index)}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            )}
          </div>
          <CollapsibleContent>
            <CardContent className="pt-0 pb-3 space-y-3">
              {section.type === 'hero' && (
                <>
                  <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={e => onUploadCover(e.target.files)} />
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Cover Photo</Label>
                    {coverPhotoUrl ? (
                      <div className="relative rounded-lg overflow-hidden">
                        <img src={coverPhotoUrl} alt="Cover" className="w-full h-28 object-cover" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button size="sm" variant="secondary" onClick={() => coverRef.current?.click()} disabled={uploadingCover}>
                            <Camera className="h-3.5 w-3.5 mr-1" /> Change
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => onSetCoverPhoto(null)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => coverRef.current?.click()} disabled={uploadingCover}
                        className="w-full h-28 border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:border-primary/50 transition-colors">
                        {uploadingCover ? <Loader2 className="h-5 w-5 animate-spin" /> : <Image className="h-5 w-5" />}
                        <span className="text-xs">Upload cover photo</span>
                      </button>
                    )}
                  </div>

                  <input ref={profileRef} type="file" accept="image/*" className="hidden" onChange={e => onUploadProfile(e.target.files)} />
                  <div className="flex items-center gap-3">
                    <div className="relative group cursor-pointer" onClick={() => profileRef.current?.click()}>
                      <Avatar className="h-16 w-16">
                        {profilePhotoUrl ? <AvatarImage src={profilePhotoUrl} alt="Profile" /> : null}
                        <AvatarFallback className="text-sm">
                          {uploadingProfile ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium">Profile Photo</p>
                      {profilePhotoUrl && (
                        <Button variant="ghost" size="sm" className="text-xs h-5 px-1 mt-0.5" onClick={e => { e.stopPropagation(); onSetProfilePhoto(null); }}>
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Page URL</Label>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">/v/</span>
                      <Input value={slug} onChange={e => onSetSlug(e.target.value)} placeholder="your-name" className="h-8 text-sm" />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Headline</Label>
                    <Input value={headline} onChange={e => onSetHeadline(e.target.value)}
                      placeholder="Your go-to DJ for unforgettable events" maxLength={120} className="h-8 text-sm mt-1" />
                    <p className="text-[10px] text-muted-foreground mt-0.5">{headline.length}/120</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Label className="text-xs">Accent Color</Label>
                    <input type="color" value={themeColor} onChange={e => onSetThemeColor(e.target.value)}
                      className="h-7 w-10 rounded cursor-pointer border-0" />
                  </div>
                </>
              )}

              {section.type === 'about' && (
                <div>
                  <Textarea
                    value={section.body}
                    onChange={e => onUpdate(index, { ...section, body: e.target.value })}
                    placeholder="Tell clients about yourself..."
                    rows={4}
                    maxLength={1000}
                    className="text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5">{section.body.length}/1000</p>
                </div>
              )}

              {section.type === 'gallery' && (
                <div>
                  <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden"
                    onChange={e => onUploadGallery(e.target.files)} />
                  {galleryCount === 0 ? (
                    <button onClick={() => galleryRef.current?.click()} disabled={uploadingGallery}
                      className="w-full h-24 border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:border-primary/50 transition-colors">
                      {uploadingGallery ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                      <span className="text-xs">Upload photos to showcase your work</span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-4 gap-1.5">
                        {section.photos.map((url, idx) => (
                          <div key={idx} className="relative group aspect-square rounded-md overflow-hidden">
                            <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                            <button onClick={() => onRemoveGalleryPhoto(idx)}
                              className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      {galleryCount < maxGallery && (
                        <Button variant="outline" size="sm" onClick={() => galleryRef.current?.click()}
                          disabled={uploadingGallery} className="w-full gap-1 text-xs h-7">
                          {uploadingGallery ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />} Add Photos ({galleryCount}/{maxGallery})
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {section.type === 'services' && (
                <p className="text-xs text-muted-foreground">Your services from your profile will be displayed on your public page.</p>
              )}

              {section.type === 'reviews' && (
                <p className="text-xs text-muted-foreground">Approved client reviews will be displayed on your public page.</p>
              )}

              {section.type === 'custom' && (
                <div className="space-y-2">
                  <Input value={section.title}
                    onChange={e => onUpdate(index, { ...section, title: e.target.value })}
                    placeholder="Section Title" className="h-7 text-xs" />
                  <Textarea value={section.body}
                    onChange={e => onUpdate(index, { ...section, body: e.target.value })}
                    placeholder="Section content..." rows={3} className="text-xs" />
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}
