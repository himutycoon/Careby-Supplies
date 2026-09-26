/**
 * Department photos — the one file to edit when adding category images.
 *
 * Same idea as data/site-images.ts: drop a file in `public/images/` and
 * put its path here. An empty string is a valid state, not a broken one —
 * the tile falls back to its icon, so a half-photographed catalogue still
 * looks deliberate.
 *
 * A category can also carry `image_url` in the database (the admin
 * uploader writes it). That wins over this file, so a photo added through
 * the admin panel does not need a deploy.
 *
 * Guidance: landscape, about 800×600, under ~150KB. These load on the
 * home page, above the fold on a phone.
 */
export const CATEGORY_IMAGES: Record<string, string> = {
  lumber: "/images/category-new-construction-framing.webp",
  plumbing: "/images/category-repair-plumbing.webp",
  flooring: "/images/category-renovation-kitchen.webp",
  electrical: "/images/category-electrical.webp",
  "doors-windows": "/images/category-doors-windows.webp",
  roofing: "/images/category-roofing.webp",
  hardware: "/images/category-hardware.webp",
  paint: "/images/category-paint.webp",
  tools: "/images/category-tools.webp",
  cabinetry: "/images/category-cabinetry.webp",
  countertops: "/images/category-countertops.webp",
  tile: "/images/category-tile.webp",
  appliances: "/images/category-appliances.webp",
  hvac: "/images/category-hvac.webp",
  "smart-home": "/images/category-smart-home.webp",
  outdoor: "/images/category-outdoor.webp",
  "window-coverings": "/images/category-window-coverings.webp",

  /*
   * Six departments the real catalogue brought with it (schema-15).
   * No photography for them yet, so they fall through to their icon —
   * a deliberate empty string rather than a missing key, so it is
   * obvious what still needs shooting.
   */
  drywall: "",
  insulation: "",
  adhesives: "",
  concrete: "",
  "metal-framing": "",
  bath: "",
};

/** Photo for a category, or "" when it should fall back to its icon. */
export function categoryImage(id: string, fromDatabase?: string): string {
  return fromDatabase || CATEGORY_IMAGES[id] || "";
}

/**
 * Icon overrides for departments whose seeded icon reads badly.
 *
 * The six departments added with the real catalogue have no photos yet,
 * so they render as icons and this matters again. The original seed gave
 * Electrical an AlertTriangle,
 * which in an empty tile reads as a warning about the department rather
 * than a picture of it.
 */
const ICON_OVERRIDES: Record<string, string> = {
  electrical: "Package",
};

export function categoryIcon(id: string, icon: string): string {
  return ICON_OVERRIDES[id] ?? icon;
}
