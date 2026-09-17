"use client";

import * as React from "react";
import Link from "next/link";
import { MessageSquare, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EditorialImage } from "@/components/shared/editorial-image";
import { DisclaimerBox } from "@/components/shared/disclaimer-box";
import { StepIndicator } from "@/components/shared/step-indicator";
import { EmptyState } from "@/components/shared/empty-state";
import { PanelSkeleton } from "@/components/shared/skeleton";
import { getPackageByReference } from "@/services/packages";
import { getProductsByIds } from "@/services/products";
import { calculatePackageTotals } from "@/lib/rules/order-totals";
import { CONTACT_INFO } from "@/data/mock";
import { formatCad, formatDate } from "@/lib/format";
import type { CustomerPackage, Product } from "@/lib/types";

const STAGES = ["Package sent", "Approved", "Materials ready", "Delivered"];
const STAGE_INDEX: Record<CustomerPackage["status"], number> = {
  draft: 0,
  sent: 0,
  approved: 1,
  ordered: 2,
};

export function PackagePortal({ packageId }: { packageId: string }) {
  const [pkg, setPkg] = React.useState<CustomerPackage | null>(null);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    getPackageByReference(packageId)
      .then(async (data: CustomerPackage | null) => {
        if (cancelled) return;
        setPkg(data);
        if (data && data.lines.length > 0) {
          const resolved = await getProductsByIds(
            data.lines.map((l) => l.productId),
          );
          if (!cancelled) setProducts(resolved);
        }
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [packageId]);

  if (!loaded) {
    return (
      <div className="flex flex-col gap-4">
        <PanelSkeleton rows={2} />
        <PanelSkeleton rows={4} />
      </div>
    );
  }

  if (!pkg) {
    return (
      <EmptyState
        icon="Package"
        title="Package not found"
        description="This package doesn't exist, or it was created in a different browser — prototype packages are stored locally."
        action={<Button render={<Link href="/">Back to home</Link>} />}
      />
    );
  }

  const items = pkg.lines
    .map((line) => {
      const product = products.find((p) => p.id === line.productId);
      return product ? { product, quantity: line.quantity } : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const totals = calculatePackageTotals(
    items.map(({ product, quantity }) => ({
      unitPriceCad: product.contractorPriceCad,
      quantity,
    })),
  );

  return (
    <>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
            Your project
          </span>
          <h1 className="mt-2 text-4xl">{pkg.name}</h1>
          <p className="mt-1 text-muted-foreground">
            Prepared for {pkg.customer.name} · {formatDate(pkg.createdAt)}
          </p>
        </div>
        <Badge variant="secondary" className="capitalize">
          {pkg.status}
        </Badge>
      </div>

      <div className="mb-10 rounded-xl border border-border bg-card p-6">
        <h2 className="mb-5 text-sm font-semibold">Project status</h2>
        <StepIndicator steps={STAGES} current={STAGE_INDEX[pkg.status]} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-start">
        <section>
          <h2 className="mb-4 text-lg">Selected products</h2>
          {items.length === 0 ? (
            <EmptyState
              icon="Boxes"
              title="No products in this package"
              description="Your contractor hasn't added materials yet."
            />
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border bg-card">
              {items.map(({ product, quantity }) => (
                <li key={product.id} className="flex items-center gap-4 p-4">
                  <EditorialImage
                    tone={product.tone}
                    alt={product.name}
                    className="size-16 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {product.brand} · {formatCad(product.contractorPriceCad)}{" "}
                      / {product.unit}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm text-muted-foreground">
                    × {quantity}
                  </span>
                  <span className="w-24 shrink-0 text-right text-sm font-semibold tabular-nums">
                    {formatCad(product.contractorPriceCad * quantity)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* Document upload isn't built yet. This used to render two
              invented filenames — "Material list.pdf" and "Project
              scope.pdf" — behind disabled Download buttons, which read to
              a customer as paperwork that exists and is being withheld.
              Better to say plainly that there is none. */}
          <h2 className="mt-8 mb-4 text-lg">Documents</h2>
          <div className="rounded-lg border border-dashed border-border px-4 py-5">
            <p className="text-sm text-muted-foreground">
              No documents yet. Your contractor can send quotes, drawings
              and scopes directly — ask them for anything you need in
              writing.
            </p>
          </div>
        </section>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-lg">Summary</h2>
            <dl className="mt-4 flex flex-col gap-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-medium tabular-nums">
                  {formatCad(totals.subtotal)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd className="font-medium tabular-nums">
                  {formatCad(totals.delivery)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">HST (13%)</dt>
                <dd className="font-medium tabular-nums">
                  {formatCad(totals.tax)}
                </dd>
              </div>
              <div className="mt-1 flex justify-between border-t border-border pt-3 text-base">
                <dt className="font-semibold">Total</dt>
                <dd className="font-semibold tabular-nums">
                  {formatCad(totals.total)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-lg">Need a hand?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Questions about this package? Reach your contractor or our
              support team.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Button
                variant="outline"
                className="justify-start"
                render={
                  <a href={`tel:${CONTACT_INFO.phone}`}>
                    <Phone className="size-4" /> {CONTACT_INFO.phone}
                  </a>
                }
              />
              <Button
                variant="outline"
                className="justify-start"
                render={
                  <Link href="/contact?about=package">
                    <MessageSquare className="size-4" /> Send a message
                  </Link>
                }
              />
            </div>
          </div>
        </aside>
      </div>

      <DisclaimerBox className="mt-10" />
    </>
  );
}
