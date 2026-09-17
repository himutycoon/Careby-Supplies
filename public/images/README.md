# Site images

Drop image files in this folder and reference them from
`data/site-images.ts` as `/images/<filename>`.

Example:
  1. Save a photo here as `hero-site.jpg`
  2. In `data/site-images.ts` set:  homeHero: "/images/hero-site.jpg"

Anything in `public/` is served from the site root, so
`public/images/hero-site.jpg` is reachable at `/images/hero-site.jpg`.

Guidance
- Format: `.jpg` for photos, `.webp` if you can export it (smaller).
- Width: 1600–2000px is plenty for full-width banners; 1200px for cards.
- Keep files under ~400KB each — these load on first paint.
- Filenames: lowercase, hyphens, no spaces.

You can also paste a full `https://` URL in `data/site-images.ts`
instead of putting a file here. Both work.
