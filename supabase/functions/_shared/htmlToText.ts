/**
 * Convert HTML to plain text for email multipart fallback.
 * Improves Gmail/Outlook deliverability by providing a text alternative
 * alongside HTML, which spam filters score more favorably.
 */
export function htmlToPlainText(html: string): string {
  if (!html) return '';

  let text = html;

  // Remove style/script blocks entirely
  text = text.replace(/<style[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<script[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<head[\s\S]*?<\/head>/gi, '');

  // Convert common block tags to newlines
  text = text.replace(/<\/(p|div|h[1-6]|li|tr|table|section|article)>/gi, '\n\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<hr\s*\/?>/gi, '\n----------\n');

  // Convert <a href="..."> to "text (url)"
  text = text.replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_m, href, label) => {
    const cleanLabel = label.replace(/<[^>]+>/g, '').trim();
    if (!cleanLabel) return href;
    if (cleanLabel === href) return href;
    return `${cleanLabel} (${href})`;
  });

  // Strip all remaining tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode common HTML entities
  const entities: Record<string, string> = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&mdash;': '—',
    '&ndash;': '–',
    '&hellip;': '…',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™',
  };
  text = text.replace(/&[a-z#0-9]+;/gi, (m) => entities[m.toLowerCase()] ?? m);
  text = text.replace(/&#(\d+);/g, (_m, n) => String.fromCharCode(Number(n)));

  // Collapse whitespace
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n[ \t]+/g, '\n');
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}
