"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  CircleCheck,
  CreditCard,
  Loader2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/empty-state";
import { StepIndicator } from "@/components/shared/step-indicator";
import { useCart } from "@/components/shop/cart-provider";
import { useToast } from "@/components/shared/toast";
import { OrderSummary } from "@/components/shop/order-summary";
import { createOrder, calculateOrderTotals } from "@/services/orders";
import { getProductsByIds } from "@/services/products";
import { getMyRole } from "@/services/profile";
import { useAsyncData } from "@/lib/store/hooks";
import { priceForRole } from "@/lib/pricing";
import { DELIVERY_OPTIONS } from "@/lib/delivery";
import { formatCad } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DeliveryMethod } from "@/lib/rules/order-totals";
import type { Order } from "@/lib/types";

const STEPS = ["Information", "Delivery", "Payment", "Confirmation"];

interface ContactForm {
  name: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
}

const EMPTY_CONTACT: ContactForm = {
  name: "",
  email: "",
  address: "",
  city: "Mississauga",
  postalCode: "",
};

function validateContact(contact: ContactForm): Partial<ContactForm> {
  const errors: Partial<ContactForm> = {};
  if (!contact.name.trim()) errors.name = "Enter your full name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (!contact.address.trim()) errors.address = "Enter a street address.";
  if (!contact.city.trim()) errors.city = "Enter a city.";
  if (!/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(contact.postalCode.trim())) {
    errors.postalCode = "Enter a valid postal code (e.g. L5B 3C1).";
  }
  return errors;
}

