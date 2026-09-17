"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Copy, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WizardFrame, WizardStep } from "@/components/wizard-kit/wizard-frame";
import { ReviewStep } from "@/components/wizard-kit/review-step";
import { EditorialImage } from "@/components/shared/editorial-image";
import { EmptyState } from "@/components/shared/empty-state";
import { useToast } from "@/components/shared/toast";
import { createPackage } from "@/services/packages";
import { getProducts, getProductsByIds } from "@/services/products";
import { calculatePackageTotals } from "@/lib/rules/order-totals";
import { useAsyncData } from "@/lib/store/hooks";
import { PROJECT_FLOWS } from "@/data/project-flows";
import { formatCad } from "@/lib/format";
import type { CustomerPackage, PackageLine } from "@/lib/types";

const STEPS = ["Package Details", "Add Products", "Review", "Customer Access"];

export function PackageBuilder() {
  const { toast } = useToast();
  const [step, setStep] = React.useState(0);
  const [details, setDetails] = React.useState({
    packageName: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    projectType: "renovation",
  });
  const [lines, setLines] = React.useState<PackageLine[]>([]);
  const [query, setQuery] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [created, setCreated] = React.useState<CustomerPackage | null>(null);
  const [copied, setCopied] = React.useState(false);

  // Products currently in the package, resolved from the catalog.
  const lineIds = React.useMemo(
    () => lines.map((l) => l.productId).sort().join(","),
    [lines],
  );
  const { data: lineProducts } = useAsyncData(
    () => getProductsByIds(lineIds ? lineIds.split(",") : []),
    [lineIds],
  );

  const items = lines
    .map((line) => {
      const product = (lineProducts ?? []).find(
        (p) => p.id === line.productId,
      );
      return product ? { product, quantity: line.quantity } : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  // Trade pricing — the contractor is the buyer.
  const totals = calculatePackageTotals(
    items.map(({ product, quantity }) => ({
      unitPriceCad: product.contractorPriceCad,
      quantity,
    })),
  );

  const { data: searchPage } = useAsyncData(
    () => getProducts({ search: query, pageSize: query.trim() ? 6 : 4 }),
    [query],
  );
  const searchResults = searchPage?.items ?? [];

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    details.customerEmail.trim(),
  );
  const detailsValid =
    details.packageName.trim() !== "" &&
    details.customerName.trim() !== "" &&
    emailValid;

  const canContinue =
    (step === 0 && detailsValid) || (step === 1 && items.length > 0) || step === 2;

  function addProduct(productId: string) {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === productId);
      return existing
        ? prev.map((l) =>
            l.productId === productId ? { ...l, quantity: l.quantity + 1 } : l,
          )
        : [...prev, { productId, quantity: 1 }];
    });
  }

  async function handleNext() {
    if (step < 2) {
      setStep((s) => s + 1);
      return;
    }

    setSubmitting(true);
    const result = await createPackage({
      name: details.packageName,
      projectType: details.projectType,
      customer: {
        name: details.customerName,
        email: details.customerEmail,
        phone: details.customerPhone,
      },
      lines,
    });
    setSubmitting(false);

    if (!result.ok) {
      toast(result.error, "error");
      return;
    }

    setCreated(result.data);
    setStep(3);
    toast(`Package ${result.data.id} created`);
  }

  if (created) {
    const portalPath = `/customer/package/${created.id}`;
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card px-6 py-14 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-success/12 text-success">
          <Check className="size-7" aria-hidden="true" />
        </span>
        <h2 className="text-2xl">Customer package created successfully</h2>
        <p className="max-w-sm text-muted-foreground">
          Send {created.customer.name} the portal link below — it&apos;s how
          they view this package and track its status.
        </p>

        <dl className="mt-2 grid w-full max-w-xs gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Package ID</dt>
            <dd className="font-semibold">{created.id}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Access code</dt>
            <dd className="font-semibold">{created.accessCode}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Total</dt>
            <dd className="font-semibold tabular-nums">
              {formatCad(created.totalPrice ?? totals.total)}
            </dd>
          </div>
        </dl>

        <div className="mt-2 w-full max-w-sm rounded-xl border border-border bg-muted/40 p-4 text-left">
          <p className="text-xs font-medium text-muted-foreground">
            Customer portal link
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded bg-background px-2 py-1.5 text-xs">
              {portalPath}
            </code>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Copy portal link"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    `${window.location.origin}${portalPath}`,
                  );
                  setCopied(true);
                  toast("Link copied");
                  setTimeout(() => setCopied(false), 1600);
                } catch {
                  toast("Couldn't copy — select the link manually.", "error");
                }
              }}
            >
              {copied ? (
                <Check className="size-3.5" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </Button>
          </div>
        </div>

        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Button render={<Link href={portalPath}>View portal</Link>} />
          <Button
            variant="outline"
            render={
              <Link href="/contractor/packages">All saved packages</Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <WizardFrame
      steps={STEPS}
      current={step}
      canContinue={canContinue}
      submitting={submitting}
      nextLabel={step === 2 ? "Generate customer access" : "Continue"}
      onBack={() => setStep((s) => Math.max(0, s - 1))}
      onNext={handleNext}
      aside={
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Preview</h2>
          <EditorialImage
            tone="sand"
            alt="Package preview"
            className="mt-3 aspect-4/3 w-full"
          />
          <p className="mt-3 font-medium">
            {details.packageName || "Untitled package"}
          </p>
          <p className="text-sm text-muted-foreground">
            {details.customerName || "Customer name"}
          </p>
          {details.customerEmail ? (
            <p className="truncate text-xs text-muted-foreground">
              {details.customerEmail}
            </p>
          ) : null}

          <dl className="mt-4 flex flex-col gap-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium tabular-nums">
                {formatCad(totals.subtotal)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd className="font-medium tabular-nums">
                {totals.delivery === 0 ? "—" : formatCad(totals.delivery)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">HST (13%)</dt>
              <dd className="font-medium tabular-nums">
                {formatCad(totals.tax)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base">
              <dt className="font-semibold">Total</dt>
              <dd className="font-semibold tabular-nums">
                {formatCad(totals.total)}
              </dd>
            </div>
          </dl>
        </div>
      }
    >
      {step === 0 ? (
        <WizardStep title="Package details">
          <div className="flex flex-col gap-2">
            <Label htmlFor="pkg-name">Package name</Label>
            <Input
              id="pkg-name"
              value={details.packageName}
              onChange={(e) =>
                setDetails({ ...details, packageName: e.target.value })
              }
              placeholder="Smith bathroom renovation"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="pkg-customer">Customer name</Label>
              <Input
                id="pkg-customer"
                value={details.customerName}
                onChange={(e) =>
                  setDetails({ ...details, customerName: e.target.value })
                }
                placeholder="John Smith"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="pkg-email">Customer email</Label>
              <Input
                id="pkg-email"
                type="email"
                value={details.customerEmail}
                onChange={(e) =>
                  setDetails({ ...details, customerEmail: e.target.value })
                }
                placeholder="john@email.com"
                aria-invalid={
                  details.customerEmail !== "" && !emailValid ? true : undefined
                }
                required
              />
              {details.customerEmail !== "" && !emailValid ? (
                <p className="text-xs text-destructive">
                  Enter a valid email address.
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="pkg-phone">Customer phone</Label>
              <Input
                id="pkg-phone"
                type="tel"
                value={details.customerPhone}
                onChange={(e) =>
                  setDetails({ ...details, customerPhone: e.target.value })
                }
                placeholder="(905) 555-0142"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="pkg-type">Project type</Label>
              <select
                id="pkg-type"
                value={details.projectType}
                onChange={(e) =>
                  setDetails({ ...details, projectType: e.target.value })
                }
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                {PROJECT_FLOWS.map((flow) => (
                  <option key={flow.id} value={flow.id}>
                    {flow.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </WizardStep>
      ) : null}

      {step === 1 ? (
        <WizardStep title="Add products">
          <div className="relative">
            <Search
              className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products to add…"
              aria-label="Search products"
              className="pl-9 md:pl-9"
            />
          </div>

          <ul className="flex flex-col gap-2">
            {searchResults.map((product) => (
              <li
                key={product.id}
                className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5"
              >
                <EditorialImage
                  tone={product.tone}
                  alt={product.name}
                  className="size-10 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCad(product.contractorPriceCad)} / {product.unit}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addProduct(product.id)}
                >
                  <Plus className="size-3.5" /> Add
                </Button>
              </li>
            ))}
          </ul>

          <div className="border-t border-border pt-4">
            <h3 className="mb-3 text-sm font-semibold">
              In this package ({items.length})
            </h3>
            {items.length === 0 ? (
              <EmptyState
                icon="Package"
                title="No products yet"
                description="Search above and add the materials this customer needs."
              />
            ) : (
              <ul className="flex flex-col gap-2">
                {items.map(({ product, quantity }) => (
                  <li
                    key={product.id}
                    className="flex flex-wrap items-center gap-3 rounded-lg bg-muted/50 px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCad(product.contractorPriceCad)} × {quantity}
                      </p>
                    </div>
                    <Input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) =>
                        setLines((prev) =>
                          prev.map((l) =>
                            l.productId === product.id
                              ? {
                                  ...l,
                                  quantity: Math.max(
                                    1,
                                    Number(e.target.value) || 1,
                                  ),
                                }
                              : l,
                          ),
                        )
                      }
                      className="w-18"
                      aria-label={`Quantity of ${product.name}`}
                    />
                    <span className="w-20 shrink-0 text-right text-sm font-semibold tabular-nums">
                      {formatCad(product.contractorPriceCad * quantity)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        setLines((prev) =>
                          prev.filter((l) => l.productId !== product.id),
                        )
                      }
                      aria-label={`Remove ${product.name}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </WizardStep>
      ) : null}

      {step === 2 ? (
        <WizardStep title="Review package">
          <ReviewStep
            rows={[
              { label: "Package", value: details.packageName },
              { label: "Customer", value: details.customerName },
              { label: "Email", value: details.customerEmail },
              { label: "Products", value: String(items.length) },
              { label: "Total", value: formatCad(totals.total) },
            ]}
          >
            <ul className="divide-y divide-border rounded-xl border border-border">
              {items.map(({ product, quantity }) => (
                <li
                  key={product.id}
                  className="flex justify-between gap-4 px-4 py-3 text-sm"
                >
                  <span className="min-w-0 truncate">
                    {product.name}{" "}
                    <span className="text-muted-foreground">× {quantity}</span>
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">
                    {formatCad(product.contractorPriceCad * quantity)}
                  </span>
                </li>
              ))}
            </ul>
          </ReviewStep>
        </WizardStep>
      ) : null}
    </WizardFrame>
  );
}
