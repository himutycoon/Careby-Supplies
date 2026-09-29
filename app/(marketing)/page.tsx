import { Hero } from "@/components/home/hero";
import { DepartmentBar } from "@/components/home/department-bar";
import { RoleChooserCard } from "@/components/home/role-chooser-card";
import { ExpertBanner } from "@/components/home/expert-banner";
import { ShopPromiseStrip } from "@/components/home/shop-promise-strip";
import { ShopByCategory } from "@/components/home/shop-by-category";
import { ProductRail } from "@/components/home/product-rail";
import { UserTypeSection } from "@/components/home/user-type-section";
import { ServicesSection } from "@/components/home/services-section";
import { ServiceShowcase } from "@/components/home/service-showcase";
import { HowItWorks } from "@/components/home/how-it-works";
import { ProjectCategories } from "@/components/home/project-categories";
import { PremiumSection } from "@/components/home/premium-section";
import { TrustSection } from "@/components/home/trust-section";
import { FaqAccordion } from "@/components/home/faq-accordion";
import { CtaBand } from "@/components/home/cta-band";
import { Reveal } from "@/components/shared/reveal";
import { HOME_FEATURED_SLOT } from "@/services/curated-products";

export default function HomePage() {
  return (
    <>
      {/* The hero is above the fold — revealing it would just delay the
          first thing a visitor came to read. */}
      <Hero />

      {/* Aisles immediately under the hero, then the service promises —
          the order a shopper needs them in. Both sit outside the Reveal
          list below: they are part of the masthead, and a storefront
          that fades its own aisles in reads as slow rather than polished. */}
      <DepartmentBar />
      <ShopPromiseStrip />

      {/* Phone only. The fork belongs above the fold on a small screen;
          desktop already has the hero pills and the section below. */}
      <RoleChooserCard />

      {/*
        Storefront first, story second.

        The catalog used to be reachable only from /products, so a
        shopper landing here had no way to tell what CareBy actually
        stocks. Departments and two merchandising rails now sit directly
        under the hero; the planning and services sections that explain
        the rest of the business follow them.
      */}
      {[
        <ShopByCategory key="departments" />,
        /*
         * Curated, not "popular". This rail sorted by review_count,
         * which is zero on all 3,449 products, so the shop window was
         * whichever rows had been updated most recently -- captioned
         * "what people are ordering this month", which was a claim
         * nothing in the database supported. Admin picks what greets a
         * visitor; until something is picked it falls back to the
         * newest stock, which is at least true.
         */
        <ProductRail
          key="featured"
          title="Our picks"
          subtitle="Chosen from the aisles we know best."
          slot={HOME_FEATURED_SLOT}
          query={{ sort: "newest" }}
          viewAllLabel="Shop all products"
        />,
        // Premium sits here, third, rather than ninth. It is the
        // highest-value thing a homeowner can buy, and below four
        // product rails nobody scrolled far enough to find it.
        <PremiumSection key="premium" />,
        <ExpertBanner key="expert" />,
        // Phones have RoleChooserCard above; this is the fuller version
        // for the screens with room for it.
        <div key="user-type" className="hidden lg:block">
          <UserTypeSection />
        </div>,
        <ServiceShowcase key="showcase" />,
        /*
         * Was "Top rated on site — rated 4 stars and up". No product has
         * a rating: the import left them at zero rather than invent
         * scores, so the rail matched nothing, returned null, and this
         * section of the home page silently did not exist. Newest
         * arrivals is true and never empty.
         */
        <ProductRail
          key="new-in"
          title="New in"
          subtitle="The latest to land in the warehouse."
          query={{ sort: "newest" }}
          viewAllLabel="Shop all products"
        />,
        <ServicesSection key="services" />,
        <HowItWorks key="how" />,
        <ProjectCategories key="categories" />,
        <TrustSection key="trust" />,
        <FaqAccordion key="faq" />,
        <CtaBand key="cta" />,
      ].map((section) => (
        <Reveal key={section.key}>{section}</Reveal>
      ))}
    </>
  );
}