export function CheckoutFlow() {
  const { lines, clear } = useCart();
  const { toast } = useToast();

  const [step, setStep] = React.useState(0);
  const [summaryOpen, setSummaryOpen] = React.useState(false);
  const [delivery, setDelivery] = React.useState<DeliveryMethod>("standard");
  const [contact, setContact] = React.useState<ContactForm>(EMPTY_CONTACT);
  const [errors, setErrors] = React.useState<Partial<ContactForm>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = React.useState<Order | null>(null);

  /*
   * Whether Stripe is wired up in this environment.
   *
   * Read from the publishable key rather than a separate flag: if the key
   * is absent the redirect cannot work, so the UI must not promise a card
   * payment it can't take. Keeps local dev and a key-less deploy honest
   * instead of dead-ending the shopper at a broken Pay button.
   */
  const paymentsLive = Boolean(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  );

  const productIds = React.useMemo(
    () => lines.map((l) => l.productId).sort().join(","),
    [lines],
  );
  const { data: products } = useAsyncData(
    () => getProductsByIds(productIds ? productIds.split(",") : []),
    [productIds],
  );
  const { data: role } = useAsyncData(getMyRole);

  const orderLines = React.useMemo(
    () =>
      lines.flatMap((line) => {
        const product = (products ?? []).find((p) => p.id === line.productId);
        return product
          ? [
              {
                productId: product.id,
                name: product.name,
                brand: product.brand,
                unit: product.unit,
                unitPriceCad: priceForRole(product, role),
                quantity: line.quantity,
                projectId: line.projectId,
              },
            ]
          : [];
      }),
    [lines, products, role],
  );

  /*
   * The figure shown on the Pay button, from the same rules function
   * OrderSummary uses — not a second calculation. It is a preview only:
   * the amount Stripe actually charges comes from orders.total, which the
   * database computes, so a stale or tampered value here cannot change
   * what is billed.
   */
  const payableTotal = React.useMemo(
    () => calculateOrderTotals(orderLines, delivery).total,
    [orderLines, delivery],
  );

  if (lines.length === 0 && !placedOrder) {
    return (
      <EmptyState
        icon="ShoppingCart"
        title="Nothing to check out"
        description="Add materials to your cart first."
        action={<Button render={<Link href="/products">Shop Products</Link>} />}
      />
    );
  }

  if (placedOrder) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-xl border border-border bg-card px-6 py-16 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-success/12 text-success">
          <CircleCheck className="size-7" aria-hidden="true" />
        </span>
        <h2 className="text-2xl">Order placed successfully</h2>
        <p className="text-muted-foreground">
          We&apos;ll contact {placedOrder.contact.email} to confirm and
          schedule delivery. Your order is saved — you can reopen it any
          time from Orders.
        </p>

        <dl className="mt-2 w-full max-w-xs rounded-lg bg-muted/60 p-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Order ID</dt>
            <dd className="font-semibold">{placedOrder.id}</dd>
          </div>
          <div className="mt-2 flex justify-between">
            <dt className="text-muted-foreground">Total</dt>
            <dd className="font-semibold tabular-nums">
              {formatCad(placedOrder.total)}
            </dd>
          </div>
        </dl>

        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Button
            render={<Link href={`/orders/${placedOrder.id}`}>View order</Link>}
          />
          <Button
            variant="outline"
            render={<Link href="/products">Keep shopping</Link>}
          />
        </div>
      </div>
    );
  }

  async function handleContinue() {
    setSubmitError(null);

    if (step === 0) {
      const nextErrors = validateContact(contact);
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) return;
      setStep(1);
      return;
    }

    if (step === 1) {
      setStep(2);
      return;
    }

    // Payment step — create the order, then hand off to Stripe.
    setSubmitting(true);
    const result = await createOrder({
      // Send cart lines only — the database sets prices from the catalog.
      lines,
      // The id, not the label: recalculate_order_totals reads this column
      // to decide whether the delivery fee applies.
      deliveryMethod: delivery,
      contact,
    });

    if (!result.ok) {
      setSubmitting(false);
      setSubmitError(result.error);
      toast(result.error, "error");
      return;
    }

    const order = result.data;

    /*
     * Order first, payment second.
     *
     * The row exists before Stripe is involved, so an abandoned or failed
     * payment leaves a recoverable order (payment_status 'unpaid') rather
     * than a lost sale nobody can see. The cart is only cleared once the
     * order is safely stored.
     */
    clear();

    if (!paymentsLive) {
      setSubmitting(false);
      setPlacedOrder(order);
      setStep(3);
      toast(`Order ${order.id} placed`);
      return;
    }

    try {
      const response = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // The reference only. Never a price — the server reads the total
        // from the order row, which the database computed.
        body: JSON.stringify({ reference: order.id }),
      });

      const payload = (await response.json()) as {
        url?: string;
        error?: string;
      };

      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "We couldn't start the payment.");
      }

      // Full navigation, not router.push — this leaves the app for Stripe.
      window.location.assign(payload.url);
      return;
    } catch (error) {
      setSubmitting(false);
      /*
       * The order is already placed, so this is not a dead end: show the
       * confirmation with its reference and let them pay from the order
       * page. Losing the reference here would be the real failure.
       */
      const message =
        error instanceof Error
          ? error.message
          : "We couldn't start the payment.";
      setPlacedOrder(order);
      setStep(3);
      toast(`Order ${order.id} placed — ${message}`, "error");
    }
  }

  function field(
    key: keyof ContactForm,
    label: string,
    type = "text",
    autoComplete?: string,
  ) {
    const error = errors[key];
    return (
      <div className="flex flex-col gap-2">
        <Label htmlFor={`co-${key}`}>{label}</Label>
        <Input
          id={`co-${key}`}
          type={type}
          autoComplete={autoComplete}
          value={contact[key]}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `co-${key}-error` : undefined}
          onChange={(e) => {
            setContact({ ...contact, [key]: e.target.value });
            if (error) setErrors({ ...errors, [key]: undefined });
          }}
          className={error ? "border-destructive" : undefined}
        />
        {error ? (
          <p
            id={`co-${key}-error`}
            className="flex items-center gap-1.5 text-xs text-destructive"
          >
            <AlertCircle className="size-3" aria-hidden="true" />
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <StepIndicator steps={STEPS} current={step} />

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
        <form
          className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6"
          onSubmit={(e) => {
            e.preventDefault();
            handleContinue();
          }}
          noValidate
        >
          {step === 0 ? (
            <fieldset className="flex flex-col gap-5">
              <legend className="text-lg font-medium">
                Contact &amp; address
              </legend>
              <div className="grid gap-4 sm:grid-cols-2">
                {field("name", "Full name", "text", "name")}
                {field("email", "Email", "email", "email")}
                <div className="sm:col-span-2">
                  {field("address", "Street address", "text", "street-address")}
                </div>
                {field("city", "City", "text", "address-level2")}
                {field("postalCode", "Postal code", "text", "postal-code")}
              </div>
            </fieldset>
          ) : null}

          {step === 1 ? (
            <fieldset className="flex flex-col gap-4">
              <legend className="text-lg font-medium">Delivery method</legend>
              <div className="flex flex-col gap-3">
                {DELIVERY_OPTIONS.map((option) => (
                  <label
                    key={option.id}
                    className={cn(
                      "flex cursor-pointer items-center justify-between gap-4 rounded-lg border p-4 transition-colors",
                      delivery === option.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="delivery"
                        value={option.id}
                        checked={delivery === option.id}
                        onChange={() => setDelivery(option.id)}
                        className="size-4 accent-primary"
                      />
                      <span className="flex flex-col">
                        <span className="text-sm font-medium">
                          {option.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {option.detail}
                        </span>
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-medium text-muted-foreground">
                      {option.note}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}

          {step === 2 ? (
            <fieldset className="flex flex-col gap-5">
              <legend className="text-lg font-medium">Payment</legend>

              {paymentsLive ? (
                <p className="flex items-start gap-2 rounded-lg bg-muted px-3 py-2.5 text-xs text-muted-foreground">
                  <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  <span>
                    You&apos;ll be taken to{" "}
                    <strong className="font-medium text-foreground">Stripe</strong>{" "}
                    to pay securely. Your card details never touch our
                    servers, and the order is placed first so nothing is
                    lost if you come back.
                  </span>
                </p>
              ) : (
                <p className="flex items-start gap-2 rounded-lg bg-warning/15 px-3 py-2.5 text-xs text-warning-foreground">
                  <AlertCircle
                    className="mt-0.5 size-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span>
                    <strong className="font-medium">
                      Payments are not configured.
                    </strong>{" "}
                    Your order will be recorded and the team will follow up
                    to arrange payment — no card is charged.
                  </span>
                </p>
              )}

              <div className="flex items-center gap-3 rounded-lg border border-border p-3.5">
                <CreditCard
                  className="size-5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {paymentsLive ? "Card — via Stripe" : "Invoice on follow-up"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {paymentsLive
                      ? "Visa, Mastercard, Amex, Apple Pay and Google Pay."
                      : "A member of the team will contact you."}
                  </p>
                </div>
                <span className="ml-auto shrink-0 text-base font-semibold tabular-nums">
                  {formatCad(payableTotal)}
                </span>
              </div>

              {submitError ? (
                <p
                  role="alert"
                  className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  <AlertCircle className="size-4 shrink-0" /> {submitError}
                </p>
              ) : null}
            </fieldset>
          ) : null}

          <div className="flex items-center justify-between border-t border-border pt-5">
            <Button
              type="button"
              variant="outline"
              disabled={step === 0 || submitting}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              <ArrowLeft className="size-4" /> Back
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Placing order…
                </>
              ) : step === 2 ? (
                <>
                  <Check className="size-4" /> Place order
                </>
              ) : (
                <>
                  Continue <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="lg:sticky lg:top-24">
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-5 py-4 lg:hidden"
            onClick={() => setSummaryOpen((v) => !v)}
            aria-expanded={summaryOpen}
          >
            <span className="text-sm font-medium">Order summary</span>
            <ChevronDown
              className={cn(
                "size-4 transition-transform",
                summaryOpen && "rotate-180",
              )}
              aria-hidden="true"
            />
          </button>

          <div className={cn("mt-3 lg:mt-0", !summaryOpen && "hidden lg:block")}>
            <OrderSummary lines={orderLines} deliveryMethod={delivery} />
          </div>
        </div>
      </div>
    </div>
  );
}
