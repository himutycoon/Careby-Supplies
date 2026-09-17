import { AppTopNav } from "@/components/app-shell/top-nav";
import { MobileTabBar } from "@/components/app-shell/mobile-tab-bar";
import { HOMEOWNER_NAV } from "@/data/navigation";

const LINKS = [
  { label: "Home", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "New estimate", href: "/new", icon: "Plus" },
];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppTopNav links={LINKS} homeHref="/dashboard" />
      <main className="flex-1 bg-muted/20 pb-tabbar lg:pb-0">{children}</main>
      <MobileTabBar items={HOMEOWNER_NAV} />
    </>
  );
}
