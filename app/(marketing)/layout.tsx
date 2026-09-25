import { Navbar } from "@/components/home/navbar";
import { PromoTicker } from "@/components/home/promo-ticker";
import { Footer } from "@/components/home/footer";
import { MobileTabBar } from "@/components/app-shell/mobile-tab-bar";
import { ExpertFab } from "@/components/shared/expert-fab";
import { MARKETING_TAB_NAV } from "@/data/navigation";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Above the header, like the announcement bar on any shop: it is
          an ad, and an ad below three sections of page is not an ad.
          Scrolls away with the page — the sticky header does not carry
          it, because a permanently pinned moving strip would follow the
          reader down every page. */}
      <PromoTicker />
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
      <ExpertFab />
    </>
  );
}
