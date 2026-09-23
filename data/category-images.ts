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
  // Photographed already.
  lumber: "/images/category-new-construction-framing.webp",
  plumbing: "/images/category-repair-plumbing.webp",
  flooring: "/images/category-renovation-kitchen.webp",

  // Add a path here as you get each photo, e.g.
  //   electrical: "/images/category-electrical.webp",
  electrical: "",
  "doors-windows": "",
  roofing: "",
  hardware: "",
  paint: "",
  tools: "",
  cabinetry: "",
  countertops: "",
  tile: "",
  appliances: "",
  hvac: "",
  "smart-home": "",
  outdoor: "",
  "window-coverings": "",
};

/** Photo for a category, or "" when it should fall back to its icon. */
export function categoryImage(id: string, fromDatabase?: string): string {
  return fromDatabase || CATEGORY_IMAGES[id] || "";
}

/**
 * Icon overrides for departments whose seeded icon reads badly.
 *
 * product_categories.icon is data, and the original seed gave Electrical
 * an AlertTriangle — which in an empty tile looks like a warning about
 * the department rather than a picture of it. Overridden here rather than
 * in a migration so it needs no database change; a photo replaces the
 * icon entirely anyway.
 */
const ICON_OVERRIDES: Record<string, string> = {
  electrical: "Package",
};

export function categoryIcon(id: string, icon: string): string {
  return ICON_OVERRIDES[id] ?? icon;
}
