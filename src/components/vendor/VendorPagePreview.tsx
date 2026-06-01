import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Globe, Eye } from 'lucide-react';
import { formatVendorType } from '@/utils/vendorHelpers';
import { Section } from './blockTypes';

export interface VendorPagePreviewData {
  slug: string;
  headline: string;
  bio: string;
  theme_color: string;
  profile_photo_url: string | null;
  cover_photo_url: string | null;
  gallery_photos: string[];
  custom_sections: { title: string; body: string }[];
  highlight_services: boolean;
  highlight_reviews: boolean;
  show_pricing: boolean;
  sections?: Section[];
}

interface VendorPagePreviewProps {
  formData: VendorPagePreviewData;
  vendorProfile?: {
    first_name?: string | null;
    last_name?: string | null;
    company_name?: string | null;
    vendor_type?: string | null;
    website?: string | null;
    instagram_handle?: string | null;
  } | null;
}

export function VendorPagePreview({ formData, vendorProfile }: VendorPagePreviewProps) {
  const vendorName = vendorProfile?.company_name ||
    `${vendorProfile?.first_name || ''} ${vendorProfile?.last_name || ''}`.trim() ||
    'Your Name';
  const themeColor = formData.theme_color || '#dc2626';
  const initials = vendorName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const orderedSections = formData.sections?.filter(s => s.type !== 'hero') || [];
  const useOrdered = orderedSections.length > 0;

  const renderSection = (section: Section, idx: number) => {
    switch (section.type) {
      case 'about':
        return section.body ? (
          <section key={`about-${idx}`}>
            <h2 className="text-lg font-semibold text-foreground mb-2">About</h2>
            <p className="text-muted-foreground whitespace-pre-line leading-relaxed text-sm">{section.body}</p>
          </section>
        ) : null;
      case 'gallery':
        return section.photos.length > 0 ? (
          <section key={`gallery-${idx}`}>
            <h2 className="text-lg font-semibold text-foreground mb-3">Portfolio</h2>
            <div className="columns-2 md:columns-3 gap-2 space-y-2">
              {section.photos.map((url, i) => (
                <div key={i} className="block w-full rounded-lg overflow-hidden break-inside-avoid">
                  <img src={url} alt={`Work ${i + 1}`} className="w-full" loading="lazy" />
                </div>
              ))}
            </div>
          </section>
        ) : null;
      case 'services':
        return (
          <section key={`services-${idx}`}>
            <h2 className="text-lg font-semibold text-foreground mb-2">Services & Packages</h2>
            <p className="text-muted-foreground text-sm italic">Your packages and add-ons will be displayed here from your profile settings.</p>
          </section>
        );
      case 'reviews':
        return (
          <section key={`reviews-${idx}`}>
            <h2 className="text-lg font-semibold text-foreground mb-2">Reviews</h2>
            <p className="text-muted-foreground text-sm italic">Client reviews will appear here.</p>
          </section>
        );
      case 'custom':
        return (section.title || section.body) ? (
          <section key={`custom-${idx}`}>
            <h2 className="text-lg font-semibold text-foreground mb-2">{section.title || 'Untitled Section'}</h2>
            <p className="text-muted-foreground whitespace-pre-line leading-relaxed text-sm">{section.body}</p>
          </section>
        ) : null;
      default:
        return null;
    }
  };

  const renderFlatSections = () => (
    <>
      {formData.bio && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">About</h2>
          <p className="text-muted-foreground whitespace-pre-line leading-relaxed text-sm">{formData.bio}</p>
        </section>
      )}
      {formData.gallery_photos.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Portfolio</h2>
          <div className="columns-2 md:columns-3 gap-2 space-y-2">
            {formData.gallery_photos.map((url, idx) => (
              <div key={idx} className="block w-full rounded-lg overflow-hidden break-inside-avoid">
                <img src={url} alt={`Work ${idx + 1}`} className="w-full" loading="lazy" />
              </div>
            ))}
          </div>
        </section>
      )}
      {formData.custom_sections.filter(s => s.title || s.body).map((sec, idx) => (
        <section key={idx}>
          <h2 className="text-lg font-semibold text-foreground mb-2">{sec.title || 'Untitled Section'}</h2>
          <p className="text-muted-foreground whitespace-pre-line leading-relaxed text-sm">{sec.body}</p>
        </section>
      ))}
    </>
  );

  const hasContent = useOrdered
    ? orderedSections.some(s => {
        if (s.type === 'about') return !!(s as any).body;
        if (s.type === 'gallery') return (s as any).photos?.length > 0;
        if (s.type === 'custom') return (s as any).title || (s as any).body;
        if (s.type === 'services' || s.type === 'reviews') return true;
        return false;
      })
    : formData.bio || formData.gallery_photos.length > 0 || formData.custom_sections.length > 0 || formData.headline;

  return (
    <div className="rounded-xl border-2 border-dashed border-primary/30 overflow-hidden bg-background">
      <div className="bg-primary/10 px-4 py-2 flex items-center gap-2 border-b border-primary/20">
        <Eye className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-primary">Live Preview</span>
        <span className="text-xs text-muted-foreground ml-auto">This is how your page will look to visitors</span>
      </div>

      <div className="relative">
        {formData.cover_photo_url ? (
          <div className="h-40 md:h-52 w-full overflow-hidden">
            <img src={formData.cover_photo_url} alt="Cover" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent 40%, ${themeColor}cc 100%)` }} />
          </div>
        ) : (
          <div className="h-40 md:h-52 w-full" style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}99)` }} />
        )}

        <div className="max-w-2xl mx-auto px-4 relative">
          <div className="flex flex-col items-center -mt-12 md:-mt-16 relative z-10">
            <Avatar className="h-24 w-24 md:h-28 md:w-28 border-4 border-background shadow-lg">
              {formData.profile_photo_url ? (
                <AvatarImage src={formData.profile_photo_url} alt={vendorName} />
              ) : null}
              <AvatarFallback className="text-xl md:text-2xl font-bold" style={{ backgroundColor: themeColor, color: 'white' }}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <h1 className="text-xl md:text-2xl font-bold text-foreground mt-3 text-center">{vendorName}</h1>
            {vendorProfile?.vendor_type && (
              <Badge className="mt-1.5" style={{ backgroundColor: `${themeColor}18`, color: themeColor, borderColor: `${themeColor}30` }}>
                {formatVendorType(vendorProfile.vendor_type)}
              </Badge>
            )}
            {formData.headline && (
              <p className="text-muted-foreground mt-2 text-center max-w-md text-base">{formData.headline}</p>
            )}
            <div className="flex gap-2 mt-3">
              {vendorProfile?.website && (
                <Button variant="outline" size="sm" className="pointer-events-none opacity-80">
                  <Globe className="h-3.5 w-3.5 mr-1" /> Website
                </Button>
              )}
              {vendorProfile?.instagram_handle && (
                <Button variant="outline" size="sm" className="pointer-events-none opacity-80">
                  <span className="mr-1 text-xs">IG</span> Instagram
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {useOrdered ? orderedSections.map(renderSection) : renderFlatSections()}

        {!hasContent && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Start filling in your page details to see a preview here</p>
          </div>
        )}

        <div className="text-center pt-6 pb-2 border-t border-border">
          <p className="text-xs text-muted-foreground">Powered by <span className="font-semibold">Enzym3 Entertainment</span></p>
        </div>
      </div>
    </div>
  );
}
