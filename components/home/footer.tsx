import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { NewsletterForm } from "@/components/home/newsletter-form";
import { CONTACT_INFO, FOOTER_COLUMNS } from "@/data/mock";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-6">
          <div className="col-span-2 flex flex-col gap-4">
            <Logo />
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Quality products, expert guidance, project planning and
              construction support — all from one platform.
            </p>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <a
                href={`mailto:${CONTACT_INFO.email}`}
                className="flex items-center gap-2 hover:text-foreground"
              >
                <Mail className="size-4" /> {CONTACT_INFO.email}
              </a>
              <a
                href={`tel:${CONTACT_INFO.phone}`}
                className="flex items-center gap-2 hover:text-foreground"
              >
                <Phone className="size-4" /> {CONTACT_INFO.phone}
              </a>
              <span className="flex items-center gap-2">
                <MapPin className="size-4" /> {CONTACT_INFO.address}
              </span>
            </div>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title} className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold">{column.title}</h3>
              <ul className="flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold">Stay in the loop</h3>
            <p className="text-sm text-muted-foreground">
              Renovation tips and product updates, no spam.
            </p>
          </div>
          <NewsletterForm />
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} CareBy Canada. All rights reserved.</p>
          <p>Serving Mississauga, Ontario.</p>
        </div>
      </div>
    </footer>
  );
}
