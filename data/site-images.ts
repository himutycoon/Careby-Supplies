/**
 * Site imagery — the one file to edit when swapping photos.
 *
 * Each entry is a named slot used by a specific part of the site. A
 * value can be either:
 *
 *   - a file you dropped in `public/images/`, referenced from the site
 *     root:            "/images/hero-site.jpg"
 *   - a full URL:      "https://…/photo.jpg"
 *   - an empty string, which keeps the existing designed fallback
 *
 * Leaving a slot empty is a valid choice, not a broken state: the
 * components fall back to the blueprint/tone treatment rather than
 * showing a gap. Add photos as you get them, one line at a time.
 *
 * If you later want non-developers changing these, the same shape can be
 * backed by a table + the existing admin image uploader — the call sites
 * read through `siteImage()` precisely so that swap stays local.
 */
export interface SiteImage {
  /** File path under /images, or a full https URL. Empty = use fallback. */
  src: string;
  /**
   * Describe the photo for screen readers and when an image fails to
   * load. Not decorative — say what is actually in the picture.
   */
  alt: string;
}

export const SITE_IMAGES = {
  /** Home hero, the large panel on the right. */
  homeHero: {
    src: "/images/home-hero-framing.webp",
    alt: "A two-storey house at framing stage, with lumber stacked on site",
  },

  /** Products page hero background, behind the headline. */
  productsHero: {
    src: "/images/products-hero-warehouse.webp",
    // Decorative: it sits behind the headline under a navy scrim, and
    // the heading already says what the page is.
    alt: "",
  },

  /**
   * Premium package section — fallback only.
   *
   * SITE_SLIDESHOWS.premium has three slides, so this is never shown in
   * practice. It stays as the single-image fallback if those are ever
   * cleared.
   */
  premium: {
    src: "/images/premium-3-finished.webp",
    alt: "A finished walnut and quartz kitchen with plans on the island",
  },

  /** Services page hero background. */
  servicesHero: {
    src: "/images/services-hero-framing.webp",
    // Decorative: sits behind the headline under a navy scrim.
    alt: "",
  },

  /** Project type cards on the home page. */
  categoryRepair: {
    src: "/images/category-repair-plumbing.webp",
    alt: "A plumber tightening a sink trap with a pipe wrench",
  },
  categoryRenovation: {
    src: "/images/category-renovation-kitchen.webp",
    alt: "A newly renovated kitchen with a navy island and quartz counter",
  },
  categoryNewConstruction: {
    src: "/images/category-new-construction-framing.webp",
    alt: "A two-storey house at framing stage with roof trusses set",
  },
} satisfies Record<string, SiteImage>;

export type SiteImageSlot = keyof typeof SITE_IMAGES;

/**
 * Reads a slot, returning undefined when it is unset so callers can use
 * `src={siteImage("homeHero")}` and get the designed fallback for free.
 */
export function siteImage(slot: SiteImageSlot): string | undefined {
  const value = SITE_IMAGES[slot].src.trim();
  return value.length > 0 ? value : undefined;
}

export function siteImageAlt(slot: SiteImageSlot): string {
  return SITE_IMAGES[slot].alt;
}

/**
 * Slideshow slots — the same idea as SITE_IMAGES, but a list.
 *
 * The hero panels crossfade through these. Rules:
 *   - 0 images: the component falls back to the single SITE_IMAGES slot,
 *     then to the designed placeholder. Nothing breaks.
 *   - 1 image:  renders as a still. No animation, no controls.
 *   - 2+:       crossfades, with a pause control and reduced-motion
 *               support handled by the component.
 *
 * Keep each set visually consistent — same light and treatment — or the
 * crossfade will look like a glitch rather than a transition.
 */
export const SITE_SLIDESHOWS = {
  /**
   * Home hero, large right panel. 4:3, 1600x1200.
   *
   * Ordered as one project progressing — foundation, frame, finished —
   * so the crossfade reads as build stages rather than three unrelated
   * photos. Keep that order if you swap any of them.
   */
  homeHero: [
    {
      src: "/images/hero-stage-1-foundation.webp",
      alt: "Foundation formwork and rebar set on a residential lot at sunrise",
    },
    {
      src: "/images/hero-stage-2-framing.webp",
      alt: "A two-storey house framed with roof trusses set, lumber stacked on site",
    },
    {
      src: "/images/hero-stage-3-finished.webp",
      alt: "The finished house with siding, windows and landscaping complete",
    },
  ] as SiteImage[],

  /**
   * Premium package section panel. 4:3, 1600x1200.
   *
   * Sequenced plan -> selection -> result, mirroring how the service
   * actually runs. Slides 2 and 3 deliberately share materials (walnut,
   * quartz, matte black), so the crossfade shows the choices arriving in
   * the finished room rather than three unrelated interiors.
   */
  premium: [
    {
      src: "/images/premium-1-plans.webp",
      alt: "Architectural floor plans on a timber table with a tape measure and pencil",
    },
    {
      src: "/images/premium-2-materials.webp",
      alt: "Material selections laid out flat: quartz, tile, walnut flooring and matte black hardware",
    },
    {
      src: "/images/premium-3-finished.webp",
      alt: "The finished kitchen in those materials, with plans resting on the island",
    },
  ] as SiteImage[],
} satisfies Record<string, SiteImage[]>;

export type SlideshowSlot = keyof typeof SITE_SLIDESHOWS;

/** Slides for a slot, filtered to those that actually have a src set. */
export function slideshow(slot: SlideshowSlot): SiteImage[] {
  return SITE_SLIDESHOWS[slot].filter((image) => image.src.trim().length > 0);
}
