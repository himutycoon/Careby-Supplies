import { createPersistedStore } from "@/lib/store/create-store";
import type { CartLine, UserRole } from "@/lib/types";

/**
 * Client-only state.
 *
 * Everything that belongs to a user (orders, projects, packages,
 * appointments, drawings) now lives in Supabase and is read through
 * services/. Only the pre-checkout basket and the pre-auth role hint
 * stay on the device.
 */

/** The basket before it becomes a real order. */
export const cartStore = createPersistedStore<CartLine[]>("careby.cart", []);

/**
 * The user type chosen at "Get Started", so the marketing surface can
 * route sensibly before authentication. Once signed in, profiles.role
 * is authoritative — this is only a hint and is never trusted for access.
 */
export const userTypeStore = createPersistedStore<UserRole | null>(
  "careby.userType",
  null,
);

/**
 * A material list in progress.
 *
 * The checklist is reachable from the public pricing page, but sending
 * it needs an account — so a visitor could tick twenty-nine stages,
 * write their notes, press send, and be told to log in with nothing
 * kept. Logging in also lands them on the dashboard rather than back
 * here, which made that a total loss.
 *
 * Held in a store rather than component state so it survives that round
 * trip, a refresh, or a stray back button. Attached files are not kept:
 * a File cannot be serialised, and silently dropping one is worse than
 * asking for it again.
 */
export interface MaterialListDraft {
  projectId: string;
  variantId: string;
  picked: string[];
  notes: string;
}

export const materialListDraftStore = createPersistedStore<MaterialListDraft>(
  "careby.materialListDraft",
  { projectId: "", variantId: "", picked: [], notes: "" },
);
