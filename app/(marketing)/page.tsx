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

export default function HomePage() {
  return (
    <>
      {/* The hero is above the fold — revealing it would just delay the
          first thing a visitor came to read. */}
      {/* Aisles before argument. The hero is the brand statement, but a
          supply shop that opens with one reads as a blog, so the
          departments sit above it and the storefront is the first thing
          under the navigation. */}
      <DepartmentBar />

      <Hero />

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
      <div className="hidden lg:block">
        <ShopPromiseStrip />
      </div>

      {[
        <ShopByCategory key="departments" />,
        <ProductRail
          key="popular"
          title="Popular right now"
          subtitle="What contractors and homeowners are ordering this month."
          query={{ sort: "popular" }}
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
        <TrustSection key="trust" />,
        <FaqAccordion key="faq" />,
        <CtaBand key="cta" />,
      ].map((section) => (
        <Reveal key={section.key}>{section}</Reveal>
      ))}
    </>
  );
}
