import "server-only";

/**
 * Converts the chatbot price into other currencies for display only. The
 * payment provider charges in the plan's own currency.
 *
 * open.er-api.com is free and keyless; results are cached for 12 hours.
 * If it's unreachable, approximate fallback rates are used.
 */
export type Currency = "CAD" | "USD" | "INR";

// Approximate value of 1 unit of each currency in CAD.
const FALLBACK_IN_CAD: Record<Currency, number> = { CAD: 1, USD: 1.43, INR: 0.0155 };

export type FxRates = { rates: Record<Currency, number>; live: boolean };

/** Rates from `base`: amount × rates[X] = amount in X. */
export async function fxFrom(base: Currency): Promise<FxRates> {
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${base}`, {
      next: { revalidate: 12 * 60 * 60 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as { result?: string; rates?: Record<string, number> };
    const r = data.rates;
    if (data.result !== "success" || !r?.CAD || !r?.USD || !r?.INR) throw new Error("bad payload");
    return { rates: { CAD: r.CAD, USD: r.USD, INR: r.INR }, live: true };
  } catch (e) {
    console.warn("[chatbot fx] using fallback rates:", e);
    const b = FALLBACK_IN_CAD[base];
    const rates = Object.fromEntries(
      (Object.keys(FALLBACK_IN_CAD) as Currency[]).map((c) => [c, b / FALLBACK_IN_CAD[c]]),
    ) as Record<Currency, number>;
    return { rates, live: false };
  }
}
