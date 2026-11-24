import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { DashboardSidebar } from "@/components/app-shell/dashboard-sidebar";
import { MobileTabBar } from "@/components/app-shell/mobile-tab-bar";
import { ADMIN_NAV } from "@/data/navigation";

/*
 * Every admin page renders per request and is never cached. A static admin
 * page gets `s-maxage=1y`, and the host's CDN/browser cache then served the
 * client-navigation payload (text/x-component) for a full page load, showing
 * raw RSC text instead of the page.
 */
export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex h-18 items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Logo />
            <Badge variant="secondary">Admin</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Back to site
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <DashboardSidebar items={ADMIN_NAV} />
        <main className="min-w-0 flex-1 bg-muted/20 pb-tabbar lg:pb-0">
          {children}
        </main>
      </div>

      <MobileTabBar items={ADMIN_NAV} />
    </>
  );
}
