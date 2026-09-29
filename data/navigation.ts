/**
 * Role-scoped application navigation. Icon names are strings so these
 * stay serializable from server layouts into client nav components.
 */
export interface AppNavItem {
  label: string;
  href: string;
  icon: string;
  /** Optional sidebar grouping. Items sharing a group must be adjacent. */
  group?: string;
  /** Renders a live count on the icon. Only the cart needs one today. */
  badge?: "cart";
  /**
   * Picks out the earning feature in the brand's safety yellow.
   *
   * The dashboard tile is gold and the sidebar entry beside it was not,
   * which made the same feature look like two different things.
   */
  premium?: boolean;
}

/**
 * Public site bottom navigation, phones only.
 *
 * Exactly four items on purpose: MobileTabBar adds a "More" sheet beyond
 * four, and the marketing header already has a drawer holding the full
 * nav and the Get a Quote CTA. Two drawers doing the same job is worse
 * than a slightly shorter bar.
 */
export const MARKETING_TAB_NAV: AppNavItem[] = [
  { label: "Home", href: "/", icon: "Home" },
  // Shop is a storefront, Cart is the cart — and ShoppingCart matches
  // the header's cart icon. The previous pairing had Shop wearing a
  // cart icon while Cart used "ShoppingBag", which isn't registered at
  // all and was silently falling back to the Boxes glyph.
  { label: "Shop", href: "/products", icon: "Store" },
  // "Services" under a wrench read as a repair company. The page sells
  // takeoffs, pricing and delivery, so it gets the ruler.
  { label: "Services", href: "/services", icon: "Ruler" },
  { label: "Cart", href: "/cart", icon: "ShoppingCart", badge: "cart" },
];

/**
 * Tabs the phone bar shows directly; the rest go behind "More".
 *
 * Here rather than in the tab bar component so a dashboard can ask
 * which destinations are already a thumb's reach away without importing
 * a client component to find out.
 */
export const PHONE_TAB_COUNT = 4;

/*
 * Order matters: the phone tab bar takes the first four of these and
 * puts the rest behind "More".
 *
 * Those four are deliberately the places a contractor RETURNS to --
 * home, their cart, their orders, their projects. The things they START
 * (shop, phone order, build a package, order by category, send a
 * drawing) are the dashboard tiles, and having the same four as tabs an
 * inch below them was the same list twice. The bar and the dashboard now
 * answer different questions, so neither has to hide.
 *
 * No Cart tab on purpose: the top bar carries the cart on every screen,
 * including phones, so a tab would be the same duplication again.
 */
export const CONTRACTOR_NAV: AppNavItem[] = [
  { label: "Dashboard", href: "/contractor", icon: "LayoutDashboard" },
  { label: "Orders", href: "/contractor/orders", icon: "Receipt" },
  { label: "Projects", href: "/contractor/projects", icon: "FolderKanban" },
  { label: "Packages", href: "/contractor/packages", icon: "Boxes" },
  { label: "Shop Products", href: "/contractor/shop", icon: "Store" },
  { label: "Phone Order", href: "/contractor/call-order", icon: "Phone" },
  { label: "Create Package", href: "/contractor/packages/new", icon: "Package" },
  { label: "By Job Type", href: "/contractor/category-order", icon: "ListOrdered" },
  { label: "Upload Drawing", href: "/contractor/drawings", icon: "FileUp" },
];

/**
 * The phone tab bar, which takes the first four of these as its tabs and
 * puts the rest behind "More".
 *
 * Labels are one word because they render at 11px in a ~70px cell and
 * line-clamp — "New Construction" was being cut off mid-word. Shop moved
 * into the four: this is a storefront, and it was previously buried in
 * the More sheet behind three intake flows.
 */
export const HOMEOWNER_NAV: AppNavItem[] = [
  { label: "Home", href: "/dashboard", icon: "Home" },
  { label: "Shop", href: "/products", icon: "Store" },
  { label: "Materials", href: "/materials", icon: "ClipboardList" },
  { label: "Parts", href: "/repair", icon: "Wrench" },
  { label: "Cost Guide", href: "/new-construction", icon: "Building2" },
  { label: "Premium", href: "/premium-request", icon: "Crown", premium: true },
];

/**
 * Desktop sidebar for the homeowner area.
 *
 * Separate from HOMEOWNER_NAV because the two answer different questions.
 * The phone tab bar holds the four flows a homeowner starts; the sidebar,
 * with room to spare, also holds the places they come back to — their
 * projects and their orders. "My projects" is an anchor because projects
 * and submissions are only listed on the dashboard; there is no separate
 * homeowner projects screen to link to.
 */
export const HOMEOWNER_SIDEBAR_NAV: AppNavItem[] = [
  { label: "Home", href: "/dashboard", icon: "Home" },
  { label: "Shop Products", href: "/products", icon: "ShoppingCart" },
  // The intake flows, named for what they hand you. On the phone these
  // are one word each; here there is room to say it properly. These
  // labels are the client's own, and must match the dashboard tiles —
  // the sidebar still said "Premium Supply" and still pointed at the
  // renovation estimate he asked us to retire, so a customer could
  // reach the old flow from here and never find the checklist at all.
  { label: "Renovation material list", href: "/materials", icon: "ClipboardList" },
  { label: "Repair parts", href: "/repair", icon: "Wrench" },
  { label: "Project cost guide", href: "/new-construction", icon: "Building2" },
  {
    label: "Premium takeoff & DIY",
    href: "/premium-request",
    icon: "Crown",
    premium: true,
  },
  { label: "My projects", href: "/dashboard#projects", icon: "FolderKanban" },
  { label: "Orders", href: "/orders", icon: "Receipt" },
];

/**
 * Grouped so twelve destinations read as four short lists. Order matters:
 * the sidebar prints a heading whenever the group changes, so items in
 * the same group must stay adjacent.
 *
 * The mobile tab bar takes the first four as its primary tabs, which is
 * why Dashboard / Orders / Products sit at the top — those are the
 * day-to-day screens.
 */
export const ADMIN_NAV: AppNavItem[] = [
  { label: "Dashboard", href: "/admin", icon: "LayoutDashboard", group: "Overview" },
  { label: "Orders", href: "/admin/orders", icon: "Receipt", group: "Overview" },

  { label: "Products", href: "/admin/products", icon: "Boxes", group: "Inventory" },
  {
    label: "Product picks",
    href: "/admin/curation",
    icon: "ListChecks",
    group: "Inventory",
  },
  { label: "Categories", href: "/admin/categories", icon: "LayoutGrid", group: "Inventory" },

  { label: "Messages", href: "/admin/messages", icon: "MessageSquare", group: "Requests" },
  { label: "Service Requests", href: "/admin/requests", icon: "ClipboardList", group: "Requests" },
  { label: "Premium Requests", href: "/admin/premium", icon: "Crown", group: "Requests" },
  { label: "Call Orders", href: "/admin/calls", icon: "Phone", group: "Requests" },
  { label: "Drawings", href: "/admin/drawings", icon: "FileUp", group: "Requests" },
  { label: "Projects", href: "/admin/projects", icon: "FolderKanban", group: "Requests" },
  { label: "Submissions", href: "/admin/submissions", icon: "Ruler", group: "Requests" },

  { label: "Customers", href: "/admin/users", icon: "UserCheck", group: "People" },
  { label: "Contractors", href: "/admin/contractors", icon: "HardHat", group: "People" },
];
