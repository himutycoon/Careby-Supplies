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
