import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/shared/page-hero";

export function ProductsHero() {
  return (
    <PageHero
      eyebrow="CareBy Supply"
      title="Everything you need to build better."
      subtitle="Building materials, tools and supplies — sourced for your project and delivered when you need them."
      imageSlot="productsHero"
      actions={
        <>
          <Button
            variant="hi-vis"
            size="lg"
            className="press w-full sm:w-auto"
            render={<Link href="#catalog">Shop Products</Link>}
          />
          <Button
            size="lg"
            variant="outline"
            className="press w-full border-white/25 bg-transparent text-ink-foreground hover:bg-white/10 hover:text-ink-foreground sm:w-auto"
            render={
              <Link href="/contact?about=quote">
                Get a Project Quote <ArrowRight className="size-4" />
              </Link>
            }
          />
        </>
      }
    />
  );
}
