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
  { label: "Services", href: "/services", icon: "Wrench" },
  { label: "Cart", href: "/cart", icon: "ShoppingCart", badge: "cart" },
];

export const CONTRACTOR_NAV: AppNavItem[] = [
  { label: "Dashboard", href: "/contractor", icon: "LayoutDashboard" },
  { label: "Shop Products", href: "/contractor/shop", icon: "ShoppingCart" },
  { label: "Call Order", href: "/contractor/call-order", icon: "Phone" },
  { label: "Create Package", href: "/contractor/packages/new", icon: "Package" },
  { label: "Category Order", href: "/contractor/category-order", icon: "ListOrdered" },
  { label: "Upload Drawing", href: "/contractor/drawings", icon: "FileUp" },
  { label: "Orders", href: "/contractor/orders", icon: "Receipt" },
  { label: "Projects", href: "/contractor/projects", icon: "FolderKanban" },
  { label: "Saved Packages", href: "/contractor/packages", icon: "Boxes" },
];

export const HOMEOWNER_NAV: AppNavItem[] = [
  { label: "Home", href: "/dashboard", icon: "Home" },
  { label: "Repair", href: "/repair", icon: "Wrench" },
  { label: "New Construction", href: "/new-construction", icon: "Building2" },
  { label: "Renovation", href: "/new", icon: "Ruler" },
  { label: "Shop Products", href: "/products", icon: "ShoppingCart" },
  { label: "Premium Package", href: "/premium-request", icon: "Crown" },
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
  { label: "New estimate", href: "/new", icon: "PencilRuler" },
  { label: "My projects", href: "/dashboard#projects", icon: "FolderKanban" },
  { label: "Orders", href: "/orders", icon: "Receipt" },
  { label: "Shop Products", href: "/products", icon: "ShoppingCart" },
  { label: "Premium Package", href: "/premium-request", icon: "Crown" },
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
