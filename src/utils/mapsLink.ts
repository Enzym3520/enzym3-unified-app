/**
 * Returns a maps URL that opens in the user's preferred maps app:
 * - iOS (iPhone/iPad/Mac): Apple Maps
 * - Android: geo: intent (lets user pick Google Maps, Waze, etc.)
 * - Everything else (desktop browsers): Google Maps web
 */
export function getMapsUrl(address: string): string {
  const q = encodeURIComponent(address);
  if (typeof navigator === "undefined") {
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }

  const ua = navigator.userAgent || "";
  const platform = (navigator as any).platform || "";
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (platform === "MacIntel" && (navigator as any).maxTouchPoints > 1) ||
    /Macintosh/.test(ua); // Mac users typically have Apple Maps

  if (isIOS) return `https://maps.apple.com/?q=${q}`;

  const isAndroid = /Android/i.test(ua);
  if (isAndroid) return `geo:0,0?q=${q}`;

  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}
