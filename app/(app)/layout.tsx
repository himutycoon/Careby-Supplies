import { AppTopNav } from "@/components/app-shell/top-nav";
import { DashboardSidebar } from "@/components/app-shell/dashboard-sidebar";
import { MobileTabBar } from "@/components/app-shell/mobile-tab-bar";
import { HOMEOWNER_NAV, HOMEOWNER_SIDEBAR_NAV } from "@/data/navigation";

/**
 * Homeowner shell — the same sidebar layout the contractor area uses.
 *
 * The top nav used to carry a two-link row (Home, New estimate) because
 * there was nowhere else for navigation to live on desktop. The sidebar
 * holds it now, so the top bar gets the search field instead, matching
 * the contractor shell. Phones keep the bottom tab bar; the sidebar is
 * lg and up only.
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppTopNav links={[]} homeHref="/dashboard" showSearch />
      <div className="flex flex-1">
        <DashboardSidebar items={HOMEOWNER_SIDEBAR_NAV} />
        <main className="min-w-0 flex-1 bg-muted/20 pb-tabbar lg:pb-0">
          {children}
        </main>
      </div>
      <MobileTabBar items={HOMEOWNER_NAV} />
    </>
  );
}
