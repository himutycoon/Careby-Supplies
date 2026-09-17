import { Navbar } from "@/components/home/navbar";
import { Footer } from "@/components/home/footer";
import { MobileTabBar } from "@/components/app-shell/mobile-tab-bar";
import { MARKETING_TAB_NAV } from "@/data/navigation";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      {/*
        pb-tabbar clears the fixed bar (and the home-indicator inset) so
        the footer's last row isn't sitting underneath it. Desktop keeps
        its normal padding since the bar is lg:hidden.
      */}
      <div className="pb-tabbar lg:pb-0">
        <Footer />
      </div>
      <MobileTabBar items={MARKETING_TAB_NAV} />
    </>
  );
}
