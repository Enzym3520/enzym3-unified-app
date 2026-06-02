## Restore Vimeo Hero Background Video

Bring back the Vimeo cinematic background (ID `1166132336`) that was previously on the homepage hero, replacing the broken `<video src="/hero-video.mp4">` tag Claude swapped in.

### What changes

**File: `src/pages/HomePage.tsx`** (hero section only, ~lines 158–203)

- Replace the `<video>` element with a Vimeo `<iframe>`:
  ```
  https://player.vimeo.com/video/1166132336?background=1&autoplay=1&loop=1&muted=1&controls=0
  ```
- Keep the iframe absolutely positioned, full-bleed, behind content (`z-0`), with `pointer-events: none`.
- Scale the iframe wider/taller than the viewport and center it so Vimeo's letterboxing doesn't show bars on wide screens (standard `min-w-[177.77vh] min-h-[56.25vw]` trick).
- Keep the existing dark overlay (`bg-black/50`) for text legibility.
- Keep the gradient as a fallback layer underneath the iframe (shows while video loads or if blocked).
- Leave everything else (nav, How It Works, reviews, contact form, footer) untouched.

### What stays the same

- Logo, headline, CTAs, color palette, sections below the fold — all unchanged.
- No new dependencies, no asset uploads needed (Vimeo serves the video).

### Out of scope

- Logo styling (you clarified that wasn't the actual issue).
- Any e3ecoordination work.
