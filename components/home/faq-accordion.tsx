import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQS } from "@/data/mock";

export function FaqAccordion() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="mb-10 text-center">
        <h2>Frequently asked questions</h2>
      </div>

      <Accordion className="w-full">
        {FAQS.map((faq, index) => (
          <AccordionItem key={faq.question} value={`faq-${index}`}>
            <AccordionTrigger className="text-left">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Still have questions?{" "}
        <Link href="/faq" className="underline underline-offset-4 hover:text-foreground">
          Visit the full FAQ
        </Link>{" "}
        or{" "}
        <Link href="/contact" className="underline underline-offset-4 hover:text-foreground">
          contact us
        </Link>
        .
      </p>
    </section>
  );
}
