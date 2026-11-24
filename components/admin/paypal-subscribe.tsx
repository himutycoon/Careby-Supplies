"use client";

import * as React from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

/**
 * PayPal's subscription button (from PayPal's button factory), rendered in
 * the admin plan card so the client subscribes without leaving the site.
 *
 * The client ID is public by design: it only identifies which PayPal
 * account receives the payment.
 */

type PayPalButtons = {
  Buttons: (opts: {
    style?: Record<string, string>;
    createSubscription: (data: unknown, actions: { subscription: { create: (o: { plan_id: string }) => Promise<string> } }) => Promise<string>;
    onApprove: (data: { subscriptionID?: string }) => void;
    onError?: (err: unknown) => void;
  }) => { render: (el: HTMLElement) => Promise<void>; isEligible?: () => boolean };
};

declare global {
  interface Window {
    paypal?: PayPalButtons;
  }
}

const SCRIPT_ID = "paypal-sdk-subscriptions";

function loadSdk(clientId: string): Promise<PayPalButtons> {
  return new Promise((resolve, reject) => {
    if (window.paypal) return resolve(window.paypal);
    let s = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!s) {
      s = document.createElement("script");
      s.id = SCRIPT_ID;
      s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&vault=true&intent=subscription`;
      s.async = true;
      s.dataset.sdkIntegrationSource = "button-factory";
      document.body.appendChild(s);
    }
    s.addEventListener("load", () => (window.paypal ? resolve(window.paypal) : reject(new Error("PayPal not available"))));
    s.addEventListener("error", () => reject(new Error("PayPal script failed to load")));
  });
}

export function PayPalSubscribe({ clientId, planId }: { clientId: string; planId: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [state, setState] = React.useState<"loading" | "ready" | "error">("loading");
  const [subId, setSubId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    loadSdk(clientId)
      .then((paypal) => {
        if (cancelled || !ref.current) return;
        ref.current.innerHTML = "";
        return paypal
          .Buttons({
            style: { shape: "rect", color: "blue", layout: "vertical", label: "subscribe" },
            createSubscription: (_data, actions) => actions.subscription.create({ plan_id: planId }),
            onApprove: (data) => setSubId(data.subscriptionID ?? "confirmed"),
            onError: (err) => {
              console.error("[paypal]", err);
              setState("error");
            },
          })
          .render(ref.current)
          .then(() => !cancelled && setState("ready"));
      })
      .catch((err) => {
        console.error("[paypal]", err);
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [clientId, planId]);

  if (subId) {
    return (
      <div className="flex flex-col items-center gap-1.5 rounded-lg border border-emerald-600/30 bg-emerald-600/10 p-3 text-center text-sm">
        <CheckCircle2 className="size-5 text-emerald-600" aria-hidden="true" />
        <p className="font-semibold text-emerald-700 dark:text-emerald-400">Thank you, auto-pay is set up</p>
        <p className="text-xs text-muted-foreground">
          PayPal will email your receipt. Subscription ID: <span className="font-mono">{subId}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {state === "loading" ? (
        <p className="flex h-11 items-center justify-center gap-2 rounded-lg border border-border text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Loading PayPal…
        </p>
      ) : null}
      {state === "error" ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-center text-xs text-destructive">
          PayPal couldn&apos;t load. Turn off ad blockers for this page and refresh.
        </p>
      ) : null}
      {/* PayPal renders its buttons into this element */}
      <div ref={ref} className={state === "ready" ? "min-h-11" : "hidden"} />
    </div>
  );
}
