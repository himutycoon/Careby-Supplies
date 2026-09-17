import type { PostgrestError } from "@supabase/supabase-js";

/**
 * Shared plumbing for the data-access layer.
 *
 * Every service returns ServiceResult so callers handle failure the same
 * way, and so raw Postgres errors never reach the UI (spec §18).
 */
export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function ok<T>(data: T): ServiceResult<T> {
  return { ok: true, data };
}

export function fail<T>(error: string): ServiceResult<T> {
  return { ok: false, error };
}

/**
 * Maps a Postgres/PostgREST error to something safe to show a user.
 * The raw error is logged server-side for debugging, never surfaced.
 */
export function toUserMessage(
  error: PostgrestError | Error | null,
  fallback = "Something went wrong. Please try again.",
): string {
  if (!error) return fallback;

  const code = (error as PostgrestError).code;

  switch (code) {
    case "23505":
      return "That record already exists.";
    case "23503":
      return "A linked record is missing or was removed.";
    case "23514":
      return "Some of those values aren't allowed.";
    case "42501":
      return "You don't have permission to do that.";
    case "PGRST301":
    case "PGRST116":
      return "We couldn't find that record.";
    default:
      return fallback;
  }
}
