import { Hero } from "@/components/home/hero";
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

export default function HomePage() {
  return (
    <>
      {/* The hero is above the fold — revealing it would just delay the
          first thing a visitor came to read. */}
      <Hero />

      {/*
        Storefront first, story second.

        The catalog used to be reachable only from /products, so a
        shopper landing here had no way to tell what CareBy actually
        stocks. Departments and two merchandising rails now sit directly
        under the hero; the planning and services sections that explain
        the rest of the business follow them.
      */}
      <ShopPromiseStrip />

      {[
        <ShopByCategory key="departments" />,
        <ProductRail
          key="popular"
          title="Popular right now"
          subtitle="What contractors and homeowners are ordering this month."
          query={{ sort: "popular" }}
          viewAllLabel="Shop all products"
        />,
        <UserTypeSection key="user-type" />,
        <ServiceShowcase key="showcase" />,
        <ProductRail
          key="top-rated"
          title="Top rated on site"
          subtitle="Rated 4 stars and up by the people who installed them."
          query={{ sort: "rating", minRating: 4 }}
          viewAllLabel="See top rated"
        />,
        <ServicesSection key="services" />,
        <HowItWorks key="how" />,
        <ProjectCategories key="categories" />,
        <PremiumSection key="premium" />,
        <TrustSection key="trust" />,
        <FaqAccordion key="faq" />,
        <CtaBand key="cta" />,
      ].map((section) => (
        <Reveal key={section.key}>{section}</Reveal>
      ))}
    </>
  );
}
