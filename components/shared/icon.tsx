import {
  AlertTriangle,
  Boxes,
  Building2,
  ClipboardList,
  Crown,
  FileCheck,
  FileUp,
  FolderKanban,
  HardHat,
  Headset,
  Home,
  Image as ImageIcon,
  LayoutDashboard,
  LayoutGrid,
  ListOrdered,
  MessageSquare,
  Package,
  PackageCheck,
  Palette,
  PencilRuler,
  Phone,
  Receipt,
  RefreshCw,
  Ruler,
  ShieldCheck,
  ShoppingCart,
  Store,
  Truck,
  UserCheck,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/**
 * Single icon registry. Content data (services, categories, nav) stores
 * icon *names* as strings so it stays serializable across the server →
 * client boundary and can eventually come from a CMS/admin.
 */
const REGISTRY: Record<string, LucideIcon> = {
  AlertTriangle,
  Boxes,
  Building2,
  ClipboardList,
  Crown,
  FileCheck,
  FileUp,
  FolderKanban,
  HardHat,
  Headset,
  Home,
  Image: ImageIcon,
  LayoutDashboard,
  LayoutGrid,
  ListOrdered,
  MessageSquare,
  Package,
  PackageCheck,
  Palette,
  PencilRuler,
  Phone,
  Receipt,
  RefreshCw,
  Ruler,
  ShieldCheck,
  ShoppingCart,
  Store,
  Truck,
  UserCheck,
  Wrench,
};

export function Icon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  // Direct registry lookup (not a factory call) — the component is
  // module-level, never created during render.
  const Resolved = REGISTRY[name] ?? Boxes;
  return <Resolved className={className} aria-hidden="true" />;
}
