import { AppTopNav } from "@/components/app-shell/top-nav";
import { DashboardSidebar } from "@/components/app-shell/dashboard-sidebar";
import { MobileTabBar } from "@/components/app-shell/mobile-tab-bar";
import { CONTRACTOR_NAV } from "@/data/navigation";

export default function ContractorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppTopNav links={[]} homeHref="/contractor" showSearch />
      <div className="flex flex-1">
        <DashboardSidebar items={CONTRACTOR_NAV} />
        <main className="min-w-0 flex-1 bg-muted/20 pb-tabbar lg:pb-0">
          {children}
        </main>
      </div>
      <MobileTabBar items={CONTRACTOR_NAV} />
    </>
  );
}
