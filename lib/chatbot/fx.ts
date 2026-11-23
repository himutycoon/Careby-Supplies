import "server-only";

/**
 * INR → CAD / USD for showing the chatbot price to a Canadian client.
 * Display only: Razorpay charges in INR and the client's bank converts.
 *
 * open.er-api.com is free and keyless; the result is cached for 12 hours.
 * If it's unreachable, the approximate fallback rates are used instead.
 */
const FALLBACK = { CAD: 0.0163, USD: 0.0117 };

export type FxRates = { CAD: number; USD: number; live: boolean };

export async function inrRates(): Promise<FxRates> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/INR", {
      next: { revalidate: 12 * 60 * 60 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as { result?: string; rates?: Record<string, number> };
    const cad = data.rates?.CAD;
    const usd = data.rates?.USD;
    if (data.result !== "success" || !cad || !usd) throw new Error("bad payload");
    return { CAD: cad, USD: usd, live: true };
  } catch (e) {
    console.warn("[chatbot fx] using fallback rates:", e);
    return { ...FALLBACK, live: false };
  }
}
