export type Section =
  | { type: 'hero' }
  | { type: 'about'; body: string }
  | { type: 'gallery'; photos: string[] }
  | { type: 'services' }
  | { type: 'reviews' }
  | { type: 'custom'; title: string; body: string };

/** Reconstruct ordered sections array from flat DB fields */
export function sectionsFromPage(page: {
  bio?: string | null;
  gallery_photos?: string[];
  highlight_services?: boolean;
  highlight_reviews?: boolean;
  custom_sections?: { title: string; body: string }[];
}): Section[] {
  const sections: Section[] = [{ type: 'hero' }];

  if (page.bio !== undefined) {
    sections.push({ type: 'about', body: page.bio || '' });
  } else {
    sections.push({ type: 'about', body: '' });
  }

  if (page.gallery_photos?.length) {
    sections.push({ type: 'gallery', photos: page.gallery_photos });
  }

  if (page.highlight_services) {
    sections.push({ type: 'services' });
  }

  if (page.highlight_reviews) {
    sections.push({ type: 'reviews' });
  }

  if (page.custom_sections?.length) {
    for (const cs of page.custom_sections) {
      sections.push({ type: 'custom', title: cs.title, body: cs.body });
    }
  }

  return sections;
}

/** Flatten sections array back to DB fields */
export function sectionsToPageFields(sections: Section[]) {
  let bio = '';
  let gallery_photos: string[] = [];
  let highlight_services = false;
  let highlight_reviews = false;
  const custom_sections: { title: string; body: string }[] = [];

  for (const s of sections) {
    switch (s.type) {
      case 'about':
        bio = s.body;
        break;
      case 'gallery':
        gallery_photos = s.photos;
        break;
      case 'services':
        highlight_services = true;
        break;
      case 'reviews':
        highlight_reviews = true;
        break;
      case 'custom':
        custom_sections.push({ title: s.title, body: s.body });
        break;
    }
  }

  return { bio, gallery_photos, highlight_services, highlight_reviews, custom_sections };
}
